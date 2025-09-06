import { ApiProperty } from '@nestjs/swagger';

export class VolunteerApplicationDto {
  @ApiProperty({ example: '66d6b5e0b1a1d3a6f3c12345' })
  id: string;

  @ApiProperty({ example: '1725649876543-123456789.jpg' })
  filename: string;

  @ApiProperty({ example: 'Jane' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ example: 'jane.doe@example.com' })
  email: string;

  @ApiProperty({ example: '+15551234567' })
  phoneNumber: string;

  @ApiProperty({ example: 'San Francisco' })
  city: string;

  @ApiProperty({ example: false })
  sendSMS: boolean;

  @ApiProperty({ example: '2024-09-06T12:34:56.789Z' })
  createdAt: string | Date;
}
