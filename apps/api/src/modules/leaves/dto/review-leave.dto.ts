import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ReviewLeaveDto {
  @ApiPropertyOptional({ description: 'Reason, required when rejecting' })
  @IsOptional()
  @IsString()
  reason?: string;
}
