// upload.ts
export interface FileUploadState {
  id: string;
  file: File;
  status: string;
  error: string | null;
  currentChunk: number;
  totalChunks: number;
  progress: number;
  isPaused: boolean;
}

export interface UploadPart {
  ETag: string;
  PartNumber: number;
}

export interface UploadResponse {
  uploadId: string;
  key: string;
}

export interface FileUploadInfo {
  uploadId: string;
  key: string;
  parts: UploadPart[];
  abortController: AbortController | null;
}

export interface FileStateRef {
  [key: string]: FileUploadInfo;
}
