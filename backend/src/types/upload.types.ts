export interface MultipartUpload {
  UploadId: string;
  Key: string;
  Parts: UploadPart[];
}

export interface UploadPart {
  PartNumber: number;
  ETag: string;
}

export interface InitiateUploadResponse {
  uploadId: string;
  key: string;
}

export interface UploadChunkResponse {
  partNumber: number;
  ETag: string;
}

export interface CompleteUploadRequest {
  uploadId: string;
  key: string;
  parts: UploadPart[];
}
