import { Router, Request, Response } from "express";
import multer from "multer";
import { uploadController } from "../controllers/upload.controller";

const router = Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/size-calculate", (req: Request, res: Response) => {
  const { size } = req.body;
  console.log({ size });
  const chunkUnitInMB = 5;
  const chunkSize = chunkUnitInMB * 1024 * 1024;
  const totalChunks = Math.ceil(size / chunkSize);
  res.json({ totalChunks });
});

router.post("/init", (req: Request, res: Response) => {
  uploadController.initiateUpload(req, res);
});
router.post("/chunk", upload.single("chunk"), (req: Request, res: Response) => {
  uploadController.uploadChunk(req, res);
});
router.post("/complete", (req: Request, res: Response) => {
  uploadController.completeUpload(req, res);
});
router.post("/abort", (req: Request, res: Response) => {
  uploadController.abortUpload(req, res);
});

export const uploadRoutes = router;
