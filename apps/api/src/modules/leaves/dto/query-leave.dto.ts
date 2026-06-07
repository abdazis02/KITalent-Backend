import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { REQUEST_STATUSES } from '@kitalent/types';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class QueryLeaveDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: REQUEST_STATUSES as unknown as string[] })
  @IsOptional()
  @IsEnum(REQUEST_STATUSES as unknown as object)
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  employeeId?: string;
}
