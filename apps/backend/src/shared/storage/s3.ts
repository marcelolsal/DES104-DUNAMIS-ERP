import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { config } from "../config.js";

// Adaptador de almacenamiento de evidencias (ADR-0007). Único punto que conoce S3.
const s3 = new S3Client({
  region: config.AWS_REGION,
  credentials: {
    accessKeyId: config.AWS_ACCESS_KEY_ID,
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
  },
});

// Sube una evidencia y devuelve su URL. La BD guarda esta URL, no el binario.
export const subirEvidencia = async (
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<string> => {
  await s3.send(
    new PutObjectCommand({
      Bucket: config.S3_BUCKET_EVIDENCIAS,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  return `https://${config.S3_BUCKET_EVIDENCIAS}.s3.${config.AWS_REGION}.amazonaws.com/${key}`;
};
