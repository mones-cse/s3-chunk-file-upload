import React from "react";
import { FaSync, FaExclamationCircle, FaCheckCircle } from "react-icons/fa";

interface UploadStatusProps {
  status: string;
  uploading: boolean;
}

export const UploadStatus: React.FC<UploadStatusProps> = ({
  status,
  uploading,
}) => {
  return (
    <div className="text-sm text-gray-600 flex items-center">
      {status.includes("failed") ? (
        <FaExclamationCircle className="mr-2 text-red-500" />
      ) : status.includes("success") ? (
        <FaCheckCircle className="mr-2 text-green-500" />
      ) : (
        <FaSync className={`mr-2 ${uploading ? "animate-spin" : ""}`} />
      )}
      {status}
    </div>
  );
};
