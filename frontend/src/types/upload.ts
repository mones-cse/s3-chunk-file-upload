export interface UploadState {
  status: string;
  error: string | null;
  isUploading: boolean;
  currentChunk: number;
  isPaused: boolean;
}

export interface UploadInfoRef {
  uploadId: string;
  key: string;
  parts: UploadPart[];
  chunkSize: number;
  totalChunks: number;
  abortController: AbortController | null;
}

export interface UploadPart {
  ETag: string;
  PartNumber: number;
}

export interface UploadResponse {
  uploadId: string;
  key: string;
}
