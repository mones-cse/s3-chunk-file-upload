// useFileUpload.ts
import { useState, useRef } from "react";
import { FileUploadState, FileStateRef, FileUploadInfo } from "../types/upload";
import { UPLOAD_CONSTANTS } from "../utils/constants";
type FileStateUpdate =
  | Partial<FileUploadState>
  | ((state: FileUploadState) => FileUploadState);

export const useFileUpload = () => {
  const [files, setFiles] = useState<Map<string, FileUploadState>>(new Map());
  const [isUploading, setIsUploading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const fileInfoRef = useRef<FileStateRef>({});

  const createFileState = (file: File): FileUploadState => {
    const totalChunks = Math.ceil(file.size / UPLOAD_CONSTANTS.CHUNK_SIZE);
    return {
      id: crypto.randomUUID(),
      file,
      status: "Ready to upload",
      error: null,
      isUploading: false,
      currentChunk: 0,
      totalChunks,
      progress: 0,
      isPaused: false,
    };
  };
  const isUploadCompleted = (fileState: FileUploadState) => {
    return (
      fileState.progress === 100 && !fileState.isUploading && !fileState.error
    );
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    console.log("called");
    const selectedFiles = Array.from(event.target.files || []);

    // Create new files Map
    const newFiles = new Map(files);

    // Create file states and get their IDs
    const fileIds: string[] = [];
    selectedFiles.forEach((file) => {
      const fileState = createFileState(file);
      newFiles.set(fileState.id, fileState);
      fileIds.push(fileState.id);
    });

    // Update files state
    setFiles(newFiles);
    setIsUploading(true);

    // Use newFiles instead of files state
    for (const fileId of fileIds) {
      try {
        const fileState = newFiles.get(fileId);
        if (fileState) {
          // Create a function that doesn't rely on files state
          await initiateUploadProcess(fileId, fileState);
        }
      } catch (error) {
        console.error(`Failed to upload file:`, error);
      }
    }
  };

  const initiateUploadProcess = async (
    fileId: string,
    fileState: FileUploadState
  ) => {
    try {
      // Update status to initializing
      updateFileState(fileId, {
        status: "Initializing upload...",
        isUploading: true,
      });

      // Initialize the upload with the server
      const response = await fetch(UPLOAD_CONSTANTS.API_ENDPOINTS.INIT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: fileState.file.name }),
      });

      if (!response.ok) {
        throw new Error("Failed to initialize upload");
      }

      const { uploadId, key } = await response.json();

      // Store upload info in ref
      fileInfoRef.current[fileId] = {
        uploadId,
        key,
        parts: [],
        abortController: new AbortController(),
      };

      // Update file state to start upload
      updateFileState(fileId, {
        status: "Starting upload...",
      });

      // Pass the fileState to processFileUpload
      await processFileUpload(fileId, fileState);
    } catch (error) {
      updateFileState(fileId, {
        error: error instanceof Error ? error.message : "Upload failed",
        status: "Upload failed",
        isUploading: false,
      });
    }
  };

  const processFileUpload = async (
    fileId: string,
    fileState: FileUploadState
  ) => {
    const fileInfo = fileInfoRef.current[fileId];
    if (!fileInfo) return;

    try {
      for (
        let chunkIndex = fileState.currentChunk;
        chunkIndex < fileState.totalChunks;
        chunkIndex++
      ) {
        const start = chunkIndex * UPLOAD_CONSTANTS.CHUNK_SIZE;
        const end = Math.min(
          start + UPLOAD_CONSTANTS.CHUNK_SIZE,
          fileState.file.size
        );
        const chunk = fileState.file.slice(start, end);

        // Update status for current chunk
        updateFileState(fileId, {
          currentChunk: chunkIndex + 1,
          status: `Uploading chunk ${chunkIndex + 1} of ${
            fileState.totalChunks
          }`,
          progress: (chunkIndex / fileState.totalChunks) * 100,
        });

        // Get current state to check for pause
        const currentState = files.get(fileId);
        if (currentState?.isPaused) {
          return;
        }

        const formData = new FormData();
        formData.append("chunk", chunk);
        formData.append("partNumber", (chunkIndex + 1).toString());
        formData.append("uploadId", fileInfo.uploadId);
        formData.append("key", fileInfo.key);
        formData.append("totalChunks", fileState.totalChunks.toString());

        const response = await fetch(UPLOAD_CONSTANTS.API_ENDPOINTS.CHUNK, {
          method: "POST",
          body: formData,
          signal: fileInfo.abortController?.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload chunk ${chunkIndex + 1}`);
        }

        const part = await response.json();
        fileInfo.parts.push(part);
      }

      // Complete the upload
      await completeUpload(fileId);

      updateFileState(fileId, {
        status: "Upload completed",
        isUploading: false,
        progress: 100,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        updateFileState(fileId, {
          status: "Upload paused",
          isUploading: false,
        });
      } else {
        updateFileState(fileId, {
          error: error instanceof Error ? error.message : "Upload failed",
          status: "Upload failed",
          isUploading: false,
        });
      }
    }
  };

  const updateFileState = (fileId: string, updates: FileStateUpdate) => {
    setFiles((prevFiles) => {
      const newFiles = new Map(prevFiles);
      const currentState = newFiles.get(fileId);
      if (currentState) {
        newFiles.set(fileId, { ...currentState, ...updates });
      }
      return newFiles;
    });
  };

  const completeUpload = async (fileId: string): Promise<void> => {
    const fileInfo = fileInfoRef.current[fileId];
    if (!fileInfo) return;

    try {
      const response = await fetch(UPLOAD_CONSTANTS.API_ENDPOINTS.COMPLETE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uploadId: fileInfo.uploadId,
          key: fileInfo.key,
          parts: fileInfo.parts,
        }),
      });

      if (!response.ok) throw new Error("Failed to complete upload");
      await response.json();
    } catch (error) {
      console.error(`Error completing upload:`, error);
      throw error;
    }
  };
  const handlePauseAll = () => {
    if (isPaused) {
      // Resume all
      setIsPaused(false);
      const currentFiles = new Map(files);

      for (const [fileId, fileState] of currentFiles.entries()) {
        if (fileState.isPaused) {
          updateFileState(fileId, {
            isPaused: false,
            isUploading: true,
            status: "Resuming upload...",
          });
          // Pass the current fileState to processFileUpload
          processFileUpload(fileId, fileState);
        }
      }
    } else {
      // Pause all
      setIsPaused(true);
      const currentFiles = new Map(files);

      for (const [fileId, fileState] of currentFiles.entries()) {
        if (fileState.isUploading) {
          const fileInfo = fileInfoRef.current[fileId];
          if (fileInfo) {
            fileInfo.abortController?.abort();
            // Create new abort controller for when we resume
            fileInfo.abortController = new AbortController();
          }
          updateFileState(fileId, {
            isPaused: true,
            isUploading: false,
            status: "Upload paused",
          });
        }
      }
    }
  };
  const handlePauseFile = (fileId: string) => {
    const fileState = files.get(fileId);
    const fileInfo = fileInfoRef.current[fileId];
    if (!fileState) return;

    if (fileInfo) {
      fileInfo.abortController?.abort();
    }
    updateFileState(fileId, {
      isPaused: true,
      isUploading: false,
      status: "Upload paused",
    });
  };

  const handleResumeFile = async (fileId: string) => {
    const fileState = files.get(fileId);
    if (!fileState) return;

    updateFileState(fileId, {
      isPaused: false,
      isUploading: true,
      status: "Resuming upload...",
    });

    // Ensure we have a fresh AbortController
    const fileInfo = fileInfoRef.current[fileId];
    if (fileInfo) {
      fileInfo.abortController = new AbortController();
    }

    // Pass the current fileState to processFileUpload
    await processFileUpload(fileId, fileState);
  };

  const handleCancelAll = async () => {
    // Abort all ongoing uploads
    for (const fileId of Object.keys(fileInfoRef.current)) {
      const fileInfo = fileInfoRef.current[fileId];
      fileInfo.abortController?.abort();

      try {
        await fetch(UPLOAD_CONSTANTS.API_ENDPOINTS.ABORT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uploadId: fileInfo.uploadId,
            key: fileInfo.key,
          }),
        });
      } catch (error) {
        console.error("Error aborting upload:", error);
      }
    }

    // Clear all refs
    fileInfoRef.current = {};

    // Reset all states
    setIsUploading(false);
    setIsPaused(false);
    setFiles(new Map());

    // Reset file input
    const fileInput = document.getElementById("fileInput") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleCancelFile = async (fileId: string) => {
    const fileState = files.get(fileId);
    const fileInfo = fileInfoRef.current[fileId];
    if (!fileState) return;

    // Abort ongoing upload if any
    if (fileInfo) {
      fileInfo.abortController?.abort();

      // Abort upload on server if uploadId exists
      try {
        await fetch(UPLOAD_CONSTANTS.API_ENDPOINTS.ABORT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uploadId: fileInfo.uploadId,
            key: fileInfo.key,
          }),
        });
      } catch (error) {
        console.error("Error aborting upload on server:", error);
      }

      // Remove from ref
      delete fileInfoRef.current[fileId];
    }

    // Remove file from state
    setFiles((prevFiles) => {
      const newFiles = new Map(prevFiles);
      newFiles.delete(fileId);

      // If no files left, reset all states
      if (newFiles.size === 0) {
        setIsUploading(false);
        setIsPaused(false);
      }

      return newFiles;
    });
  };

  return {
    files,
    isUploading,
    isPaused,
    handleFileSelect,
    handlePauseAll,
    handleCancelAll,
    handleCancelFile,
    handlePauseFile,
    handleResumeFile,
  };
};
