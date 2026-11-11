import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { MultipartFile } from "@fastify/multipart";
import { FastifyReply, FastifyRequest } from "fastify";
import { config, fmt } from "../../config";
import { BadRequestException } from "../../exception/badrequest.exception";
import {
  deleteCustomizationModel,
  getActiveCustomizationModels,
  getAllCustomizationModelsAdmin,
  upsertCustomizationModel,
} from "../../services/customization.service";
import logger from "../../utils/logger";

const sendError = (reply: FastifyReply, error: any) => {
  const formatted = fmt.formatError(error);
  const { status, ...body } = formatted;
  reply.status(status).send(body);
};

let cachedS3Client: S3Client | null = null;
function getS3Client(): S3Client {
  if (!cachedS3Client) {
    cachedS3Client = new S3Client({
      region: config.aws_region,
      endpoint: config.s3_endpoint,
      credentials: {
        accessKeyId: config.aws_access_key_id,
        secretAccessKey: config.aws_secret_access_key,
      },
    });
  }
  return cachedS3Client;
}

class CustomizationController {
  getActive = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const models = await getActiveCustomizationModels();
      reply.status(200).send(fmt.formatResponse(models, "Active customization 3D models retrieved"));
    } catch (err: any) {
      sendError(reply, err);
    }
  };

  adminList = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const models = await getAllCustomizationModelsAdmin();
      reply.status(200).send(fmt.formatResponse(models, "All customization 3D models retrieved"));
    } catch (err: any) {
      sendError(reply, err);
    }
  };

  adminUpsert = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = req.body as any;
      const model = await upsertCustomizationModel(body);
      reply.status(200).send(fmt.formatResponse(model, "Customization 3D model saved"));
    } catch (err: any) {
      sendError(reply, err);
    }
  };

  adminDelete = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = req.params as { id: string };
      const success = await deleteCustomizationModel(id);
      reply.status(200).send(fmt.formatResponse({ deleted: success }, "Customization 3D model deleted"));
    } catch (err: any) {
      sendError(reply, err);
    }
  };

  adminUpload = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!config.s3_bucket_name || !config.aws_access_key_id) {
        throw new BadRequestException({ message: "S3 upload is not configured" });
      }

      const body = req.body as Record<string, MultipartFile | any>;
      const file = body?.file as MultipartFile | undefined;
      const colorSlug = (body?.colorSlug?.value || body?.colorSlug || "tshirt").toString().toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const view = (body?.view?.value || body?.view || "front").toString().toLowerCase() === "back" ? "back" : "front";

      if (!file || typeof file.toBuffer !== "function") {
        throw new BadRequestException({ message: "Image file is required as 'file' field" });
      }

      const buffer = await file.toBuffer();
      const s3Key = `teeszone/customization/tshirts/${colorSlug}/${view}.png`;

      const s3 = getS3Client();
      await s3.send(
        new PutObjectCommand({
          Bucket: config.s3_bucket_name,
          Key: s3Key,
          Body: buffer,
          ContentType: "image/png",
          CacheControl: "public, max-age=31536000, immutable",
        })
      );

      const url = `https://${config.s3_bucket_name}.s3.${config.aws_region}.amazonaws.com/${s3Key}`;
      logger.info({ s3Key, url }, "3D Model image uploaded to S3");

      reply.status(200).send(fmt.formatResponse({ url, s3Key }, "3D Model image uploaded successfully"));
    } catch (err: any) {
      sendError(reply, err);
    }
  };
}

export default new CustomizationController();
