import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PLACEMENT_STATUSES } from '@kitalent/types';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class QueryPlacementDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: PLACEMENT_STATUSES as unknown as string[] })
  @IsOptional()
  @IsEnum(PLACEMENT_STATUSES as unknown as object)
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  clientId?: string;
}
