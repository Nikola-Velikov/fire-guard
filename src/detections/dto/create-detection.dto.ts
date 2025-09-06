import { IsLatitude, IsLongitude, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDetectionDto {
  @ApiProperty({ example: 37.7749, description: 'Latitude', type: Number })
  @IsNotEmpty()
  @IsLatitude()
  lat: number;

  @ApiProperty({ example: -122.4194, description: 'Longitude', type: Number })
  @IsNotEmpty()
  @IsLongitude()
  lon: number;
}
