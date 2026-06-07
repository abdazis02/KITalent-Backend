import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { CONTRACT_STATUSES, CONTRACT_TYPES } from '@kitalent/types';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class QueryContractDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: CONTRACT_STATUSES as unknown as string[] })
  @IsOptional()
  @IsEnum(CONTRACT_STATUSES as unknown as object)
  status?: string;

  @ApiPropertyOptional({ enum: CONTRACT_TYPES as unknown as string[] })
  @IsOptional()
  @IsEnum(CONTRACT_TYPES as unknown as object)
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Return contracts ending on/before this date (expiry monitoring)' })
  @IsOptional()
  @IsDateString()
  expiringBefore?: string;
}
