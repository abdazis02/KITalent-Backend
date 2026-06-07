import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

const STATUSES = ['available', 'assigned', 'returned', 'damaged', 'lost', 'retired'];
const CONDITIONS = ['good', 'damaged', 'lost'];

export class CreateAssetDto {
  @ApiProperty({ example: 'AST-0001' })
  @IsString()
  code!: string;

  @ApiProperty({ example: 'Seragam Security Set' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 'uniform', default: 'asset' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  serialNumber?: string;

  @ApiPropertyOptional({ description: 'Acquisition value in whole IDR' })
  @IsOptional()
  @IsInt()
  @Min(0)
  value?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class AssignAssetDto {
  @ApiProperty()
  @IsUUID()
  employeeId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ReturnAssetDto {
  @ApiPropertyOptional({ enum: CONDITIONS, default: 'good' })
  @IsOptional()
  @IsIn(CONDITIONS)
  condition?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class QueryAssetDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: STATUSES })
  @IsOptional()
  @IsIn(STATUSES)
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  employeeId?: string;
}
