import React from "react";
import { FaTimes } from "react-icons/fa";

interface ResetButtonProps {
  resetUpload: () => void;
}

export const ResetButton: React.FC<ResetButtonProps> = ({ resetUpload }) => {
  return (
    <button
      onClick={resetUpload}
      className="flex items-center px-4 py-2 rounded border border-gray-300 hover:bg-red-400"
    >
      <FaTimes className="mr-2" />
      Reset
    </button>
  );
};
