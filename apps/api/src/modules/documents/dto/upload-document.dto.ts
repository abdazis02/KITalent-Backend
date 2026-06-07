import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

const OWNER_TYPES = ['general', 'employee', 'client', 'contract', 'candidate'];

export class UploadDocumentDto {
  @ApiProperty({ example: 'KTP', description: 'Document type (configurable)' })
  @IsString()
  type!: string;

  @ApiPropertyOptional({ enum: OWNER_TYPES, default: 'general' })
  @IsOptional()
  @IsIn(OWNER_TYPES)
  ownerType?: string;

  @ApiPropertyOptional({ description: 'Owner entity id (employee/client/…)' })
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional({ example: '2027-12-31' })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;
}

export class QueryDocumentDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: OWNER_TYPES })
  @IsOptional()
  @IsIn(OWNER_TYPES)
  ownerType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string;
}
