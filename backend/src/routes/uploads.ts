import { Router, Request, Response } from 'express';
import { sendSuccess, sendError } from '../lib/response.js';
import { ValidationError } from '../lib/errors.js';
import { blobStorageService } from '../services/blob-storage.service.js';
import multer from 'multer';

const router = Router();

// Configure multer for in-memory file storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Allow images and PDFs
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ValidationError('File type not allowed'));
    }
  },
});

// POST /api/uploads/file
router.post('/file', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      throw new ValidationError('No file provided');
    }

    const fileName = blobStorageService.generateFileName(req.file.originalname);
    const fileUrl = await blobStorageService.uploadFile(
      req.file.buffer,
      fileName,
      req.file.mimetype
    );

    return sendSuccess(res, { fileName, fileUrl }, 201);
  } catch (error: any) {
    if (error.statusCode && error.code) {
      return sendError(res, error.statusCode, error.code, error.message);
    }
    return sendError(res, 500, 'UPLOAD_FAILED', 'Failed to upload file');
  }
});

// DELETE /api/uploads/file/:fileName
router.delete('/file/:fileName', async (req: Request, res: Response) => {
  try {
    const { fileName } = req.params;

    if (!fileName) {
      throw new ValidationError('File name is required');
    }

    await blobStorageService.deleteFile(fileName);
    return sendSuccess(res, { message: 'File deleted successfully' });
  } catch (error: any) {
    if (error.statusCode && error.code) {
      return sendError(res, error.statusCode, error.code, error.message);
    }
    return sendError(res, 500, 'DELETE_FAILED', 'Failed to delete file');
  }
});

export default router;
