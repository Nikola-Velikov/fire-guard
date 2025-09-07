import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Get,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { DetectionsService } from './detections.service';
import { CreateDetectionDto } from './dto/create-detection.dto';
import { ImageAnalysisService } from '../analysis/image-analysis.service';
import { ApiBody, ApiConsumes, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FireReportDto } from './dto/fire-report.dto';
import { StorageService } from '../storage/storage.service';

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'fires');

function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

function fileNameGenerator(_, file, cb) {
  const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const ext = extname(file.originalname) || '';
  cb(null, `${unique}${ext}`);
}

@ApiTags('detections')
@Controller('detections')
export class DetectionsController {
  constructor(
    private readonly detectionsService: DetectionsService,
    private readonly analysis: ImageAnalysisService,
    private readonly storage: StorageService,
  ) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: (req, file, cb) => {
        const ok = /\.(png|jpg|jpeg|webp|gif)$/i.test(file.originalname);
        if (!ok) return cb(new BadRequestException('Only image files are allowed'), false);
        cb(null, true);
      },
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  @ApiOperation({ summary: 'Upload image, analyze for fire, and persist report' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        lat: { type: 'number', example: 37.7749 },
        lon: { type: 'number', example: -122.4194 },
      },
      required: ['file', 'lat', 'lon'],
    },
  })
  @ApiCreatedResponse({ description: 'Fire detected and saved', type: FireReportDto })
  @ApiResponse({ status: 400, description: 'Image does not show fire or invalid input' })
  async uploadAndAnalyze(
    // Using a minimal structural type to avoid Express.Multer type dependency
    @UploadedFile() file: { filename?: string; originalname: string; buffer: Buffer; mimetype?: string } | undefined,
    @Body() body: CreateDetectionDto,
  ) {
    if (!file) throw new BadRequestException('Image file is required');
    if (typeof body?.lat !== 'number' || typeof body?.lon !== 'number') {
      throw new BadRequestException('lat and lon are required');
    }

    const isFire = await this.analysis.imageBufferShowsFire((file as any).buffer, (file as any).mimetype);
    if (!isFire) {
      throw new BadRequestException('Image does not show fire');
    }

    const stored = await this.storage.save('fires', (file as any).buffer, file.originalname, (file as any).mimetype);
    const saved = await this.detectionsService.create(stored.filename, body.lat, body.lon);
    const result: FireReportDto & { url: string } = {
      id: String(saved._id),
      filename: saved.filename,
      lat: saved.latitude,
      lon: saved.longitude,
      createdAt: (saved as any).createdAt,
      url: stored.url || `/uploads/fires/${saved.filename}`,
    };
    return result;
  }

  @Get()
  @ApiOperation({ summary: 'List all fire reports' })
  @ApiOkResponse({ description: 'Array of reports', type: FireReportDto, isArray: true })
  async getAll() {
    const docs = await this.detectionsService.findAll();
    return docs.map((d: any) => ({
      id: String(d._id),
      filename: d.filename,
      lat: d.latitude,
      lon: d.longitude,
      createdAt: d.createdAt,
      url: `/uploads/fires/${d.filename}`,
    }));
  }
}
