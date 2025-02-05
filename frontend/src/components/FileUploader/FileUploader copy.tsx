// src/components/FileUploader/FileUploader.tsx
import React, { useState, useRef } from "react";
import {
  FileSelect,
  FileInfo,
  UploadButton,
  PauseResumeButton,
  ResetButton,
  UploadProgress,
  UploadStatus,
  ErrorInfo,
} from "./components";

interface UploadState {
  uploadId: string;
  key: string;
  parts: UploadPart[];
  currentChunk: number;
  totalChunks: number;
  uploading: boolean;
  status: string;
  error: string | null;
  isPaused: boolean;
  resumeFrom: number;
}

interface UploadPart {
  ETag: string;
  PartNumber: number;
}

const FileUploader: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>({
    uploadId: "",
    key: "",
    parts: [],
    currentChunk: 0,
    totalChunks: 0,
    uploading: false,
    status: "",
    error: null,
    isPaused: false,
    resumeFrom: 0,
  });
  const abortController = useRef<AbortController | null>(null);

  const resetUpload = () => {
    setUploadState({
      uploadId: "",
      key: "",
      parts: [],
      currentChunk: 0,
      totalChunks: 0,
      uploading: false,
      status: "",
      error: null,
      isPaused: false,
      resumeFrom: 0,
    });
    setFile(null);
    const fileInput = document.getElementById("fileInput") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const calculateChunks = (fileSize: number): number => {
    const chunkUnitInMB = 5;
    const chunkSize = chunkUnitInMB * 1024 * 1024;
    return Math.ceil(fileSize / chunkSize);
  };

  const initiateUpload = async (): Promise<{
    uploadId: string;
    key: string;
  }> => {
    if (!file) throw new Error("No file selected");

    try {
      const response = await fetch("http://localhost:5001/api/upload/init", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileName: file.name }),
      });

      if (!response.ok) throw new Error("Failed to initiate upload");

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        setUploadState((prev) => ({ ...prev, error: error.message }));
      }
      throw error;
    }
  };

  const uploadChunk = async (
    chunk: Blob,
    partNumber: number,
    uploadId: string,
    key: string,
    totalChunks: number
  ): Promise<UploadPart> => {
    const formData = new FormData();
    formData.append("chunk", chunk);
    formData.append("partNumber", partNumber.toString());
    formData.append("uploadId", uploadId);
    formData.append("key", key);
    formData.append("totalChunks", totalChunks.toString());

    abortController.current = new AbortController();

    try {
      const response = await fetch("http://localhost:5001/api/upload/chunk", {
        method: "POST",
        body: formData,
        signal: abortController.current.signal,
      });

      if (!response.ok) throw new Error(`Failed to upload part ${partNumber}`);

      const part = await response.json();
      return part;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Upload aborted");
      }
      throw error;
    }
  };

  const completeUpload = async (
    parts: UploadPart[],
    uploadId: string,
    key: string
  ): Promise<void> => {
    try {
      const response = await fetch(
        "http://localhost:5001/api/upload/complete",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uploadId,
            key,
            parts,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to complete upload");

      await response.json();
    } catch (error) {
      throw error;
    }
  };

  const handleUpload = async (startFrom: number = 1) => {
    if (!file) return;

    try {
      const { uploadId, key } = await initiateUpload();
      const chunkSize = 5 * 1024 * 1024; // 5MB chunks
      const parts: UploadPart[] = [];

      setUploadState((prev) => ({
        ...prev,
        uploadId,
        uploading: true,
        key,
        isPaused: false,
      }));

      for (
        let partNumber = startFrom;
        partNumber <= uploadState.totalChunks;
        partNumber++
      ) {
        if (uploadState.isPaused) {
          setUploadState((prev) => ({
            ...prev,
            resumeFrom: partNumber,
          }));
          break;
        }

        const start = (partNumber - 1) * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        // slice the file into chunks
        const chunk = file.slice(start, end);

        setUploadState((prev) => ({
          ...prev,
          currentChunk: partNumber,
          status: `Uploading part ${partNumber} of ${prev.totalChunks}...`,
        }));

        const part = await uploadChunk(
          chunk,
          partNumber,
          uploadId,
          key,
          uploadState.totalChunks
        );
        parts.push(part);

        setUploadState((prev) => ({
          ...prev,
          parts: [...prev.parts, part],
          status: `Part ${partNumber} uploaded successfully`,
        }));
      }

      if (!uploadState.isPaused) {
        setUploadState((prev) => ({
          ...prev,
          status: "Completing upload...",
        }));

        await completeUpload(parts, uploadId, key);

        setUploadState((prev) => ({
          ...prev,
          uploading: false,
          status: "Upload completed successfully",
        }));
      }
    } catch (error) {
      setUploadState((prev) => ({
        ...prev,
        uploading: false,
        error: error instanceof Error ? error.message : "Upload failed",
        status: "Upload failed",
      }));
    }
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      const totalChunks = calculateChunks(selectedFile.size);
      setFile(selectedFile);
      setUploadState((prev) => ({
        ...prev,
        error: null,
        status: "File selected",
        totalChunks,
      }));
    }
  };

  const handlePauseResume = () => {
    if (uploadState.uploading) {
      // Pause
      setUploadState((prev) => ({
        ...prev,
        isPaused: true,
        status: "Upload paused",
      }));
      if (abortController.current) {
        abortController.current.abort();
      }
    } else if (uploadState.isPaused) {
      // Resume
      handleUpload(uploadState.resumeFrom);
    }
  };

  return (
    <div className="bg-gray-100  border-gray-300 border-[1px] text-white dark:text-black sp-6 min-w-xl max-w-2xl mx-auto bg- shadow-xl rounded-lg flex flex-col p-8">
      <FileSelect
        handleFileSelect={handleFileSelect}
        isUploading={uploadState.uploading}
        fileName={file?.name}
      />
      {file && (
        <div className="space-y-4">
          <FileInfo file={file} />
          {uploadState.error && <ErrorInfo error={uploadState.error} />}
          <div className="flex space-x-2 text-black">
            <UploadButton
              handleUpload={() => handleUpload(1)}
              isUploading={uploadState.uploading}
            />
            <PauseResumeButton
              handlePauseResume={handlePauseResume}
              uploading={uploadState.uploading}
              isPaused={uploadState.isPaused}
            />
            <ResetButton resetUpload={resetUpload} />
          </div>
          {(uploadState.uploading || uploadState.isPaused) && (
            <UploadProgress
              currentChunk={uploadState.currentChunk}
              totalChunks={uploadState.totalChunks}
            />
          )}
          <UploadStatus
            status={uploadState.status}
            uploading={uploadState.isUploading}
          />
        </div>
      )}
    </div>
  );
};

export default FileUploader;
