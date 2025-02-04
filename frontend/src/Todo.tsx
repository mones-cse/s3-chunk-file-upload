// import React, { useState, useRef } from "react";
// import {
//     FaUpload,
//     FaSync,
//     FaTimes,
//     FaCheckCircle,
//     FaExclamationCircle,
//     FaPlay,
//     FaPause,
// } from "react-icons/fa";

// const FileUploader = () => {
//     const [file, setFile] = useState(null);
//     const [uploadState, setUploadState] = useState({
//         uploadId: "",
//         key: "",
//         parts: [],
//         currentChunk: 0,
//         totalChunks: 0,
//         uploading: false,
//         status: "",
//         error: null,
//         isPaused: false,
//         resumeFrom: 0,
//     });
//     const abortController = useRef(null);

//     const resetUpload = () => {
//         setUploadState({
//             uploadId: "",
//             key: "",
//             parts: [],
//             currentChunk: 0,
//             totalChunks: 0,
//             uploading: false,
//             status: "",
//             error: null,
//         });
//         setFile(null);
//         // Reset file input
//         document.getElementById("fileInput").value = "";
//     };

//     const calculateChunks = fileSize => {
//         const chunkUnitInMB = 5;
//         const chunkSize = chunkUnitInMB * 1024 * 1024;
//         return Math.ceil(fileSize / chunkSize);
//     };

//     const initiateUpload = async () => {
//         try {
//             const response = await fetch(
//                 "http://localhost:3000/api/upload/init",
//                 {
//                     method: "POST",
//                     headers: {
//                         "Content-Type": "application/json",
//                     },
//                     body: JSON.stringify({ fileName: file.name }),
//                 }
//             );

//             if (!response.ok) throw new Error("Failed to initiate upload");

//             const { uploadId, key } = await response.json();
//             // const totalChunks = calculateChunks(file.size);

//             return { uploadId, key };
//         } catch (error) {
//             setUploadState(prev => ({ ...prev, error: error.message }));
//             throw error;
//         }
//     };
//     //⭐️------------------> 3
//     const uploadChunk = async (
//         chunk,
//         partNumber,
//         uploadId,
//         key,
//         totalChunks
//     ) => {
//         const formData = new FormData();
//         formData.append("chunk", chunk);
//         formData.append("partNumber", partNumber.toString());
//         formData.append("uploadId", uploadId);
//         formData.append("key", key);
//         formData.append("totalChunks", totalChunks.toString());

//         abortController.current = new AbortController();

//         try {
//             const response = await fetch(
//                 "http://localhost:3000/api/upload/chunk",
//                 {
//                     method: "POST",
//                     body: formData,
//                     signal: abortController.current.signal,
//                 }
//             );

//             if (!response.ok)
//                 throw new Error(`Failed to upload part ${partNumber}`);

//             const part = await response.json();
//             return part;
//         } catch (error) {
//             if (error.name === "AbortError") {
//                 throw new Error("Upload aborted");
//             }
//             throw error;
//         }
//     };

//     const completeUpload = async (parts, uploadId, key) => {
//         try {
//             const response = await fetch(
//                 "http://localhost:3000/api/upload/complete",
//                 {
//                     method: "POST",
//                     headers: {
//                         "Content-Type": "application/json",
//                     },
//                     body: JSON.stringify({
//                         uploadId: uploadId,
//                         key: key,
//                         parts,
//                     }),
//                 }
//             );

//             if (!response.ok) throw new Error("Failed to complete upload");

//             const result = await response.json();
//             return result;
//         } catch (error) {
//             throw error;
//         }
//     };
//     //⭐️------------------> 2
//     const handleUpload = async (startFrom = 1) => {
//         if (!file) return;

//         try {
//             const { uploadId, key } = await initiateUpload();
//             console.log("🚀 ~ handleUpload ~ uploadId, key :", uploadId, key);
//             const chunkSize = 5 * 1024 * 1024; // 5MB chunks
//             const parts = [];
//             setUploadState(prev => ({
//                 ...prev,
//                 uploadId,
//                 uploading: true,
//                 key,
//             }));
//             console.log(
//                 "🚀 ~ FileUploader ~ handleUpload ~ uploadId: before form creation",
//                 uploadState
//             );

//             for (
//                 let partNumber = 1;
//                 partNumber <= uploadState.totalChunks;
//                 partNumber++
//             ) {
//                 const start = (partNumber - 1) * chunkSize;
//                 const end = Math.min(start + chunkSize, file.size);
//                 const chunk = file.slice(start, end);

//                 setUploadState(prev => ({
//                     ...prev,
//                     currentChunk: partNumber,
//                     status: `Uploading part ${partNumber} of ${prev.totalChunks}...`,
//                 }));

//                 const part = await uploadChunk(
//                     chunk,
//                     partNumber,
//                     uploadId,
//                     key,
//                     uploadState.totalChunks
//                 );
//                 parts.push(part);

//                 setUploadState(prev => ({
//                     ...prev,
//                     parts: [...prev.parts, part],
//                     status: `Part ${partNumber} uploaded successfully`,
//                 }));
//             }

//             setUploadState(prev => ({
//                 ...prev,
//                 status: "Completing upload...",
//             }));

//             await completeUpload(parts, uploadId, key);

//             setUploadState(prev => ({
//                 ...prev,
//                 uploading: false,
//                 status: "Upload completed successfully",
//             }));
//         } catch (error) {
//             setUploadState(prev => ({
//                 ...prev,
//                 uploading: false,
//                 error: error.message,
//                 status: "Upload failed",
//             }));
//         }
//     };
//     //⭐️------------------> 1
//     const handleFileSelect = async event => {
//         console.log("🚀 ~ FileUploader ~ handleFileSelect: ~ Step 1");
//         const selectedFile = event.target.files[0];
//         const totalChunks = await calculateChunks(selectedFile.size);
//         if (selectedFile) {
//             setFile(selectedFile);
//             setUploadState(prev => ({
//                 ...prev,
//                 error: null,
//                 status: "File selected",
//                 totalChunks: totalChunks,
//             }));
//         }
//     };

