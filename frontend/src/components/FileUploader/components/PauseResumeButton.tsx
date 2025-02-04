import React from "react";
import { FaPlay, FaPause } from "react-icons/fa";

interface PauseResumeButtonProps {
  handlePauseResume: () => void;
  uploading: boolean;
  isPaused: boolean;
}

export const PauseResumeButton: React.FC<PauseResumeButtonProps> = ({
  handlePauseResume,
  uploading,
  isPaused,
}) => {
  if (!uploading && !isPaused) return null;

  return (
    <button
      onClick={handlePauseResume}
      className="flex items-center px-4 py-2 rounded bg-yellow-500 hover:bg-yellow-600 text-white"
    >
      {uploading ? (
        <>
          <FaPause className="mr-2" />
          Pause
        </>
      ) : (
        <>
          <FaPlay className="mr-2" />
          Resume
        </>
      )}
    </button>
  );
};
