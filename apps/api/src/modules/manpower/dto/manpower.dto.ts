import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { MANPOWER_REQUEST_STATUSES } from '@kitalent/types';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class CreateManpowerRequestDto {
  @ApiProperty({ example: 'MPR-2026-001' })
  @IsString()
  code!: string;

  @ApiProperty()
  @IsUUID()
  clientId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  serviceCategoryId?: string;

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: '2026-07-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  durationMonths?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  qualification?: string;

  @ApiPropertyOptional({ description: 'Budget in whole IDR' })
  @IsOptional()
  @IsInt()
  @Min(0)
  budget?: number;
}

export class ConvertToVacancyDto {
  @ApiProperty({ example: 'VAC-2026-010' })
  @IsString()
  vacancyCode!: string;

  @ApiProperty({ example: 'Security Officer' })
  @IsString()
  title!: string;
}

export class QueryManpowerDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: MANPOWER_REQUEST_STATUSES as unknown as string[] })
  @IsOptional()
  @IsIn(MANPOWER_REQUEST_STATUSES as unknown as string[])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  clientId?: string;
}
