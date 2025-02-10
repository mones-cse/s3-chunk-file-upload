// useFileUpload.ts
import { useState, useRef } from "react";
import { FileUploadState, FileStateRef, FileUploadInfo } from "../types/upload";
import { UPLOAD_CONSTANTS } from "../utils/constants";

type FileStateUpdate =
  | Partial<FileUploadState>
  | ((state: FileUploadState) => FileUploadState);

export const useFileUpload = () => {
  const [files, setFiles] = useState<Map<string, FileUploadState>>(new Map());
  const [isUploadingAll, setIsUploadingAll] = useState(false);
  const [isPausedAll, setIsPausedAll] = useState(false);
  const fileInfoRef = useRef<FileStateRef>({});

  const createFileState = (file: File): FileUploadState => {
    const totalChunks = Math.ceil(file.size / UPLOAD_CONSTANTS.CHUNK_SIZE);
    return {
      id: crypto.randomUUID(),
      file,
      status: "Ready to upload",
      error: null,
      currentChunk: 0,
      totalChunks,
      progress: 0,
      isPaused: false,
    };
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFiles = Array.from(event.target.files || []);
    const newFiles = new Map(files);
    const uploadPromises: Promise<void>[] = [];

    selectedFiles.forEach((file) => {
      const fileState = createFileState(file);
      newFiles.set(fileState.id, fileState);
      uploadPromises.push(initiateUploadProcess(fileState.id, fileState));
    });

    setFiles(newFiles);
    setIsUploadingAll(true);

    try {
      await Promise.all(uploadPromises);
    } catch (error) {
      console.error("Some uploads failed:", error);
    }
  };

  const initiateUploadProcess = async (
    fileId: string,
    fileState: FileUploadState
  ): Promise<void> => {
    try {
      updateFileState(fileId, {
        status: "Initializing upload...",
        isPaused: false,
      });

      const response = await fetch(UPLOAD_CONSTANTS.API_ENDPOINTS.INIT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: fileState.file.name }),
      });

      if (!response.ok) {
        throw new Error("Failed to initialize upload");
      }

      const { uploadId, key } = await response.json();
      fileInfoRef.current[fileId] = {
        uploadId,
        key,
        parts: [],
        abortController: new AbortController(),
      };

      updateFileState(fileId, {
        status: "Starting upload...",
      });

      await processFileUpload(fileId, fileState);
    } catch (error) {
      updateFileState(fileId, {
        error: error instanceof Error ? error.message : "Upload failed",
        status: "Upload failed",
        isPaused: true,
      });
    }
  };

  const processFileUpload = async (
    fileId: string,
    fileState: FileUploadState,
    shouldPause: boolean = false
  ): Promise<void> => {
    const fileInfo = fileInfoRef.current[fileId];
    if (!fileInfo || shouldPause) return;
    console.log("🚀 ~ useFileUpload ~ fileInfo:", fileInfo, shouldPause);

    try {
      const startChunk =
        fileState.currentChunk === 0 ? 0 : fileState.currentChunk - 1;
      for (
        let chunkIndex = startChunk;
        chunkIndex < fileState.totalChunks;
        chunkIndex++
      ) {
        // const currentState = files.get(fileId);
        // if (currentState?.isPaused) {
        //   console.log(
        //     "🚀 ~ useFileUpload ~ currentState.isPaused:",
        //     currentState.isPaused
        //   );
        //   return;
        // }

        const start = chunkIndex * UPLOAD_CONSTANTS.CHUNK_SIZE;
        const end = Math.min(
          start + UPLOAD_CONSTANTS.CHUNK_SIZE,
          fileState.file.size
        );
        const chunk = fileState.file.slice(start, end);

        updateFileState(fileId, {
          currentChunk: chunkIndex + 1,
          status: `Uploading chunk ${chunkIndex + 1} of ${
            fileState.totalChunks
          }`,
          progress: Math.round((chunkIndex / fileState.totalChunks) * 100),
        });

        const formData = new FormData();
        formData.append("chunk", chunk);
        formData.append("partNumber", (chunkIndex + 1).toString());
        formData.append("uploadId", fileInfo.uploadId);
        formData.append("key", fileInfo.key);
        formData.append("totalChunks", fileState.totalChunks.toString());

        console.log("🚀 ~ useFileUpload ~ totalChunks:", formData);

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

      await completeUpload(fileId);

      updateFileState(fileId, {
        status: "Upload completed",
        progress: 100,
        isPaused: false,
      });

      const allFilesCompleted = Array.from(files.values()).every(
        (file) => file.progress === 100 && !file.error
      );

      if (allFilesCompleted) {
        setIsUploadingAll(false);
        setIsPausedAll(false);
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        updateFileState(fileId, {
          status: "Upload paused",
          isPaused: true,
        });
      } else {
        updateFileState(fileId, {
          error: error instanceof Error ? error.message : "Upload failed",
          status: "Upload failed",
          isPaused: true,
        });
      }
    }
  };

  const updateFileState = (fileId: string, updates: FileStateUpdate) => {
    setFiles((prevFiles) => {
      const newFiles = new Map(prevFiles);
      const currentState = newFiles.get(fileId);
      if (currentState) {
        const newState =
          typeof updates === "function"
            ? updates(currentState)
            : { ...currentState, ...updates };
        newFiles.set(fileId, newState);
      }
      return newFiles;
    });
  };

  const completeUpload = async (fileId: string): Promise<any> => {
    const fileState = files.get(fileId);
    const fileInfo = fileInfoRef.current[fileId];
    if (!fileState || !fileInfo) return;

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
      return response.json();
    } catch (error) {
      console.error(`Error completing upload:`, error);
      throw error;
    }
  };

  const handlePauseAll = () => {
    const shouldPause = !isPausedAll;
    setIsPausedAll(shouldPause);

    if (shouldPause) {
      for (const fileId of Object.keys(fileInfoRef.current)) {
        const fileInfo = fileInfoRef.current[fileId];
        fileInfo?.abortController?.abort();
        fileInfo.abortController = new AbortController();
      }

      setFiles((currentFiles) => {
        const newFiles = new Map(currentFiles);
        for (const [fileId, fileState] of newFiles.entries()) {
          if (!fileState.isPaused && fileState.progress < 100) {
            newFiles.set(fileId, {
              ...fileState,
              isPaused: true,
              status: "Upload paused",
            });
          }
        }
        return newFiles;
      });
    } else {
      const pausedFiles = Array.from(files.entries())
        .filter(([_, state]) => state.isPaused)
        .map(([id, state]) => ({ id, state }));

      setFiles((currentFiles) => {
        const newFiles = new Map(currentFiles);
        for (const { id, state } of pausedFiles) {
          newFiles.set(id, {
            ...state,
            isPaused: false,
            status: "Resuming upload...",
          });
        }
        return newFiles;
      });

      pausedFiles.forEach(({ id, state }) => {
        processFileUpload(id, {
          ...state,
          isPaused: false,
        });
      });
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
      status: "Upload paused",
    });
  };

  const handleResumeFile = async (fileId: string) => {
    const fileState = files.get(fileId);
    if (!fileState) return;

    // Create new abort controller before resuming
    const fileInfo = fileInfoRef.current[fileId];
    if (fileInfo) {
      fileInfo.abortController = new AbortController();
    }

    // Update state before processing
    updateFileState(fileId, {
      isPaused: false,
      status: "Resuming upload...",
    });

    // Use the current file state for resuming
    await processFileUpload(
      fileId,
      {
        ...fileState,
        isPaused: false,
      },
      false
    );
  };

  const handleCancelFile = async (fileId: string) => {
    const fileState = files.get(fileId);
    const fileInfo = fileInfoRef.current[fileId];
    if (!fileState) return;

    if (fileInfo) {
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
        console.error("Error aborting upload on server:", error);
      }

      delete fileInfoRef.current[fileId];
    }

    setFiles((prevFiles) => {
      const newFiles = new Map(prevFiles);
      newFiles.delete(fileId);

      if (newFiles.size === 0) {
        setIsUploadingAll(false);
        setIsPausedAll(false);
      }

      return newFiles;
    });
  };

  const handleCancelAll = async () => {
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

    fileInfoRef.current = {};
    setIsUploadingAll(false);
    setIsPausedAll(false);
    setFiles(new Map());

    const fileInput = document.getElementById("fileInput") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  return {
    files,
    isUploadingAll,
    isPausedAll,
    handleFileSelect,
    handlePauseAll,
    handleCancelAll,
    handleCancelFile,
    handlePauseFile,
    handleResumeFile,
  };
};
