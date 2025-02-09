interface ButtonProps {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  onClick,
  disabled,
  children,
  className = "",
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded transition-colors ${className} ${
      disabled ? "opacity-50 cursor-not-allowed" : ""
    }`}
  >
    {children}
  </button>
);

interface UploadButtonProps {
  handleUpload: () => void;
  isUploading: boolean;
  isPaused: boolean;
}

export const UploadButton: React.FC<UploadButtonProps> = ({
  handleUpload,
  isUploading,
  isPaused,
}) => (
  <Button
    onClick={handleUpload}
    disabled={isUploading || isPaused}
    className="bg-green-500 text-white hover:bg-green-600"
  >
    Upload
  </Button>
);

interface PauseResumeButtonProps {
  handlePauseResume: () => void;
  uploading: boolean;
  isPaused: boolean;
}

export const PauseResumeButton: React.FC<PauseResumeButtonProps> = ({
  handlePauseResume,
  uploading,
  isPaused,
}) => (
  <Button
    onClick={handlePauseResume}
    disabled={!uploading && !isPaused}
    className="bg-yellow-500 text-white hover:bg-yellow-600"
  >
    {isPaused ? "Resume" : "Pause"}
  </Button>
);

interface ResetButtonProps {
  resetUpload: () => void;
}

export const ResetButton: React.FC<ResetButtonProps> = ({ resetUpload }) => (
  <Button
    onClick={resetUpload}
    className="bg-red-500 text-white hover:bg-red-600"
  >
    Reset
  </Button>
);
