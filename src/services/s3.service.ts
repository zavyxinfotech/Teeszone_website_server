import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { config } from "../config";
import logger from "../utils/logger";

function getS3Client(): S3Client | null {
  if (!config.s3_bucket_name || !config.aws_access_key_id) {
    return null;
  }
  return new S3Client({
    region: config.aws_region,
    endpoint: config.s3_endpoint || undefined,
    credentials: {
      accessKeyId: config.aws_access_key_id,
      secretAccessKey: config.aws_secret_access_key,
    },
  });
}

/**
 * Extracts S3 Key from an image URL if it belongs to our S3 bucket.
 * Example: https://teeszone-catalogue-images-2026.s3.ap-southeast-2.amazonaws.com/teeszone/abcd.webp
 * Returns key: "teeszone/abcd.webp"
 */
export function extractS3Key(url: string): string | null {
  if (!url || typeof url !== "string") return null;

  if (url.includes("/upload/media/")) {
    const parts = url.split("/upload/media/");
    if (parts[1]) return parts[1].replace(/^\//, "");
  }

  if (config.s3_bucket_name && url.includes(config.s3_bucket_name)) {
    try {
      const parsed = new URL(url);
      const key = parsed.pathname.replace(/^\//, "");
      return key || null;
    } catch {
      // Ignore URL parse error
    }
  }

  if (url.includes("/teeszone/")) {
    const index = url.indexOf("teeszone/");
    if (index !== -1) return url.substring(index);
  }

  if (url.startsWith("/teeszone/") || url.startsWith("teeszone/")) {
    return url.replace(/^\//, "");
  }

  return null;
}

export async function deleteS3Object(url: string): Promise<boolean> {
  const key = extractS3Key(url);
  if (!key) return false;

  const s3 = getS3Client();
  if (!s3) return false;

  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: config.s3_bucket_name,
        Key: key,
      }),
    );
    logger.info({ key }, "Deleted object from S3");
    return true;
  } catch (err) {
    logger.error({ key, error: err }, "Failed to delete object from S3");
    return false;
  }
}

export async function deleteS3Objects(urls: string[]): Promise<void> {
  const validUrls = urls.filter(Boolean);
  await Promise.all(validUrls.map((url) => deleteS3Object(url)));
}
