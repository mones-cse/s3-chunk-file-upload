// FileList.tsx
import React from "react";
import { FileUploadState } from "../../../types/upload";
import { formatFileSize } from "../../../utils/formatters";
import {
  FaRegCircleCheck,
  FaRegCirclePause,
  FaRegCirclePlay,
} from "react-icons/fa6";
import { SlClose } from "react-icons/sl";

interface FileListProps {
  files: Map<string, FileUploadState>;
  onCancel: (fileId: string) => void;
  onPause: (fileId: string) => void;
  onResume: (fileId: string) => void;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  onCancel,
  onPause,
  onResume,
}) => {
  const isUploadComplete = (fileState: FileUploadState) => {
    return fileState.progress === 100 && !fileState.error;
  };

  const isUploading = (fileState: FileUploadState) => {
    return !fileState.isPaused && fileState.progress < 100 && !fileState.error;
  };

  return (
    <div className="w-full space-y-4">
      {Array.from(files.values()).map((fileState) => (
        <div key={fileState.id} className="bg-gray-50 rounded-lg">
          <div className="px-4 py-3">
            <div className="flex justify-between items-start mb-1">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {fileState.file.name}
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>{formatFileSize(fileState.file.size)}</span>
                  <span>•</span>
                  <span>{fileState.file.type}</span>
                </div>
              </div>
              <div className="flex gap-2">
                {!isUploadComplete(fileState) && isUploading(fileState) && (
                  <button
                    onClick={() => onPause(fileState.id)}
                    // className="text-sm px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded"
                  >
                    <FaRegCirclePause className="text-xl text-yellow-500 hover:text-yellow-800 hover:bg-gray-400 rounded-full" />
                  </button>
                )}
                {fileState.isPaused && (
                  <button
                    onClick={() => onResume(fileState.id)}
                    // className="text-sm px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded"
                  >
                    <FaRegCirclePlay className="text-xl text-blue-500 hover:text-blue-800 rounded-full hover:scale-115" />
                  </button>
                )}
                {isUploadComplete(fileState) ? (
                  <div
                  // className="text-sm px-2 py-1 bg-emerald-500 text-white rounded flex items-center gap-1 cursor-default"
                  >
                    <FaRegCircleCheck className="text-green-500 text-xl" />
                  </div>
                ) : (
                  <button onClick={() => onCancel(fileState.id)}>
                    <SlClose className="text-red-500 text-xl hover:text-red-800 rounded-full hover:scale-115" />
                  </button>
                )}
              </div>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
              <div
                className={`h-1 rounded-full transition-all duration-300 ${
                  fileState.error
                    ? "bg-red-500"
                    : fileState.isPaused
                    ? "bg-yellow-500"
                    : "bg-blue-500"
                }`}
                style={{ width: `${fileState.progress}%` }}
              />
            </div>

            <p className="text-sm text-gray-600 mt-2">{fileState.status}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
