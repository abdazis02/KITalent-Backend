import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

const STATUSES = ['requested', 'approved', 'active', 'completed', 'rejected', 'cancelled'];

export class QueryLoanDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: STATUSES })
  @IsOptional()
  @IsIn(STATUSES)
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  employeeId?: string;
}

export class RejectLoanDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}
