import { ApiProperty } from '@nestjs/swagger';

export class FireReportDto {
  @ApiProperty({ example: '66d6b5e0b1a1d3a6f3c12345' })
  id: string;

  @ApiProperty({ example: '1725649876543-123456789.jpg' })
  filename: string;

  @ApiProperty({ example: 37.7749 })
  lat: number;

  @ApiProperty({ example: -122.4194 })
  lon: number;

  @ApiProperty({ example: '2024-09-06T12:34:56.789Z' })
  createdAt: string | Date;
}

