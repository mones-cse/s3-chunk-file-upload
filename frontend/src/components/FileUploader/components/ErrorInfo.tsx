import React from "react";
import { FaExclamationCircle } from "react-icons/fa";

interface ErrorInfoProps {
  error: string;
}

export const ErrorInfo: React.FC<ErrorInfoProps> = ({ error }) => {
  return (
    <div className="flex items-center p-3 bg-red-100 text-red-700 rounded">
      <FaExclamationCircle className="mr-2" />
      {error}
    </div>
  );
};
