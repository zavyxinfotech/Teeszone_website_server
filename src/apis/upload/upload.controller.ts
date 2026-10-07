import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { MultipartFile } from "@fastify/multipart";
import crypto from "crypto";
import { FastifyReply, FastifyRequest } from "fastify";
import { filetypeinfo } from "magic-bytes.js";
import sharp from "sharp";
import { config, fmt } from "../../config";
import { BadRequestException } from "../../exception/badrequest.exception";
import { CustomException } from "../../exception/custom.exception";
import { captureRequestError } from "../../utils/error-tracking";
import logger from "../../utils/logger";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/avif",
]);
const ALLOWED_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "heic",
  "heif",
  "avif",
]);
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_PIXELS = 50_000_000;
const MAX_DIMENSION = 8_000;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sendError = (reply: FastifyReply, error: any) => {
  const formatted = fmt.formatError(error);
  const { status, ...body } = formatted;
  reply.status(status).send(body);
};

const reject = (message: string, description?: string) =>
  new BadRequestException({ message, description });

class UploadController {
  image = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!config.s3_bucket_name || !config.s3_endpoint || !config.aws_access_key_id) {
        throw new CustomException({
          status: 503,
          code: "E503",
          message: "Uploads are not configured",
          description: "Set AWS_* and S3_* variables in the backend environment.",
        });
      }

      const body = req.body as Record<string, MultipartFile | undefined>;
      const file = body?.file;
      if (!file || typeof file.toBuffer !== "function") {
        throw reject("No file received", 'Send the image as a multipart field named "file".');
      }

      const userId = req.authUser?.userId;
      const claimedMime = file.mimetype;

      // mime type
      if (!ALLOWED_MIME_TYPES.has(claimedMime)) {
        logger.info({ userId, claimedMime, outcome: "rejected:mime" }, "upload rejected");
        throw reject("Only JPEG, PNG, WebP, and HEIC images are allowed.");
      }

      // filename
      const filename = file.filename ?? "";
      const parts = filename.toLowerCase().split(".");
      const ext = parts.length > 1 ? parts[parts.length - 1] : "";
      if (filename.length > 200 || !ALLOWED_EXTENSIONS.has(ext)) {
        logger.info({ userId, filename, outcome: "rejected:filename" }, "upload rejected");
        throw reject("Invalid file name", "Use a valid image file ending in .jpg, .jpeg, .png, .webp or .heic.");
      }

      // size
      const fileBuffer = await file.toBuffer();
      if (fileBuffer.length === 0 || fileBuffer.length > MAX_FILE_BYTES) {
        logger.info({ userId, bytes: fileBuffer.length, outcome: "rejected:size" }, "upload rejected");
        throw reject("File too large", "Maximum image size is 25 MB.");
      }

      // magic bytes check
      const detected = filetypeinfo(fileBuffer);
      const detectedMimes = detected.map((d) => d.mime).filter(Boolean) as string[];
      const magicOk =
        detectedMimes.length > 0
          ? detectedMimes.some((m) => ALLOWED_MIME_TYPES.has(m))
          : true; // allow sharp to attempt parsing if magic-bytes doesn't recognise HEIC/WebP variant
      if (!magicOk) {
        logger.info({ userId, claimedMime, detectedMimes, outcome: "rejected:magic" }, "upload rejected");
        throw reject("File content does not match its type.");
      }

      // metadata check via Sharp
      let meta: sharp.Metadata;
      try {
        meta = await sharp(fileBuffer, { limitInputPixels: MAX_PIXELS, failOn: "none" }).metadata();
      } catch (err) {
        logger.info({ userId, error: err, outcome: "rejected:sharp_parse" }, "upload image parse failed");
        throw reject("Invalid or corrupted image file.");
      }

      if (
        !meta.width ||
        !meta.height ||
        meta.width > MAX_DIMENSION ||
        meta.height > MAX_DIMENSION ||
        meta.width * meta.height > MAX_PIXELS
      ) {
        logger.info({ userId, width: meta.width, height: meta.height, outcome: "rejected:dimensions" }, "upload rejected");
        throw reject("Image dimensions too large", `Maximum ${MAX_DIMENSION}px per side.`);
      }

      // Auto-convert to WebP format with sharp
      let webpBuffer: Buffer;
      try {
        webpBuffer = await sharp(fileBuffer, { limitInputPixels: MAX_PIXELS, failOn: "none" })
          .rotate() // Auto-orient based on EXIF orientation tag
          .resize({
            width: 2500,
            height: 2500,
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: 82, effort: 4 })
          .toBuffer();
      } catch (err) {
        logger.error({ userId, error: err, outcome: "failed:webp_conversion" }, "WebP conversion failed");
        throw reject("Image processing failed", "Unable to convert image to WebP format.");
      }

      const s3 = new S3Client({
        region: config.aws_region,
        endpoint: config.s3_endpoint,
        credentials: {
          accessKeyId: config.aws_access_key_id,
          secretAccessKey: config.aws_secret_access_key,
        },
      });

      const key = `teeszone/${crypto.randomUUID()}.webp`;
      await s3.send(
        new PutObjectCommand({
          Bucket: config.s3_bucket_name,
          Key: key,
          Body: webpBuffer,
          ContentType: "image/webp",
          ContentDisposition: "inline",
        }),
      );
      
      const serverPort = process.env.PORT || "4010";
      const url = `http://localhost:${serverPort}/api/upload/media/${key}`;

      logger.info({ userId, key, bytes: webpBuffer.length, outcome: "accepted" }, "upload accepted (converted to webp)");
      reply.status(201).send(fmt.formatResponse({ url }, "Image uploaded as WebP"));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };

  media = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = (req.params ?? {}) as Record<string, string>;
      const key = params["*"] || "";
      if (!key) return reply.status(404).send("Not found");

      const s3 = new S3Client({
        region: config.aws_region,
        endpoint: config.s3_endpoint,
        credentials: {
          accessKeyId: config.aws_access_key_id,
          secretAccessKey: config.aws_secret_access_key,
        },
      });

      const res = await s3.send(
        new GetObjectCommand({
          Bucket: config.s3_bucket_name,
          Key: key,
        }),
      );

      if (!res.Body) {
        return reply.status(404).send("Image not found");
      }

      reply.header("Content-Type", res.ContentType || "image/webp");
      reply.header("Cache-Control", "public, max-age=31536000, immutable");
      return reply.send(res.Body);
    } catch (err) {
      return reply.status(404).send("Image not found");
    }
  };
}

export default new UploadController();
