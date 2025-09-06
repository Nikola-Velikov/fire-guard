import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type FireReportDocument = HydratedDocument<FireReport>;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class FireReport {
  @Prop({ required: true })
  filename: string;

  @Prop({ required: false })
  fileUrl?: string;

  @Prop({ required: true, type: Number, min: -90, max: 90 })
  latitude: number;

  @Prop({ required: true, type: Number, min: -180, max: 180 })
  longitude: number;

  // Added for TypeScript typing; value is populated by timestamps option
  @Prop({ type: Date })
  createdAt?: Date;
}

export const FireReportSchema = SchemaFactory.createForClass(FireReport);
