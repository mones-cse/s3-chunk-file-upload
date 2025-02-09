import React from "react";

interface UploadProgressProps {
  currentChunk: number;
  totalChunks: number;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({
  currentChunk,
  totalChunks,
}) => {
  const progress = Math.round((currentChunk / totalChunks) * 100);

  return (
    <div className="w-full mb-4">
      <div className="flex justify-between mb-1">
        <span className="text-sm text-gray-600">Progress</span>
        <span className="text-sm text-gray-600">{progress}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="text-xs text-gray-500 mt-1">
        Chunk {currentChunk} of {totalChunks}
      </div>
    </div>
  );
};

interface UploadStatusProps {
  status: string;
  uploading: boolean;
}

export const UploadStatus: React.FC<UploadStatusProps> = ({
  status,
  uploading,
}) => (
  <div className="text-sm">
    <span
      className={`${uploading ? "text-blue-500" : "text-gray-600"} font-medium`}
    >
      {status}
    </span>
  </div>
);

interface ErrorInfoProps {
  error: string | null;
}

export const ErrorInfo: React.FC<ErrorInfoProps> = ({ error }) => {
  if (!error) return null;

  return (
    <div className="text-sm text-red-500 mt-2 p-2 bg-red-50 rounded">
      Error: {error}
    </div>
  );
};
