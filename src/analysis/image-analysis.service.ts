import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';

// Using the Google Generative AI SDK. Install: npm i @google/generative-ai
// We type import lazily to avoid hard crash if not installed yet.
type GenerativeModel = any;

@Injectable()
export class ImageAnalysisService {
  private model: GenerativeModel | null = null;

  constructor(private readonly config: ConfigService) {}

  private async getModel(): Promise<GenerativeModel> {
    if (this.model) return this.model;

    const apiKey = this.config.get<string>('GOOGLE_API_KEY') || this.config.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException('Gemini API key is not configured');
    }

    try {
      // Dynamically import to avoid breaking if deps not installed yet
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      // Use the Gemini 2.5 vision model
      this.model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      return this.model;
    } catch (err) {
      throw new InternalServerErrorException('Failed to initialize Gemini client');
    }
  }

  private async runWithB64(prompt: string, b64: string, mimeType: string): Promise<boolean> {
    const model = await this.getModel();
    try {
      const result = await model.generateContent([
        { text: prompt },
        { inlineData: { data: b64, mimeType } },
      ]);
      const text: string = result?.response?.text?.() ?? String(result?.response ?? '');
      const normalized = text.trim().toUpperCase();
      return normalized.startsWith('YES');
    } catch (e) {
      throw new InternalServerErrorException('Gemini analysis failed');
    }
  }

  private async imageIsRelevant(filePath: string, prompt: string): Promise<boolean> {
    const imageBytes = await fs.readFile(filePath);
    const b64 = imageBytes.toString('base64');
    return this.runWithB64(prompt, b64, this.getMimeTypeFromPath(filePath));
  }

  private async bufferIsRelevant(buf: Buffer, prompt: string, mime?: string): Promise<boolean> {
    const b64 = buf.toString('base64');
    return this.runWithB64(prompt, b64, mime || 'application/octet-stream');
  }

  async imageShowsFire(filePath: string): Promise<boolean> {
    const prompt = [
      'You are a safety classifier. Answer strictly with one word: YES or NO.',
      'Question: Does this image clearly show active fire or wildfires (visible flames or obvious wildfire smoke)?',
    ].join('\n');
    return this.imageIsRelevant(filePath, prompt);
  }

  async imageShowsVolunteerCertificate(filePath: string): Promise<boolean> {
    const prompt = [
      'You are a strict document classifier. Answer strictly with one word: YES or NO.',
      'Question: Is this image a valid-looking volunteer certificate related to firefighting or fire service (e.g., official certificate, ID card, or training completion document), with clear text or seals indicating volunteer fire service)?',
    ].join('\n');
    return this.imageIsRelevant(filePath, prompt);
  }

  async imageBufferShowsFire(buf: Buffer, mime?: string): Promise<boolean> {
    const prompt = [
      'You are a safety classifier. Answer strictly with one word: YES or NO.',
      'Question: Does this image clearly show active fire or wildfires (visible flames or obvious wildfire smoke)?',
    ].join('\n');
    return this.bufferIsRelevant(buf, prompt, mime);
  }

  async imageBufferShowsVolunteerCertificate(buf: Buffer, mime?: string): Promise<boolean> {
    const prompt = [
      'You are a strict document classifier. Answer strictly with one word: YES or NO.',
      'Question: Is this image a valid-looking volunteer certificate related to firefighting or fire service (e.g., official certificate, ID card, or training completion document), with clear text or seals indicating volunteer fire service)?',
    ].join('\n');
    return this.bufferIsRelevant(buf, prompt, mime);
  }

  private getMimeTypeFromPath(path: string): string {
    const lower = path.toLowerCase();
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    if (lower.endsWith('.webp')) return 'image/webp';
    if (lower.endsWith('.gif')) return 'image/gif';
    return 'application/octet-stream';
  }
}
