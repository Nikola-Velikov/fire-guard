import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class ResetSmsQueryDto {
  @ApiProperty({ example: '66d6b5e0b1a1d3a6f3c12345', description: 'Volunteer application ID' })
  @IsMongoId()
  id: string;
}

