import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsObject, IsOptional, IsString } from 'class-validator';
import { SUBSCRIPTION_PLANS, TENANT_MODES, TENANT_STATUSES } from '@kitalent/types';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class CreateTenantDto {
  @ApiProperty({ example: 'PT Contoh Sejahtera' })
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  legalName?: string;

  @ApiPropertyOptional({ enum: TENANT_MODES as unknown as string[], default: 'saas_hris' })
  @IsOptional()
  @IsIn(TENANT_MODES as unknown as string[])
  mode?: string;

  @ApiPropertyOptional({ enum: SUBSCRIPTION_PLANS as unknown as string[], default: 'starter' })
  @IsOptional()
  @IsIn(SUBSCRIPTION_PLANS as unknown as string[])
  plan?: string;

  @ApiPropertyOptional({ default: 'id-ID' })
  @IsOptional()
  @IsString()
  defaultLocale?: string;
}

export class UpdateTenantDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  legalName?: string;

  @ApiPropertyOptional({ enum: TENANT_MODES as unknown as string[] })
  @IsOptional()
  @IsIn(TENANT_MODES as unknown as string[])
  mode?: string;

  @ApiPropertyOptional({ enum: SUBSCRIPTION_PLANS as unknown as string[] })
  @IsOptional()
  @IsIn(SUBSCRIPTION_PLANS as unknown as string[])
  plan?: string;

  @ApiPropertyOptional({ enum: TENANT_STATUSES as unknown as string[] })
  @IsOptional()
  @IsIn(TENANT_STATUSES as unknown as string[])
  status?: string;

  @ApiPropertyOptional({ type: Object, description: 'Per-tenant feature flags' })
  @IsOptional()
  @IsObject()
  featureFlags?: Record<string, unknown>;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  limits?: Record<string, unknown>;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class QueryTenantDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: TENANT_STATUSES as unknown as string[] })
  @IsOptional()
  @IsIn(TENANT_STATUSES as unknown as string[])
  status?: string;
}
