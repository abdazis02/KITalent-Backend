import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Matches, Min } from 'class-validator';

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CreateShiftDto {
  @ApiProperty({ example: 'PAGI' })
  @IsString()
  code!: string;

  @ApiProperty({ example: 'Shift Pagi' })
  @IsString()
  name!: string;

  @ApiProperty({ example: '08:00' })
  @Matches(HHMM, { message: 'startTime must be HH:mm' })
  startTime!: string;

  @ApiProperty({ example: '17:00' })
  @Matches(HHMM, { message: 'endTime must be HH:mm' })
  endTime!: string;

  @ApiPropertyOptional({ example: '12:00' })
  @IsOptional()
  @Matches(HHMM, { message: 'breakStart must be HH:mm' })
  breakStart?: string;

  @ApiPropertyOptional({ example: '13:00' })
  @IsOptional()
  @Matches(HHMM, { message: 'breakEnd must be HH:mm' })
  breakEnd?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  lateToleranceMin?: number;

  @ApiPropertyOptional({ default: 8 })
  @IsOptional()
  @IsInt()
  @Min(0)
  minWorkingHour?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  overtimeEligible?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isOvernight?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
