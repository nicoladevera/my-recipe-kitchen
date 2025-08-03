import multer from 'multer';
import { nanoid } from 'nanoid';

// Object Storage configuration - disabled for now due to bucket configuration issues
let objectStorageAvailable = false;

// Configure multer to use memory storage for cloud uploads
export const uploadToMemory = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG and WebP images are allowed'));
    }
  }
});

// Upload file to Replit Object Storage (currently disabled)
export async function uploadToObjectStorage(file: Express.Multer.File): Promise<string> {
  throw new Error('Object Storage is not currently configured');
}

// Check if Object Storage is available (currently disabled)
export function isObjectStorageConfigured(): boolean {
  return false;
}