// src/config/index.ts
import { S3ClientConfig } from "@aws-sdk/client-s3";

interface Config {
  aws: S3ClientConfig;
  s3: {
    bucket: string;
  };
}

if (!process.env.AWS_ACCESS_KEY_ID) {
  throw new Error("AWS_ACCESS_KEY_ID is not defined in environment variables");
}

if (!process.env.AWS_SECRET_ACCESS_KEY) {
  throw new Error(
    "AWS_SECRET_ACCESS_KEY is not defined in environment variables"
  );
}

if (!process.env.AWS_REGION) {
  throw new Error("AWS_REGION is not defined in environment variables");
}

if (!process.env.S3_BUCKET_NAME) {
  throw new Error("S3_BUCKET_NAME is not defined in environment variables");
}

export const config: Config = {
  aws: {
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  },
  s3: {
    bucket: process.env.S3_BUCKET_NAME,
  },
};

// Log config (remove in production)
console.log("Config loaded:", {
  region: config.aws.region,
  bucket: config.s3.bucket,
  hasAccessKey: !!config.aws.credentials.accessKeyId,
  hasSecretKey: !!config.aws.credentials.secretAccessKey,
});
