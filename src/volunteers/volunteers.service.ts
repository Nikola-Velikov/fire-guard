import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { VolunteerApplication, VolunteerApplicationDocument } from './schemas/volunteer-application.schema';

@Injectable()
export class VolunteersService {
  private readonly logger = new Logger(VolunteersService.name);
  private smsResetTimers = new Map<string, NodeJS.Timeout>();
  constructor(
    @InjectModel(VolunteerApplication.name)
    private readonly model: Model<VolunteerApplicationDocument>,
  ) {}

  async create(data: {
    filename: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    city: string;
    sendSMS?: boolean;
  }) {
    const sendSMS = !!data.sendSMS;
    const payload: any = { ...data, sendSMS };
    if (sendSMS) payload.sendSMSSetAt = new Date();
    const saved = await this.model.create(payload);
    if (sendSMS) this.scheduleSmsReset(String(saved._id));
    return saved;
  }

  // Schedule a reset for a specific volunteer only (24 hours)
  private scheduleSmsReset(id: string) {
    // Clear existing timer if present
    const existing = this.smsResetTimers.get(id);
    if (existing) clearTimeout(existing);
    const ms24h = 24 * 60 * 60 * 1000;
    const timer = setTimeout(async () => {
      try {
        await this.model.updateOne(
          { _id: id, sendSMS: true },
          { $set: { sendSMS: false }, $unset: { sendSMSSetAt: 1 } },
        );
      } catch (e) {
        this.logger.warn(`Failed to auto-reset sendSMS for ${id}: ${String(e)}`);
      } finally {
        this.smsResetTimers.delete(id);
      }
    }, ms24h);
    this.smsResetTimers.set(id, timer);
  }

  async findByCity(city: string) {
    return this.model
      .find({ city, sendSMS: false }, undefined, { lean: true })
      .collation({ locale: 'en', strength: 2 })
      .sort({ createdAt: -1 })
      .exec();
  }

  async resetSendSMSById(id: string) {
    await this.model.updateOne({ _id: id }, { $set: { sendSMS: false }, $unset: { sendSMSSetAt: 1 } });
    return this.model.findById(id).lean();
  }

  async setSendSMSTrueById(id: string) {
    await this.model.updateOne(
      { _id: id },
      { $set: { sendSMS: true, sendSMSSetAt: new Date() } },
    );
    this.scheduleSmsReset(id);
    return this.model.findById(id).lean();
  }
}
