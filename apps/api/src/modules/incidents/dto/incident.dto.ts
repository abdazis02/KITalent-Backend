import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

const SEVERITIES = ['low', 'medium', 'high'];
const STATUSES = ['reported', 'investigating', 'action_taken', 'resolved', 'dismissed'];

export class CreateIncidentDto {
  @ApiProperty()
  @IsUUID()
  employeeId!: string;

  @ApiProperty({ example: 'attendance' })
  @IsString()
  category!: string;

  @ApiPropertyOptional({ enum: SEVERITIES, default: 'medium' })
  @IsOptional()
  @IsIn(SEVERITIES)
  severity?: string;

  @ApiProperty({ example: 'Tidak hadir tanpa keterangan' })
  @IsString()
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '2026-06-15' })
  @IsDateString()
  incidentDate!: string;

  @ApiPropertyOptional({ description: 'MinIO object key of evidence' })
  @IsOptional()
  @IsString()
  attachmentKey?: string;
}

export class ResolveIncidentDto {
  @ApiPropertyOptional({ example: 'Surat Peringatan 1' })
  @IsOptional()
  @IsString()
  sanction?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  investigationNotes?: string;
}

export class QueryIncidentDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: STATUSES })
  @IsOptional()
  @IsIn(STATUSES)
  status?: string;

  @ApiPropertyOptional({ enum: SEVERITIES })
  @IsOptional()
  @IsIn(SEVERITIES)
  severity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  employeeId?: string;
}
