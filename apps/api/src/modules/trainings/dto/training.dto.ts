import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

const TRAINING_STATUSES = ['planned', 'ongoing', 'completed', 'cancelled'];
const ENROLLMENT_RESULTS = ['attended', 'passed', 'failed', 'no_show'];

export class CreateTrainingDto {
  @ApiProperty({ example: 'TRN-0001' })
  @IsString()
  code!: string;

  @ApiProperty({ example: 'Pelatihan K3 Dasar' })
  @IsString()
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  trainer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: '2026-07-01T09:00:00Z' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({ default: false, description: 'Produces a certification' })
  @IsOptional()
  @IsBoolean()
  certifies?: boolean;
}

export class EnrollDto {
  @ApiProperty()
  @IsUUID()
  employeeId!: string;
}

export class CompleteEnrollmentDto {
  @ApiProperty({ enum: ENROLLMENT_RESULTS })
  @IsIn(ENROLLMENT_RESULTS)
  status!: string;

  @ApiPropertyOptional({ description: 'Score 0..100' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  score?: number;

  @ApiPropertyOptional({ description: 'MinIO key of the certificate' })
  @IsOptional()
  @IsString()
  certificateKey?: string;

  @ApiPropertyOptional({ example: '2028-07-01' })
  @IsOptional()
  @IsDateString()
  certificateExpiry?: string;
}

export class QueryTrainingDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: TRAINING_STATUSES })
  @IsOptional()
  @IsIn(TRAINING_STATUSES)
  status?: string;
}
