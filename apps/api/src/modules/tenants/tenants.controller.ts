import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { TenantsService } from './tenants.service';
import { CreateTenantDto, QueryTenantDto, UpdateTenantDto } from './dto/tenant.dto';

@ApiTags('Tenants')
@ApiBearerAuth()
@Controller('tenants')
export class TenantsController {
  constructor(private readonly service: TenantsService) {}

  @Get()
  @RequirePermissions('tenant.read.all')
  @ApiOperation({ summary: 'List all tenants (platform)' })
  list(@Query() query: QueryTenantDto) {
    return this.service.list(query);
  }

  @Get(':id')
  @RequirePermissions('tenant.read.all')
  @ApiOperation({ summary: 'Get a tenant' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions('tenant.create.tenant')
  @ApiOperation({ summary: 'Create a tenant' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTenantDto) {
    return this.service.create(user, dto);
  }

  @Patch(':id')
  @RequirePermissions('tenant.update.tenant')
  @ApiOperation({ summary: 'Update a tenant (plan/status/flags)' })
  update(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTenantDto) {
    return this.service.update(user, id, dto);
  }
}
