import React from "react";
import { FaUpload, FaSync } from "react-icons/fa";

interface UploadButtonProps {
  handleUpload: () => void;
  isUploading: boolean;
}

export const UploadButton: React.FC<UploadButtonProps> = ({
  handleUpload,
  isUploading,
}) => {
  return (
    <button
      onClick={handleUpload}
      disabled={isUploading}
      className={`flex items-center px-4 py-2 rounded border border-gray-300 text-black${
        isUploading
          ? "bg-white cursor-not-allowed"
          : "bg-blue-500 hover:bg-emerald-600 text-white"
      }`}
    >
      {isUploading ? (
        <>
          <FaSync className="animate-spin mr-2" />
          Uploading...
        </>
      ) : (
        <>
          <FaUpload className="mr-2 text-black" />
          <p className="text-black">Start Upload</p>
        </>
      )}
    </button>
  );
};
