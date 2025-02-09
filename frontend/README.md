# ChunkVault

ChunkVault is a React-based file uploader that enables chunk-by-chunk file uploads to AWS S3. It features a modern UI with upload progress tracking and pause/resume functionality. It is not production-ready and is intended for educational purposes only.

## Features

- 📦 Chunk-by-chunk file upload
- ⏸️ Pause and resume upload functionality
- 📊 Real-time upload progress chunk by chunk
- 🎯 Default chunk size of 5MB
- 🎨 Modern UI with Tailwind CSS

## How It Works

1. File is split into 5MB chunks
2. Initial request to `/api/upload/init` provides upload URL
3. Each chunk is uploaded sequentially to `/api/upload/chunk` with required data like chunk, part number, uploadId, key.
4. Progress is tracked for each chunk
5. Upload can be paused/resumed at any time
6. Final merge happens on server once all chunks are uploaded
7. If upload is cancelled, all uploaded chunks are deleted from S3

## Tech Stack

- React 19
- Vite
- Tailwind CSS
- AWS SDK
- TypeScript

## Setup

1. Clone the repository:

```bash
git clone https://github.com/mones-cse/chunkvault.git
cd chunkvault
```

2. Install dependencies:

```bash
pnpm install
```

3. Run the development server:

```bash
pnpm dev
```

## License

[MIT](https://choosealicense.com/licenses/mit/)
