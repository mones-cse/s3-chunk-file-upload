import { useState, useRef } from "react";
import { UploadState, UploadInfoRef, UploadPart } from "../types/upload";
import { UPLOAD_CONSTANTS } from "../utils/constants";

export const useFileUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>({
    error: null,
    status: "",
    currentChunk: 0,
    isUploading: false,
    isPaused: false,
  });

  const uploadInfoRef = useRef<UploadInfoRef>({
    uploadId: "",
    key: "",
    parts: [],
    chunkSize: UPLOAD_CONSTANTS.CHUNK_SIZE,
    totalChunks: 0,
    abortController: null,
  });

  const resetAfterUpload = () => {
    setUploadState({
      status: "",
      error: null,
      isUploading: false,
      currentChunk: 0,
      isPaused: false,
    });
    uploadInfoRef.current = {
      uploadId: "",
      key: "",
      parts: [],
      chunkSize: UPLOAD_CONSTANTS.CHUNK_SIZE,
      totalChunks: 0,
      abortController: null,
    };
    setFile(null);
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      const totalChunks = Math.ceil(
        selectedFile.size / uploadInfoRef.current.chunkSize
      );
      setFile(selectedFile);
      uploadInfoRef.current.totalChunks = totalChunks;
      setUploadState((prev) => ({
        ...prev,
        error: null,
        status: "File selected",
      }));
    }
  };

  const initiateUpload = async () => {
    if (!file) throw new Error("No file selected");

    try {
      const response = await fetch(UPLOAD_CONSTANTS.API_ENDPOINTS.INIT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  const uploadChunk = async (
    chunk: Blob,
    partNumber: number
  ): Promise<UploadPart> => {
    const formData = new FormData();
    formData.append("chunk", chunk);
    formData.append("partNumber", partNumber.toString());
    formData.append("uploadId", uploadInfoRef.current.uploadId);
    formData.append("key", uploadInfoRef.current.key);
    formData.append(
      "totalChunks",
      uploadInfoRef.current.totalChunks.toString()
    );

    uploadInfoRef.current.abortController = new AbortController();

    try {
      const response = await fetch(UPLOAD_CONSTANTS.API_ENDPOINTS.CHUNK, {
        method: "POST",
        body: formData,
        signal: uploadInfoRef.current.abortController.signal,
      });

      if (!response.ok) throw new Error(`Failed to upload part ${partNumber}`);
      return await response.json();
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Upload aborted");
      }
      throw error;
    }
  };

  const uploadProcessor = async (startFrom: number) => {
    if (!file) return;

    setUploadState((prev) => ({
      ...prev,
      isUploading: true,
      status: "Uploading",
    }));

    for (
      let partNumber = startFrom;
      partNumber <= uploadInfoRef.current.totalChunks;
      partNumber++
    ) {
      const start = (partNumber - 1) * uploadInfoRef.current.chunkSize;
      const end = Math.min(start + uploadInfoRef.current.chunkSize, file.size);
      const chunk = file.slice(start, end);

      setUploadState((prev) => ({
        ...prev,
        currentChunk: partNumber,
        status: `Uploading part ${partNumber} of ${uploadInfoRef.current.totalChunks}...`,
      }));

      const part = await uploadChunk(chunk, partNumber);
      uploadInfoRef.current.parts.push(part);
    }

    if (
      uploadInfoRef.current.parts.length === uploadInfoRef.current.totalChunks
    ) {
      await completeUpload();
      setUploadState((prev) => ({
        ...prev,
        isUploading: false,
        status: "Upload completed successfully",
      }));
    } else {
      throw new Error("Upload failed");
    }
  };

  const completeUpload = async (): Promise<void> => {
    try {
      const response = await fetch(UPLOAD_CONSTANTS.API_ENDPOINTS.COMPLETE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uploadId: uploadInfoRef.current.uploadId,
          key: uploadInfoRef.current.key,
          parts: uploadInfoRef.current.parts,
        }),
      });

      if (!response.ok) throw new Error("Failed to complete upload");
      resetAfterUpload();
      await response.json();
    } catch (error) {
      console.error(`Error completing upload:`, error);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    try {
      const { uploadId, key } = await initiateUpload();
      uploadInfoRef.current = {
        ...uploadInfoRef.current,
        uploadId,
        key,
      };
      uploadProcessor(1);
      return true;
    } catch (error) {
      setUploadState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Upload failed",
        status: "Upload failed",
        isUploading: false,
      }));
      console.error("Error uploading file", error);
    }
  };

  const resetUpload = async () => {
    try {
      const response = await fetch(UPLOAD_CONSTANTS.API_ENDPOINTS.ABORT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uploadId: uploadInfoRef.current.uploadId,
          key: uploadInfoRef.current.key,
        }),
      });

      if (!response.ok) throw new Error("Failed to abort upload");

      uploadInfoRef.current.abortController?.abort();
      resetAfterUpload();

      const fileInput = document.getElementById(
        "fileInput"
      ) as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }
    } catch (error) {
      console.error("Error resetting upload:", error);
    }
  };

  const handlePauseResume = () => {
    if (!uploadState.isPaused) {
      setUploadState((prev) => ({
        ...prev,
        isPaused: true,
        status: "Upload paused",
      }));
      if (uploadInfoRef.current.abortController) {
        uploadInfoRef.current.abortController.abort();
      }
    } else {
      uploadProcessor(uploadInfoRef.current.parts.length + 1);
      setUploadState((prev) => ({
        ...prev,
        isPaused: false,
        status: "Uploading...",
      }));
    }
  };

  return {
    file,
    uploadState,
    uploadInfoRef,
    handleFileSelect,
    handleUpload,
    handlePauseResume,
    resetUpload,
  };
};
