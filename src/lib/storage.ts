import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

function getClient() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!
    }
  });
}

export async function uploadAudio(buf: Buffer, mime: string, ext: string): Promise<string> {
  const bucket = process.env.R2_BUCKET_NAME!;
  const key = `audio/${randomUUID()}.${ext}`;
  await getClient().send(
    new PutObjectCommand({ Bucket: bucket, Key: key, Body: buf, ContentType: mime })
  );
  return key;
}

export async function getAudioUrl(key: string): Promise<string> {
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (publicUrl) return `${publicUrl.replace(/\/$/, "")}/${key}`;
  return getSignedUrl(
    getClient(),
    new GetObjectCommand({ Bucket: process.env.R2_BUCKET_NAME!, Key: key }),
    { expiresIn: 3600 }
  );
}
