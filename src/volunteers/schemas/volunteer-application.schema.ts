import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type VolunteerApplicationDocument = HydratedDocument<VolunteerApplication>;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class VolunteerApplication {
  @Prop({ required: true })
  filename: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  phoneNumber: string;

  @Prop({ required: true })
  city: string;

  @Prop({ type: Boolean, default: false })
  sendSMS: boolean;

  @Prop({ type: Date, required: false })
  sendSMSSetAt?: Date;

  // Added for TypeScript typing; value is populated by timestamps option
  @Prop({ type: Date })
  createdAt?: Date;
}

export const VolunteerApplicationSchema = SchemaFactory.createForClass(VolunteerApplication);
