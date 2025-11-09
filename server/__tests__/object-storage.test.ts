import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadToMemory, upload } from '../object-storage';
import fs from 'fs';
import path from 'path';

describe('File Upload Operations (HIGH)', () => {
  describe('uploadToMemory', () => {
    it('should upload file to local storage', async () => {
      const mockFile = {
        fieldname: 'photo',
        originalname: 'test-image.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('fake image data'),
        stream: {} as any,
        destination: '',
        filename: '',
        path: ''
      };

      const result = await uploadToMemory(mockFile);

      expect(result).toBeDefined();
      expect(result).toMatch(/^\/uploads\/.+test-image\.jpg$/);
      expect(result).toContain('test-image.jpg');

      // Verify file was created
      const filePath = path.join(process.cwd(), result.replace('/', ''));
      expect(fs.existsSync(filePath)).toBe(true);

      // Clean up
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    it('should create uploads directory if missing', async () => {
      const uploadsDir = path.join(process.cwd(), 'uploads');

      // Remove uploads directory if exists
      if (fs.existsSync(uploadsDir)) {
        const files = fs.readdirSync(uploadsDir);
        files.forEach(file => {
          fs.unlinkSync(path.join(uploadsDir, file));
        });
        fs.rmdirSync(uploadsDir);
      }

      const mockFile = {
        fieldname: 'photo',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 512,
        buffer: Buffer.from('test data'),
        stream: {} as any,
        destination: '',
        filename: '',
        path: ''
      };

      const result = await uploadToMemory(mockFile);

      expect(fs.existsSync(uploadsDir)).toBe(true);

      // Clean up
      const filePath = path.join(process.cwd(), result.replace('/', ''));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    it('should generate unique filenames with nanoid', async () => {
      const mockFile = {
        fieldname: 'photo',
        originalname: 'same-name.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('file 1'),
        stream: {} as any,
        destination: '',
        filename: '',
        path: ''
      };

      const result1 = await uploadToMemory(mockFile);
      const result2 = await uploadToMemory(mockFile);

      expect(result1).not.toBe(result2);

      // Clean up
      [result1, result2].forEach(result => {
        const filePath = path.join(process.cwd(), result.replace('/', ''));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    });

    it('should preserve original filename in path', async () => {
      const mockFile = {
        fieldname: 'photo',
        originalname: 'my-recipe-photo.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 2048,
        buffer: Buffer.from('photo data'),
        stream: {} as any,
        destination: '',
        filename: '',
        path: ''
      };

      const result = await uploadToMemory(mockFile);

      expect(result).toContain('my-recipe-photo.jpg');

      // Clean up
      const filePath = path.join(process.cwd(), result.replace('/', ''));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
  });

  describe('Multer Upload Middleware', () => {
    it('should configure memory storage', () => {
      expect(upload).toBeDefined();
      expect(upload.storage).toBeDefined();
    });

    it('should have 5MB file size limit', () => {
      const limits = (upload as any).limits;
      expect(limits).toBeDefined();
      expect(limits.fileSize).toBe(5 * 1024 * 1024);
    });

    it('should have fileFilter configured', () => {
      const fileFilter = (upload as any).fileFilter;
      expect(fileFilter).toBeDefined();
      expect(typeof fileFilter).toBe('function');
    });

    it('should accept jpeg files', (done) => {
      const fileFilter = (upload as any).fileFilter;
      const mockReq = {};
      const mockFile = {
        fieldname: 'photo',
        originalname: 'test.jpeg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from(''),
        stream: {} as any,
        destination: '',
        filename: '',
        path: ''
      };

      fileFilter(mockReq, mockFile, (error: any, accepted: boolean) => {
        expect(error).toBe(null);
        expect(accepted).toBe(true);
        done();
      });
    });

    it('should accept jpg files', (done) => {
      const fileFilter = (upload as any).fileFilter;
      const mockReq = {};
      const mockFile = {
        fieldname: 'photo',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from(''),
        stream: {} as any,
        destination: '',
        filename: '',
        path: ''
      };

      fileFilter(mockReq, mockFile, (error: any, accepted: boolean) => {
        expect(error).toBe(null);
        expect(accepted).toBe(true);
        done();
      });
    });

    it('should accept png files', (done) => {
      const fileFilter = (upload as any).fileFilter;
      const mockReq = {};
      const mockFile = {
        fieldname: 'photo',
        originalname: 'test.png',
        encoding: '7bit',
        mimetype: 'image/png',
        size: 1024,
        buffer: Buffer.from(''),
        stream: {} as any,
        destination: '',
        filename: '',
        path: ''
      };

      fileFilter(mockReq, mockFile, (error: any, accepted: boolean) => {
        expect(error).toBe(null);
        expect(accepted).toBe(true);
        done();
      });
    });

    it('should accept webp files', (done) => {
      const fileFilter = (upload as any).fileFilter;
      const mockReq = {};
      const mockFile = {
        fieldname: 'photo',
        originalname: 'test.webp',
        encoding: '7bit',
        mimetype: 'image/webp',
        size: 1024,
        buffer: Buffer.from(''),
        stream: {} as any,
        destination: '',
        filename: '',
        path: ''
      };

      fileFilter(mockReq, mockFile, (error: any, accepted: boolean) => {
        expect(error).toBe(null);
        expect(accepted).toBe(true);
        done();
      });
    });

    it('should reject pdf files', (done) => {
      const fileFilter = (upload as any).fileFilter;
      const mockReq = {};
      const mockFile = {
        fieldname: 'photo',
        originalname: 'test.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: 1024,
        buffer: Buffer.from(''),
        stream: {} as any,
        destination: '',
        filename: '',
        path: ''
      };

      fileFilter(mockReq, mockFile, (error: any, accepted: boolean) => {
        expect(error).toBeDefined();
        expect(error.message).toContain('Only JPEG, PNG and WebP images are allowed');
        done();
      });
    });

    it('should reject exe files', (done) => {
      const fileFilter = (upload as any).fileFilter;
      const mockReq = {};
      const mockFile = {
        fieldname: 'photo',
        originalname: 'malware.exe',
        encoding: '7bit',
        mimetype: 'application/x-msdownload',
        size: 1024,
        buffer: Buffer.from(''),
        stream: {} as any,
        destination: '',
        filename: '',
        path: ''
      };

      fileFilter(mockReq, mockFile, (error: any, accepted: boolean) => {
        expect(error).toBeDefined();
        expect(error.message).toContain('Only JPEG, PNG and WebP images are allowed');
        done();
      });
    });

    it('should reject svg files', (done) => {
      const fileFilter = (upload as any).fileFilter;
      const mockReq = {};
      const mockFile = {
        fieldname: 'photo',
        originalname: 'test.svg',
        encoding: '7bit',
        mimetype: 'image/svg+xml',
        size: 1024,
        buffer: Buffer.from(''),
        stream: {} as any,
        destination: '',
        filename: '',
        path: ''
      };

      fileFilter(mockReq, mockFile, (error: any, accepted: boolean) => {
        expect(error).toBeDefined();
        done();
      });
    });

    it('should validate both mimetype and extension', (done) => {
      const fileFilter = (upload as any).fileFilter;
      const mockReq = {};

      // Valid extension but wrong mimetype
      const mockFile = {
        fieldname: 'photo',
        originalname: 'fake.jpg',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: 1024,
        buffer: Buffer.from(''),
        stream: {} as any,
        destination: '',
        filename: '',
        path: ''
      };

      fileFilter(mockReq, mockFile, (error: any, accepted: boolean) => {
        expect(error).toBeDefined();
        done();
      });
    });
  });
});

describe('File Upload Integration (HIGH)', () => {
  it('should handle case-insensitive file extensions', (done) => {
    const fileFilter = (upload as any).fileFilter;
    const mockReq = {};
    const mockFile = {
      fieldname: 'photo',
      originalname: 'test.JPEG',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: 1024,
      buffer: Buffer.from(''),
      stream: {} as any,
      destination: '',
      filename: '',
      path: ''
    };

    fileFilter(mockReq, mockFile, (error: any, accepted: boolean) => {
      expect(error).toBe(null);
      expect(accepted).toBe(true);
      done();
    });
  });

  it('should handle filenames with spaces', async () => {
    const mockFile = {
      fieldname: 'photo',
      originalname: 'my recipe photo.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: 1024,
      buffer: Buffer.from('test data'),
      stream: {} as any,
      destination: '',
      filename: '',
      path: ''
    };

    const result = await uploadToMemory(mockFile);

    expect(result).toBeDefined();
    expect(result).toContain('my recipe photo.jpg');

    // Clean up
    const filePath = path.join(process.cwd(), result.replace('/', ''));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });

  it('should handle special characters in filenames', async () => {
    const mockFile = {
      fieldname: 'photo',
      originalname: 'recipe-2024_v1.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: 1024,
      buffer: Buffer.from('test data'),
      stream: {} as any,
      destination: '',
      filename: '',
      path: ''
    };

    const result = await uploadToMemory(mockFile);

    expect(result).toBeDefined();
    expect(result).toContain('recipe-2024_v1.jpg');

    // Clean up
    const filePath = path.join(process.cwd(), result.replace('/', ''));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });
});
