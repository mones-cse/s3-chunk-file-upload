// FileUploader.tsx
import { useFileUpload } from "../../hooks/useFileUpload";
import { FileList } from "./components/FileList";
import { FileSelect } from "./components/FileSelect";

const FileUploader: React.FC = () => {
  const {
    files,
    isPausedAll,
    handleFileSelect,
    handlePauseAll,
    handleCancelAll,
    handleCancelFile,
    handlePauseFile,
    handleResumeFile,
  } = useFileUpload();

  const areAllUploadsComplete = Array.from(files.values()).every(
    (file) => file.progress === 100 && !file.error
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-6 w-xl mx-auto flex flex-col items-center justify-center">
      <h1 className="text-3xl mb-6">S3 Chunk File Upload Demo</h1>

      <FileSelect
        handleFileSelect={handleFileSelect}
        onPauseAll={handlePauseAll}
        onCancelAll={handleCancelAll}
        isPausedAll={isPausedAll}
        fileCount={files.size}
        areAllUploadsComplete={areAllUploadsComplete}
      />

      {files.size > 0 && (
        <FileList
          files={files}
          onCancel={handleCancelFile}
          onPause={handlePauseFile}
          onResume={handleResumeFile}
        />
      )}
      <br />
      <div className="max-h-96 overflow-auto rounded border border-gray-200 bg-gray-50 p-4 w-lg">
        <pre className="whitespace-pre-wrap font-mono text-sm">
          {JSON.stringify(
            {
              files: Array.from(files.values()),
              isPausedAll,
            },
            null,
            2
          )}
        </pre>
      </div>
    </div>
  );
};

export default FileUploader;
