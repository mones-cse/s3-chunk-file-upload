export interface UploadState {
  uploadId: string;
  key: string;
  parts: UploadPart[];
  currentChunk: number;
  totalChunks: number;
  uploading: boolean;
  status: string;
  error: string | null;
  isPaused: boolean;
  resumeFrom: number;
}

export interface UploadPart {
  ETag: string;
  PartNumber: number;
}

export interface InitUploadResponse {
  uploadId: string;
  key: string;
}
