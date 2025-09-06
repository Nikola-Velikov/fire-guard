import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { VolunteersService } from './volunteers.service';
import { ImageAnalysisService } from '../analysis/image-analysis.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { ApiBody, ApiConsumes, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { VolunteerApplicationDto } from './dto/volunteer-application.dto';
import { ListByCityQueryDto } from './dto/list-by-city.query';
import { ResetSmsQueryDto } from './dto/reset-sms.query';
import { StorageService } from '../storage/storage.service';

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'certificates');

function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });
}

function fileNameGenerator(_, file, cb) {
  const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const ext = extname(file.originalname) || '';
  cb(null, `${unique}${ext}`);
}

@ApiTags('volunteers')
@Controller('volunteers')
export class VolunteersController {
  constructor(
    private readonly service: VolunteersService,
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
  @ApiOperation({ summary: 'Submit volunteer application with certificate image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        firstName: { type: 'string', example: 'Jane' },
        lastName: { type: 'string', example: 'Doe' },
        email: { type: 'string', example: 'jane.doe@example.com' },
        phoneNumber: { type: 'string', example: '+15551234567' },
        city: { type: 'string', example: 'San Francisco' },
      },
      required: ['file', 'firstName', 'lastName', 'email', 'phoneNumber', 'city'],
    },
  })
  @ApiCreatedResponse({ description: 'Application saved', type: VolunteerApplicationDto })
  @ApiResponse({ status: 400, description: 'Image is not a valid volunteer certificate or invalid input' })
  async submit(
    @UploadedFile() file: { filename?: string; originalname: string; buffer: Buffer; mimetype?: string } | undefined,
    @Body() body: CreateApplicationDto,
  ) {
    if (!file) throw new BadRequestException('Image file is required');
    const isCert = await this.analysis.imageBufferShowsVolunteerCertificate((file as any).buffer, (file as any).mimetype);
    if (!isCert) {
      throw new BadRequestException('Image does not look like a volunteer fire certificate');
    }

    const stored = await this.storage.save('certificates', (file as any).buffer, file.originalname, (file as any).mimetype);
    const saved = await this.service.create({
      filename: stored.filename,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phoneNumber: body.phoneNumber,
      city: body.city,
      sendSMS: !!body.sendSMS,
    });

    const result: VolunteerApplicationDto = {
      id: String(saved._id),
      filename: saved.filename,
      firstName: saved.firstName,
      lastName: saved.lastName,
      email: saved.email,
      phoneNumber: saved.phoneNumber,
      city: saved.city,
      sendSMS: !!(saved as any).sendSMS,
      createdAt: (saved as any).createdAt,
    };

    return result;
  }

  @Get()
  @ApiOperation({ summary: 'List volunteers by city' })
  @ApiQuery({
    name: 'city',
    type: String,
    required: true,
    example: 'San Francisco',
    description: 'City name to filter volunteers by (case-insensitive match)',
  })
  @ApiOkResponse({ description: 'Array of volunteers in the city', type: VolunteerApplicationDto, isArray: true })
  async listByCity(@Query() query: ListByCityQueryDto) {
    const docs = await this.service.findByCity(query.city);
    return docs.map((d: any) => ({
      id: String(d._id),
      filename: d.filename,
      firstName: d.firstName,
      lastName: d.lastName,
      email: d.email,
      phoneNumber: d.phoneNumber,
      city: d.city,
      sendSMS: !!d.sendSMS,
      createdAt: d.createdAt,
    }));
  }

  @Get('send-sms/reset')
  @ApiOperation({ summary: 'Mark sendSMS=true for 24 hours by volunteer ID' })
  @ApiQuery({ name: 'id', type: String, required: true, description: 'Volunteer application ID' })
  @ApiOkResponse({ description: 'Volunteer after enabling sendSMS', type: VolunteerApplicationDto })
  async resetSendSMS(@Query() query: ResetSmsQueryDto) {
    const doc = await this.service.setSendSMSTrueById(query.id);
    if (!doc) throw new BadRequestException('Volunteer not found');
    const result: VolunteerApplicationDto = {
      id: String(doc._id),
      filename: doc.filename,
      firstName: doc.firstName,
      lastName: doc.lastName,
      email: doc.email,
      phoneNumber: doc.phoneNumber,
      city: doc.city,
      sendSMS: !!doc.sendSMS,
      createdAt: doc.createdAt as any,
    };
    return result;
  }
}
