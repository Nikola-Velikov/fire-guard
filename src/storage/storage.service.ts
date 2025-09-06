import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { extname, join } from 'path';
import { existsSync, mkdirSync, promises as fs } from 'fs';

@Injectable()
export class StorageService {
  constructor(private readonly config: ConfigService) {}

  private ensureDir(path: string) {
    if (!existsSync(path)) mkdirSync(path, { recursive: true });
  }

  private genFilename(originalname: string) {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = extname(originalname) || '';
    return `${unique}${ext}`;
  }

  async save(folder: 'fires' | 'certificates', buf: Buffer, originalname: string, mime?: string) {
    const driver = (this.config.get<string>('STORAGE_DRIVER') || 'local').toLowerCase();
    const filename = this.genFilename(originalname);

    if (driver === 'blob') {
      // Vercel Blob
      try {
        const { put } = await import('@vercel/blob');
        const key = `${folder}/${filename}`;
        const res = await put(key, buf, {
          access: 'public',
          token: this.config.get<string>('BLOB_READ_WRITE_TOKEN'),
          contentType: mime,
        });
        return { filename, url: res.url };
      } catch (e) {
        throw new InternalServerErrorException('Failed to upload to blob storage');
      }
    }

    // Local storage (default)
    const base = join(process.cwd(), 'uploads', folder);
    this.ensureDir(base);
    const full = join(base, filename);
    await fs.writeFile(full, buf);
    return { filename, url: `/uploads/${folder}/${filename}` };
  }
}

