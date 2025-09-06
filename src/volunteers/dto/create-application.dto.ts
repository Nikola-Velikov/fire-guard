import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateApplicationDto {
  @ApiProperty({ example: 'Jane' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @ApiProperty({ example: 'jane.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+15551234567', description: 'Phone number in E.164 or local format' })
  @IsString()
  @MinLength(5)
  @MaxLength(25)
  @Matches(/^[+()\d\s-]+$/)
  phoneNumber: string;

  @ApiProperty({ example: 'San Francisco' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  city: string;

  @ApiPropertyOptional({ example: false, description: 'If true, mark volunteer as contacted by SMS for 24 hours' })
  @IsOptional()
  @IsBoolean()
  sendSMS?: boolean;
}