//     const handlePauseResume = () => {
//         if(uploadState.uploading){
//             // pause
//             setUploadState(prev => ({
//                 ...prev,
//                 isPaused: true,
//                 status: "Upload paused",
//             }));
//             if(abortController.current){
//                 abortController.current.abort();
//             }else if (uploadState.isPaused) {
//                 // Resume
//                 handleUpload(uploadState.resumeFrom);
//             }
//         }
//     };

//     const FileSelect = () => {
//         return (
//             <div className="mb-6">
//                 <input
//                     type="file"
//                     onChange={handleFileSelect}
//                     disabled={uploadState.uploading}
//                     className="hidden"
//                     id="fileInput"
//                 />
//                 <label
//                     htmlFor="fileInput"
//                     className={`flex items-center justify-center px-4 py-2 border-2 border-dashed rounded-lg cursor-pointer ${
//                         uploadState.uploading
//                             ? "bg-gray-100 cursor-not-allowed"
//                             : "hover:bg-gray-50"
//                     }`}
//                 >
//                     <FaUpload className="mr-2" size={20} />
//                     {file ? file.name : "Select File"}
//                 </label>
//             </div>
//         );
//     };

//     const FileInfo = () => {
//         return (
//             <div className="flex items-center text-sm text-gray-600">
//                 <FaCheckCircle className="mr-2 text-green-500" />
//                 <div>
//                     File size: {(file.size / (1024 * 1024)).toFixed(2)} MB
//                     <br />
//                     File name: {file.name}
//                 </div>
//             </div>
//         );
//     };

//     const ResetButton = () => {
//         return (
//             <button
//                 onClick={resetUpload}
//                 className="flex items-center px-4 py-2 rounded border border-gray-300 hover:bg-gray-50"
//             >
//                 <FaTimes className="mr-2" />
//                 Reset
//             </button>
//         );
//     };

//     const UploadButton = () => {
//         return (
//             <button
//                 onClick={handleUpload}
//                 disabled={uploadState.uploading}
//                 className={`flex items-center px-4 py-2 rounded ${
//                     uploadState.uploading
//                         ? "bg-gray-300 cursor-not-allowed"
//                         : "bg-blue-500 hover:bg-blue-600 text-white"
//                 }`}
//             >
//                 {uploadState.uploading ? (
//                     <>
//                         <FaSync className="animate-spin mr-2" />
//                         Uploading...
//                     </>
//                 ) : (
//                     <>
//                         <FaUpload className="mr-2" />
//                         Start Upload
//                     </>
//                 )}
//             </button>
//         );
//     };

//     const UploadProgress = () => {
//         return (
//             <div>
//                 <div className="mb-2 flex items-center">
//                     <FaSync className="animate-spin mr-2" />
//                     Progress: {uploadState.currentChunk} of{" "}
//                     {uploadState.totalChunks} parts
//                 </div>
//                 <div className="h-2 bg-gray-200 rounded">
//                     <div
//                         className="h-2 bg-blue-500 rounded transition-all duration-300"
//                         style={{
//                             width: `${
//                                 (uploadState.currentChunk /
//                                     uploadState.totalChunks) *
//                                 100
//                             }%`,
//                         }}
//                     />
//                 </div>
//             </div>
//         );
//     };

//     const ErrorInfo = () => {
//         return (
//             <div className="flex items-center p-3 bg-red-100 text-red-700 rounded">
//                 <FaExclamationCircle className="mr-2" />
//                 {uploadState.error}
//             </div>
//         );
//     };

//     const UploadStatus = () => {
//         return (
//             <div className="text-sm text-gray-600 flex items-center">
//                 {uploadState.status.includes("failed") ? (
//                     <FaExclamationCircle className="mr-2 text-red-500" />
//                 ) : uploadState.status.includes("success") ? (
//                     <FaCheckCircle className="mr-2 text-green-500" />
//                 ) : (
//                     <FaSync
//                         className={`mr-2 ${
//                             uploadState.uploading ? "animate-spin" : ""
//                         }`}
//                     />
//                 )}
//                 {uploadState.status}
//             </div>
//         );
//     };

//     const PauseResumeButton = () => {
//         if (!uploadState.uploading && !uploadState.isPaused) return null;

//         return (
//             <button
//                 onClick={handlePauseResume}
//                 className="flex items-center px-4 py-2 rounded bg-yellow-500 hover:bg-yellow-600 text-white"
//             >
//                 {uploadState.uploading ? (
//                     <>
//                         <FaPause className="mr-2" />
//                         Pause
//                     </>
//                 ) : (
//                     <>
//                         <FaPlay className="mr-2" />
//                         Resume
//                     </>
//                 )}
//             </button>
//         );
//     };

//     return (
//         <div className="p-6 max-w-2xl mx-auto bg-white shadow-lg rounded-lg flex flex-col">
//             <FileSelect />
//             {file && (
//                 <div className="space-y-4">
//                     <FileInfo />
//                     {uploadState.error && <ErrorInfo />}
//                     <div className="flex space-x-2">
//                         <UploadButton />
//                         <PauseResumeButton />
//                         <ResetButton />
//                     </div>

//                     {(uploadState.uploading || uploadState.isPaused) && <UploadProgress />}
//                     <UploadStatus />
//                     <p>Chunk size {uploadState.totalChunks}</p>
//                 </div>
//             )}
//         </div>
//     );
// };

// export default FileUploader;
