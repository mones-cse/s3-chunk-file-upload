// src/components/FileUploader/FileUploader.tsx

import { useState, useRef } from "react";
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
import { DiVim } from "react-icons/di";

interface UploadState {
  status: string;
  error: string | null;
  isUploading: boolean;
  currentChunk: number;
  // uploadId: string;
  // key: string;
  // parts: UploadPart[];
  // currentChunk: number;
  // isPaused: boolean;
  // resumeFrom: number;
}
interface UploadInfoRef {
  uploadId: string;
  key: string;
  parts: UploadPart[];
  chunkSize: number;
  totalChunks: number;
}

interface UploadPart {
  ETag: string;
  PartNumber: number;
}

const FileUploader: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>({
    error: null,
    status: "",
    currentChunk: 0,
    isUploading: false,
  });
  const uploadInfoRef = useRef<UploadInfoRef>({
    uploadId: "",
    key: "",
    parts: [],
    chunkSize: 5 * 1024 * 1024, // 5MB chunks,
    totalChunks: 0,
  });

  const resetAfterUpload = () => {
    setUploadState({
      status: "",
      error: null,
      isUploading: false,
      currentChunk: 0,
    });
    uploadInfoRef.current = {
      uploadId: "",
      key: "",
      parts: [],
      chunkSize: 5 * 1024 * 1024,
      totalChunks: 0,
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

  const uploadChunk = async (
    chunk: Blob,
    partNumber: number
    // uploadId: string,
    // key: string,
  ): Promise<UploadPart> => {
    const formData = new FormData();
    formData.append("chunk", chunk);
    formData.append("partNumber", partNumber.toString());
    formData.append("uploadId", uploadInfoRef.current.uploadId.toString());
    formData.append("key", uploadInfoRef.current.key.toString());
    formData.append(
      "totalChunks",
      uploadInfoRef.current.totalChunks.toString()
    );

    // abortController.current = new AbortController();

    try {
      const response = await fetch("http://localhost:5001/api/upload/chunk", {
        method: "POST",
        body: formData,
        // signal: abortController.current.signal,
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

  const completeUpload = async (): // parts: UploadPart[],
  // uploadId: string,
  // key: string
  Promise<void> => {
    try {
      const response = await fetch(
        "http://localhost:5001/api/upload/complete",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uploadId: uploadInfoRef.current.uploadId,
            key: uploadInfoRef.current.key,
            parts: uploadInfoRef.current.parts,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to complete upload");

      resetAfterUpload();
      await response.json();
    } catch (error) {
      throw error;
    }
  };

  return (
    <div className="bg-gray-100  border-gray-300 border-[1px] text-white dark:text-black sp-6 min-w-xl max-w-2xl mx-auto bg- shadow-xl rounded-lg flex flex-col p-8">
      <FileSelect
        handleFileSelect={handleFileSelect}
        isUploading={uploadState.isUploading}
        fileName={file?.name}
      />
      {file && (
        <div className="flex flex-col gap-2">
          <FileInfo file={file} />
          <div className="flex space-x-2 text-black">
            <UploadButton
              handleUpload={() => handleUpload()}
              isUploading={uploadState.isUploading}
            />
          </div>
          {uploadState.isUploading && (
            <UploadProgress
              currentChunk={uploadState.currentChunk}
              totalChunks={uploadInfoRef.current.totalChunks}
            />
          )}
          <UploadStatus
            status={uploadState.status}
            uploading={uploadState.isUploading}
          />
        </div>
      )}
      <div className="text-red-300 border-dashed border-2 border-blue-300 rounded-lg p-2 mt-4">
        <pre>{JSON.stringify(uploadState, null, 2)}</pre>
        <pre className="text-xs text-wrap">
          {JSON.stringify(uploadInfoRef.current, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default FileUploader;
