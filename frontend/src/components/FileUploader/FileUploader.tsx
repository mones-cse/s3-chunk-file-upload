// src/components/FileUploader/FileUploader.tsx

import { useFileUpload } from "../../hooks/useFileUpload";
import {
  ErrorInfo,
  FileInfo,
  FileSelect,
  PauseResumeButton,
  ResetButton,
  UploadButton,
  UploadProgress,
  UploadStatus,
} from "./components";

const FileUploader: React.FC = () => {
  const {
    file,
    uploadState,
    uploadInfoRef,
    handleFileSelect,
    handleUpload,
    handlePauseResume,
    resetUpload,
  } = useFileUpload();

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-6 w-xl mx-auto flex flex-col items-center justify-center">
      <p className="text-3xl"> S3 Chunk File Upload Demo</p>
      <br />
      <FileSelect
        handleFileSelect={handleFileSelect}
        isUploading={uploadState.isUploading}
        fileName={file?.name}
      />

      {file && (
        <div className="space-y-4">
          <FileInfo file={file} />

          <div className="flex space-x-2">
            <UploadButton
              handleUpload={handleUpload}
              isUploading={uploadState.isUploading}
              isPaused={uploadState.isPaused}
            />
            <PauseResumeButton
              handlePauseResume={handlePauseResume}
              uploading={uploadState.isUploading}
              isPaused={uploadState.isPaused}
            />
            <ResetButton resetUpload={resetUpload} />
          </div>

          {uploadState.isUploading && (
            <UploadProgress
              currentChunk={uploadState.currentChunk}
              totalChunks={uploadInfoRef.current.totalChunks}
            />
          )}

          <UploadStatus
            status={uploadState.status}
            uploading={uploadState.isUploading}
          />

          <ErrorInfo error={uploadState.error} />
        </div>
      )}
    </div>
  );
};

export default FileUploader;
