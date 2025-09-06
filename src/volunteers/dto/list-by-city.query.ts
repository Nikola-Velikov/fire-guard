import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ListByCityQueryDto {
  @ApiProperty({ example: 'San Francisco', description: 'City to filter volunteers by' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  city: string;
}

