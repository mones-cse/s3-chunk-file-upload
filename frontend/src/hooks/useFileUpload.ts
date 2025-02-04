import { useState, useRef } from "react";
import { UploadState, UploadPart, InitUploadResponse } from "../types/upload";

export const useFileUpload = () => {
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

  const calculateChunks = (fileSize: number): number => {
    const chunkUnitInMB = 5;
    const chunkSize = chunkUnitInMB * 1024 * 1024;
    return Math.ceil(fileSize / chunkSize);
  };

  const initiateUpload = async (): Promise<InitUploadResponse> => {
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

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        setUploadState((prev) => ({ ...prev, error: error.message }));
      }
      throw error;
    }
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    console.log("🚀 ~ FileUploader ~ handleFileSelect: ~ Step 1");
    const files = event.target.files;
    if (!files) return;

    const selectedFile = files[0];
    const totalChunks = await calculateChunks(selectedFile.size);
    if (selectedFile) {
      setFile(selectedFile);
      setUploadState((prev) => ({
        ...prev,
        error: null,
        status: "File selected",
        totalChunks: totalChunks,
      }));
    }
  };

  const completeUpload = async (parts, uploadId, key) => {
    try {
      const response = await fetch(
        "http://localhost:5001/api/upload/complete",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uploadId: uploadId,
            key: key,
            parts,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to complete upload");

      const result = await response.json();
      return result;
    } catch (error) {
      throw error;
    }
  };

  const uploadChunk = async (chunk, partNumber, uploadId, key, totalChunks) => {
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
      if (error.name === "AbortError") {
        throw new Error("Upload aborted");
      }
      throw error;
    }
  };

  const handleUpload = async (startFrom = 1) => {
    if (!file) return;

    try {
      const { uploadId, key } = await initiateUpload();
      console.log("🚀 ~ handleUpload ~ uploadId, key :", uploadId, key);
      const chunkSize = 5 * 1024 * 1024; // 5MB chunks
      const parts = [];
      setUploadState((prev) => ({
        ...prev,
        uploadId,
        uploading: true,
        key,
      }));
      console.log(
        "🚀 ~ FileUploader ~ handleUpload ~ uploadId: before form creation",
        uploadState
      );

      for (
        let partNumber = 1;
        partNumber <= uploadState.totalChunks;
        partNumber++
      ) {
        const start = (partNumber - 1) * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
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
    } catch (error) {
      setUploadState((prev) => ({
        ...prev,
        uploading: false,
        error: error.message,
        status: "Upload failed",
      }));
    }
  };

  const handlePauseResume = () => {
    if (uploadState.uploading) {
      // pause
      setUploadState((prev) => ({
        ...prev,
        isPaused: true,
        status: "Upload paused",
      }));
      if (abortController.current) {
        abortController.current.abort();
      } else if (uploadState.isPaused) {
        // Resume
        handleUpload(uploadState.resumeFrom);
      }
    }
  };

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
    });
    setFile(null);
    // Reset file input
    document.getElementById("fileInput").value = "";
  };

  // Other methods remain similar but with proper TypeScript types
  // ... (uploadChunk, completeUpload, handleUpload implementations)

  return {
    file,
    uploadState,
    handleFileSelect,
    handleUpload,
    handlePauseResume,
    resetUpload,
  };
};
