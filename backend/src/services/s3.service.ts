// src/services/s3.service.ts
import {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from "@aws-sdk/client-s3";
import { config } from "../config";
import { MultipartUpload, UploadPart } from "../types/upload.types";

export class S3Service {
  private s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client(config.aws);
  }

  async initiateMultipartUpload(
    fileName: string
  ): Promise<{ uploadId: string; key: string }> {
    const key = `uploads/${Date.now()}-${fileName}`;

    const command = new CreateMultipartUploadCommand({
      Bucket: config.s3.bucket,
      Key: key,
    });

    const response = await this.s3Client.send(command);

    if (!response.UploadId) {
      throw new Error("Failed to initiate multipart upload");
    }

    return {
      uploadId: response.UploadId,
      key: key,
    };
  }

  async uploadPart(
    uploadId: string,
    key: string,
    partNumber: number,
    body: Buffer
  ): Promise<UploadPart> {
    const command = new UploadPartCommand({
      Bucket: config.s3.bucket,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
      Body: body,
    });

    const response = await this.s3Client.send(command);

    if (!response.ETag) {
      throw new Error(`Failed to upload part ${partNumber}`);
    }

    return {
      PartNumber: partNumber,
      ETag: response.ETag,
    };
  }

  async completeMultipartUpload(
    uploadId: string,
    key: string,
    parts: UploadPart[]
  ): Promise<string> {
    const command = new CompleteMultipartUploadCommand({
      Bucket: config.s3.bucket,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: { Parts: parts },
    });

    const response = await this.s3Client.send(command);
    return response.Location || "";
  }

  async abortMultipartUpload(uploadId: string, key: string): Promise<void> {
    const command = new AbortMultipartUploadCommand({
      Bucket: config.s3.bucket,
      Key: key,
      UploadId: uploadId,
    });

    await this.s3Client.send(command);
  }
}

export const s3Service = new S3Service();
