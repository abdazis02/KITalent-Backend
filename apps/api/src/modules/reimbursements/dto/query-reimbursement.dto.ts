import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

const STATUSES = ['submitted', 'waiting_approval', 'approved', 'rejected', 'paid', 'cancelled'];

export class QueryReimbursementDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: STATUSES })
  @IsOptional()
  @IsIn(STATUSES)
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  employeeId?: string;
}

export class RejectReimbursementDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}
