import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { MongooseModule } from '@nestjs/mongoose';
import { DetectionsController } from './detections.controller';
import { DetectionsService } from './detections.service';
import { FireReport, FireReportSchema } from './schemas/fire-report.schema';
import { AnalysisModule } from '../analysis/analysis.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    MulterModule.register({}),
    MongooseModule.forFeature([{ name: FireReport.name, schema: FireReportSchema }]),
    AnalysisModule,
    StorageModule,
  ],
  controllers: [DetectionsController],
  providers: [DetectionsService],
})
export class DetectionsModule {}
