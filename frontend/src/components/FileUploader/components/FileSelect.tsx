// FileSelect.tsx
import React from "react";

interface FileSelectProps {
  handleFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onPauseAll: () => void;
  onCancelAll: () => void;

  isPausedAll: boolean;
  fileCount: number;
  areAllUploadsComplete: boolean;
}

export const FileSelect: React.FC<FileSelectProps> = ({
  handleFileSelect,
  onPauseAll,
  onCancelAll,

  isPausedAll,
  fileCount,
  areAllUploadsComplete,
}) => {
  return (
    <div className="mb-4 flex gap-2">
      <input
        type="file"
        id="fileInput"
        onChange={handleFileSelect}
        disabled={!isPausedAll && !areAllUploadsComplete}
        multiple
        className="hidden"
      />
      <label
        htmlFor="fileInput"
        className={`cursor-pointer text-white px-4 py-2 rounded transition-colors truncate ${
          !isPausedAll && !areAllUploadsComplete
            ? "bg-gray-400 hover:bg-gray-500 cursor-not-allowed"
            : "bg-blue-500 hover:bg-blue-600"
        }`}
      >
        {fileCount > 0 ? `${fileCount} files selected` : "Select Files"}
      </label>

      {fileCount > 0 && !areAllUploadsComplete && (
        <>
          <button
            onClick={onPauseAll}
            className={`px-4 py-2 rounded transition-colors ${
              isPausedAll
                ? "bg-green-500 hover:bg-green-600"
                : "bg-yellow-500 hover:bg-yellow-600"
            } text-white`}
          >
            {isPausedAll ? "Resume All" : "Pause All"}
          </button>
          <button
            onClick={onCancelAll}
            className="px-4 py-2 rounded transition-colors bg-red-500 hover:bg-red-600 text-white"
          >
            Cancel All
          </button>
        </>
      )}
    </div>
  );
};
