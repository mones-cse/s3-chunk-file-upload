import React from "react";
import { FaSync } from "react-icons/fa";

interface UploadProgressProps {
  currentChunk: number;
  totalChunks: number;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({
  currentChunk,
  totalChunks,
}) => {
  return (
    <div>
      <div className="mb-2 flex items-center">
        <FaSync className="animate-spin mr-2" />
        Progress: {currentChunk} of {totalChunks} parts
      </div>
      <div className="h-2 bg-gray-200 rounded">
        <div
          className="h-2 bg-blue-500 rounded transition-all duration-300"
          style={{
            width: `${(currentChunk / totalChunks) * 100}%`,
          }}
        />
      </div>
    </div>
  );
};
