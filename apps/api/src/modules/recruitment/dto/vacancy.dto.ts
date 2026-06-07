import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

const VACANCY_STATUSES = ['draft', 'open', 'on_hold', 'closed', 'cancelled'];

export class CreateVacancyDto {
  @ApiProperty({ example: 'VAC-2026-001' })
  @IsString()
  code!: string;

  @ApiProperty({ example: 'Security Officer' })
  @IsString()
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({ example: 'Jakarta' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({ description: 'Client this manpower request is for' })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  requirements?: string;
}

export class QueryVacancyDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: VACANCY_STATUSES })
  @IsOptional()
  @IsIn(VACANCY_STATUSES)
  status?: string;
}
