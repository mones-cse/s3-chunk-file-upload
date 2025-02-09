import React from "react";

interface FileInfoProps {
  file: File;
}

export const FileInfo: React.FC<FileInfoProps> = ({ file }) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
      <p className="text-sm text-gray-600">
        <span className="font-semibold">Name:</span> {file.name}
      </p>
      <p className="text-sm text-gray-600">
        <span className="font-semibold">Size:</span> {formatFileSize(file.size)}
      </p>
      <p className="text-sm text-gray-600">
        <span className="font-semibold">Type:</span> {file.type || "Unknown"}
      </p>
    </div>
  );
};
