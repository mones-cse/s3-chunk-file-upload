import React from "react";
import { FaUpload } from "react-icons/fa";

interface FileSelectProps {
  handleFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  uploading: boolean;
  fileName?: string;
}

export const FileSelect: React.FC<FileSelectProps> = ({
  handleFileSelect,
  uploading,
  fileName,
}) => {
  return (
    <div className="mb-6">
      <input
        type="file"
        onChange={handleFileSelect}
        disabled={uploading}
        className="hidden"
        id="fileInput"
      />
      <label
        htmlFor="fileInput"
        className={`flex items-center justify-center px-4 py-2 border-2 border-dashed rounded-lg cursor-pointer ${
          uploading ? "bg-gray-100 cursor-not-allowed" : "hover:bg-gray-300"
        }`}
      >
        <FaUpload className="mr-2" size={20} />
        {fileName || "Select File"}
      </label>
    </div>
  );
};
