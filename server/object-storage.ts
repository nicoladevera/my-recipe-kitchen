import multer from 'multer';
import { nanoid } from 'nanoid';

// Initialize Replit Object Storage client lazily
let client: any = null;
let objectStorageAvailable = false;

async function initializeObjectStorage() {
  if (!client) {
    try {
      const { Client } = await import('@replit/object-storage');
      // Use the bucket ID from environment variables for proper initialization
      const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
      if (!bucketId) {
        throw new Error('DEFAULT_OBJECT_STORAGE_BUCKET_ID environment variable not set');
      }
      // Pass bucket ID as an option object to the Client constructor
      client = new Client({ bucketId });
      objectStorageAvailable = true;
      console.log('Object Storage initialized successfully with bucket:', bucketId);
    } catch (error) {
      console.error('Object Storage initialization failed:', error);
      objectStorageAvailable = false;
      throw error; // Re-throw to make the error visible
    }
  }
  return client;
}

// Configure multer to use memory storage for cloud uploads
export const upload = multer({
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

// Upload file to local storage (fallback)
export async function uploadToMemory(file: Express.Multer.File): Promise<string> {
  const fs = await import('fs');
  const path = await import('path');
  
  // Create uploads directory if it doesn't exist
  const uploadsDir = 'uploads';
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  // Generate unique filename
  const fileName = `${nanoid()}-${file.originalname}`;
  const filePath = path.join(uploadsDir, fileName);
  
  // Write file to local storage
  fs.writeFileSync(filePath, file.buffer);
  
  // Return URL path
  return `/uploads/${fileName}`;
}

// Upload file to Replit Object Storage
export async function uploadToObjectStorage(file: Express.Multer.File): Promise<string> {
  try {
    const storageClient = await initializeObjectStorage();
    if (!storageClient) {
      throw new Error('Object Storage is not available');
    }
    
    const fileName = `recipe-photos/${nanoid()}-${file.originalname}`;
    console.log(`Uploading file to Object Storage: ${fileName}`);
    
    // Upload the file buffer to Replit Object Storage
    await storageClient.uploadFromBytes(fileName, file.buffer);
    console.log(`Successfully uploaded: ${fileName}`);
    
    // Return the path that can be served via our API
    return `/objects/${fileName}`;
  } catch (error) {
    console.error('Upload to Object Storage failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to upload to Object Storage: ${errorMessage}`);
  }
}

// Delete file from Replit Object Storage
export async function deleteFromObjectStorage(filePath: string): Promise<void> {
  const storageClient = await initializeObjectStorage();
  if (!storageClient) {
    return; // Skip deletion if Object Storage not available
  }
  
  try {
    // Extract the actual file name from the path (remove /objects/ prefix)
    const fileName = filePath.startsWith('/objects/') ? filePath.substring(9) : filePath;
    await storageClient.delete(fileName);
  } catch (error) {
    // Log but don't throw - file might already be deleted
    console.warn(`Failed to delete ${filePath} from Object Storage:`, error);
  }
}

// Check if Object Storage is available
export function isObjectStorageConfigured(): boolean {
  return true; // Always try to use Object Storage first
}

// Serve file from Object Storage
export async function serveFromObjectStorage(fileName: string): Promise<Buffer | null> {
  const storageClient = await initializeObjectStorage();
  if (!storageClient) {
    return null;
  }
  
  try {
    return await storageClient.downloadAsBytes(fileName);
  } catch (error) {
    console.warn(`Failed to serve ${fileName} from Object Storage:`, error);
    return null;
  }
}