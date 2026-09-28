import { z } from "zod";
import { envelope } from "../../utils/zod";

export const uploadImageSchema = {
  description:
    "Admin: upload a product image (multipart field `file`, JPEG/PNG only). The image is validated (magic bytes, dimensions) and re-encoded to JPEG before landing on S3.",
  tags: ["Upload"],
  summary: "Upload image",
  security: [{ ApiToken: [] }],
  consumes: ["multipart/form-data"],
  response: { 201: envelope(z.object({ url: z.string() })) },
};
