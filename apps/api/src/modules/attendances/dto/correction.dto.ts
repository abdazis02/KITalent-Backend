import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class RequestCorrectionDto {
  @ApiPropertyOptional({ description: 'Proposed corrected check-in time' })
  @IsOptional()
  @IsDateString()
  proposedCheckInAt?: string;

  @ApiPropertyOptional({ description: 'Proposed corrected check-out time' })
  @IsOptional()
  @IsDateString()
  proposedCheckOutAt?: string;

  @ApiProperty({ example: 'Lupa absen pulang, sistem error' })
  @IsString()
  reason!: string;
}
