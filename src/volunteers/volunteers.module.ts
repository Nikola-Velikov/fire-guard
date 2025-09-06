import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { MongooseModule } from '@nestjs/mongoose';
import { VolunteersController } from './volunteers.controller';
import { VolunteersService } from './volunteers.service';
import { VolunteerApplication, VolunteerApplicationSchema } from './schemas/volunteer-application.schema';
import { AnalysisModule } from '../analysis/analysis.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    MulterModule.register({}),
    MongooseModule.forFeature([
      { name: VolunteerApplication.name, schema: VolunteerApplicationSchema },
    ]),
    AnalysisModule,
    StorageModule,
  ],
  controllers: [VolunteersController],
  providers: [VolunteersService],
})
export class VolunteersModule {}
