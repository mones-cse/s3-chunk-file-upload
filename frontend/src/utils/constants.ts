export const UPLOAD_CONSTANTS = {
  CHUNK_SIZE: 5 * 1024 * 1024, // 5MB chunks
  API_ENDPOINTS: {
    INIT: "http://localhost:5001/api/upload/init",
    CHUNK: "http://localhost:5001/api/upload/chunk",
    COMPLETE: "http://localhost:5001/api/upload/complete",
    ABORT: "http://localhost:5001/api/upload/abort",
  },
} as const;
