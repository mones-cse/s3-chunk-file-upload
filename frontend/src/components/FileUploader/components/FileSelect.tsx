import React from "react";
import { FaUpload } from "react-icons/fa";

interface FileSelectProps {
  handleFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
  fileName?: string;
}

export const FileSelect: React.FC<FileSelectProps> = ({
  handleFileSelect,
  isUploading,
  fileName,
}) => {
  return (
    <div className="mb-6">
      <input
        type="file"
        onChange={handleFileSelect}
        disabled={isUploading}
        className="hidden"
        id="fileInput"
      />
      <label
        htmlFor="fileInput"
        className={`flex items-center justify-center px-4 py-2  border-gray-900 border-2 border-dashed rounded-lg cursor-pointer ${
          isUploading ? "bg-gray-100 cursor-not-allowed" : "hover:bg-gray-300"
        }`}
      >
        <FaUpload className="mr-2 text-gray-900" size={20} />
        <p className="text-sm text-gray-900">{fileName || "Select File"}</p>
      </label>
    </div>
  );
};
