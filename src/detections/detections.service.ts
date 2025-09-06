import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FireReport, FireReportDocument } from './schemas/fire-report.schema';

@Injectable()
export class DetectionsService {
  constructor(
    @InjectModel(FireReport.name)
    private readonly fireReportModel: Model<FireReportDocument>,
  ) {}

  async create(filename: string, latitude: number, longitude: number, fileUrl?: string) {
    const created = await this.fireReportModel.create({ filename, latitude, longitude, fileUrl });
    return created;
  }

  async findOne(id: string) {
    const doc = await this.fireReportModel.findById(id).lean();
    if (!doc) throw new NotFoundException('Report not found');
    return doc;
  }

  async findAll() {
    return this.fireReportModel
      .find({}, undefined, { lean: true })
      .sort({ createdAt: -1 })
      .exec();
  }
}
