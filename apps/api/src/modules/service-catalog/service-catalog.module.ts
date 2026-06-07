import { Module } from '@nestjs/common';
import { Body, Controller, ForbiddenException, Get, Injectable, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { buildMeta, normalizePagination, type Paginated } from '@kitalent/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

class CreateServiceCategoryDto {
  @ApiProperty({ example: 'SECURITY' })
  @IsString()
  code!: string;

  @ApiProperty({ example: 'Security' })
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  minEducation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  minExperienceYears?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  requiresCertification?: boolean;

  @ApiPropertyOptional({ description: 'Default billing rate (whole IDR)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  defaultRate?: number;
}

@Injectable()
class ServiceCatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private requireTenant(tenantId: string | null): string {
    if (!tenantId) throw new ForbiddenException('A tenant context is required');
    return tenantId;
  }

  async create(user: AuthenticatedUser, dto: CreateServiceCategoryDto) {
    const tid = this.requireTenant(user.tenantId);
    const category = await this.prisma.serviceCategory.create({ data: { ...dto, tenantId: tid, createdBy: user.id } });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'service.create', entityType: 'ServiceCategory', entityId: category.id });
    return category;
  }

  async list(tenantId: string | null, query: PaginationQueryDto): Promise<Paginated<unknown>> {
    const tid = this.requireTenant(tenantId);
    const { page, pageSize } = normalizePagination(query);
    const where = { tenantId: tid, deletedAt: null };
    const [data, total] = await Promise.all([
      this.prisma.serviceCategory.findMany({ where, orderBy: { code: 'asc' }, skip: (page - 1) * pageSize, take: pageSize }),
      this.prisma.serviceCategory.count({ where }),
    ]);
    return { data, meta: buildMeta(page, pageSize, total) };
  }
}

@ApiTags('Service Catalog')
@ApiBearerAuth()
@Controller('service-categories')
class ServiceCatalogController {
  constructor(private readonly service: ServiceCatalogService) {}

  @Get()
  @RequirePermissions('service.read.tenant')
  @ApiOperation({ summary: 'List service categories' })
  list(@CurrentTenant() tenantId: string | null, @Query() query: PaginationQueryDto) {
    return this.service.list(tenantId, query);
  }

  @Post()
  @RequirePermissions('service.create.tenant')
  @ApiOperation({ summary: 'Create a service category' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateServiceCategoryDto) {
    return this.service.create(user, dto);
  }
}

@Module({
  controllers: [ServiceCatalogController],
  providers: [ServiceCatalogService],
})
export class ServiceCatalogModule {}
