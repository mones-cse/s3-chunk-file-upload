import React from "react";

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
    <div className="mb-4">
      <input
        type="file"
        id="fileInput"
        onChange={handleFileSelect}
        disabled={isUploading}
        className="hidden"
      />
      <label
        htmlFor="fileInput"
        className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors truncate"
      >
        {fileName ? fileName : "Select File"}
      </label>
    </div>
  );
};
