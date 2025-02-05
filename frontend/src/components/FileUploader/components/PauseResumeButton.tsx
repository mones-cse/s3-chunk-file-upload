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
  if (!uploading) return null;

  return (
    <button
      onClick={handlePauseResume}
      className="flex items-center px-4 py-2 rounded bg-yellow-500 hover:bg-yellow-600 text-white"
    >
      {isPaused ? (
        <>
          <FaPlay className="mr-2" />
          Resume
        </>
      ) : (
        <>
          <FaPause className="mr-2" />
          Pause
        </>
      )}
    </button>
  );
};
