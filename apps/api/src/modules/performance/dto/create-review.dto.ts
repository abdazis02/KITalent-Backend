import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, Min, ValidateNested } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class PerformanceItemDto {
  @ApiProperty({ example: 'Kedisiplinan' })
  @IsString()
  kpi!: string;

  @ApiPropertyOptional({ default: 1, description: 'Relative weight' })
  @IsOptional()
  @IsInt()
  @Min(1)
  weight?: number;

  @ApiProperty({ description: 'Score 0..100', example: 85 })
  @IsInt()
  @Min(0)
  @Max(100)
  score!: number;
}

export class CreateReviewDto {
  @ApiProperty()
  @IsUUID()
  employeeId!: string;

  @ApiProperty({ example: '2026-H1' })
  @IsString()
  period!: string;

  @ApiPropertyOptional({ enum: ['supervisor', 'self', 'client', 'peer'], default: 'supervisor' })
  @IsOptional()
  @IsIn(['supervisor', 'self', 'client', 'peer'])
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [PerformanceItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PerformanceItemDto)
  items!: PerformanceItemDto[];
}

export class QueryReviewDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ['draft', 'in_review', 'submitted', 'approved', 'published', 'archived'] })
  @IsOptional()
  @IsIn(['draft', 'in_review', 'submitted', 'approved', 'published', 'archived'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  employeeId?: string;
}
