// src/controllers/upload.controller.ts
import { Request, Response } from "express";
import { s3Service } from "../services/s3.service";
import { CompleteUploadRequest } from "../types/upload.types";

class UploadController {
  // Make these methods bound to the class instance
  initiateUpload = async (req: Request, res: Response) => {
    try {
      const { fileName } = req.body;

      if (!fileName) {
        return res.status(400).json({ error: "fileName is required" });
      }

      const { uploadId, key } = await s3Service.initiateMultipartUpload(
        fileName
      );

      res.json({ uploadId, key });
    } catch (error) {
      console.error("Error initiating upload:", error);
      res.status(500).json({ error: "Failed to initiate upload" });
    }
  };

  uploadChunk = async (req: Request, res: Response) => {
    try {
      console.log("uploadChunk", req.body);
      const partNumber = parseInt(req.body.partNumber);
      const uploadId = req.body.uploadId;
      const key = req.body.key;

      if (!req.file || !uploadId || !key || !partNumber) {
        return res.status(400).json({
          error: "Missing required fields",
        });
      }

      const part = await s3Service.uploadPart(
        uploadId,
        key,
        partNumber,
        req.file.buffer
      );

      res.json(part);
    } catch (error) {
      console.error("Error uploading chunk:", error);
      res.status(500).json({ error: "Failed to upload chunk" });
    }
  };

  completeUpload = async (
    req: Request<{}, {}, CompleteUploadRequest>,
    res: Response
  ) => {
    try {
      const { uploadId, key, parts } = req.body;

      if (!uploadId || !key || !parts) {
        return res.status(400).json({
          error: "Missing required fields",
        });
      }

      const location = await s3Service.completeMultipartUpload(
        uploadId,
        key,
        parts
      );
      res.json({ location });
    } catch (error) {
      console.error("Error completing upload:", error);
      res.status(500).json({ error: "Failed to complete upload" });
    }
  };

  abortUpload = async (req: Request, res: Response) => {
    try {
      const { uploadId, key } = req.body;

      if (!uploadId || !key) {
        return res.status(400).json({
          error: "Missing required fields",
        });
      }

      await s3Service.abortMultipartUpload(uploadId, key);
      res.json({ message: "Upload aborted successfully" });
    } catch (error) {
      console.error("Error aborting upload:", error);
      res.status(500).json({ error: "Failed to abort upload" });
    }
  };
}

export const uploadController = new UploadController();
