import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID, Matches } from 'class-validator';

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CreateOvertimeDto {
  @ApiProperty()
  @IsUUID()
  employeeId!: string;

  @ApiProperty({ example: '2026-06-15' })
  @IsDateString()
  date!: string;

  @ApiProperty({ example: '17:00' })
  @Matches(HHMM, { message: 'startTime must be HH:mm' })
  startTime!: string;

  @ApiProperty({ example: '20:00' })
  @Matches(HHMM, { message: 'endTime must be HH:mm' })
  endTime!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'MinIO object key of an attachment' })
  @IsOptional()
  @IsString()
  attachmentKey?: string;
}
