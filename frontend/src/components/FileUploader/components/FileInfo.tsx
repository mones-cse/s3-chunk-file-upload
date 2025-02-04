import React from "react";
import { FaCheckCircle } from "react-icons/fa";

interface FileInfoProps {
  file: File;
}

export const FileInfo: React.FC<FileInfoProps> = ({ file }) => {
  return (
    <div className="flex items-center text-sm text-gray-600">
      <FaCheckCircle className="mr-2 text-green-500" />
      <div className="flex flex-col text-start">
        File size: {(file.size / (1024 * 1024)).toFixed(2)} MB
        <br />
        File name: {file.name}
      </div>
    </div>
  );
};
