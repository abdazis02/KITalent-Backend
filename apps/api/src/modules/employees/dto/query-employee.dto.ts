import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { EMPLOYEE_STATUSES } from '@kitalent/types';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class QueryEmployeeDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: EMPLOYEE_STATUSES as unknown as string[] })
  @IsOptional()
  @IsEnum(EMPLOYEE_STATUSES as unknown as object)
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  companyId?: string;
}
