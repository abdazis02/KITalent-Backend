import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateLeaveRequestDto {
  @ApiProperty()
  @IsUUID()
  employeeId!: string;

  @ApiProperty()
  @IsUUID()
  leaveTypeId!: string;

  @ApiProperty({ example: '2026-06-10' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ example: '2026-06-12' })
  @IsDateString()
  endDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'MinIO object key of an attachment' })
  @IsOptional()
  @IsString()
  attachmentKey?: string;
}
