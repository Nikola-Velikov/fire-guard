import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { DetectionsModule } from '../detections/detections.module';
import { VolunteersModule } from '../volunteers/volunteers.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI') ?? 'mongodb://localhost:27017/fire-guard',
      }),
      inject: [ConfigService],
    }),
    DetectionsModule,
    VolunteersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
