import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { env } from '../config/env.js';
import { ALLOWED_MIME } from '../utils/constants.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Files are buffered in memory, not written to disk here, because the active
 * storage driver decides where they end up (Cloudinary in production, local
 * disk only as a development fallback). Buffers are flushed as soon as the
 * upload completes, and the size/count limits below bound memory use.
 */
const uploadRoot = path.resolve(process.cwd(), env.uploadDir);
fs.mkdirSync(uploadRoot, { recursive: true });

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxFileMb * 1024 * 1024, files: 8 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      return cb(new ApiError(400, `Unsupported file type: ${file.mimetype}. Allowed: PDF, DOC/DOCX, XLS/XLSX, PPT/PPTX, TXT, CSV, PNG, JPG, ZIP.`));
    }
    cb(null, true);
  },
});

export const UPLOAD_ROOT = uploadRoot;
