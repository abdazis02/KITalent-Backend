import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { AssetsService } from './assets.service';
import { AssignAssetDto, CreateAssetDto, QueryAssetDto, ReturnAssetDto } from './dto/asset.dto';

@ApiTags('Assets')
@ApiBearerAuth()
@Controller('assets')
export class AssetsController {
  constructor(private readonly service: AssetsService) {}

  @Get()
  @RequirePermissions('asset.read.tenant')
  @ApiOperation({ summary: 'List assets (filter by status/category/holder)' })
  list(@CurrentTenant() tenantId: string | null, @Query() query: QueryAssetDto) {
    return this.service.list(tenantId, query);
  }

  @Get(':id')
  @RequirePermissions('asset.read.tenant')
  @ApiOperation({ summary: 'Get an asset' })
  findOne(@CurrentTenant() tenantId: string | null, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(tenantId, id);
  }

  @Get(':id/history')
  @RequirePermissions('asset.read.tenant')
  @ApiOperation({ summary: 'Assignment history of an asset' })
  history(@CurrentTenant() tenantId: string | null, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.history(tenantId, id);
  }

  @Post()
  @RequirePermissions('asset.create.tenant')
  @ApiOperation({ summary: 'Create an asset / uniform' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateAssetDto) {
    return this.service.create(user, dto);
  }

  @Post(':id/assign')
  @RequirePermissions('asset.update.tenant')
  @ApiOperation({ summary: 'Assign an asset to an employee' })
  assign(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: AssignAssetDto) {
    return this.service.assign(user, id, dto);
  }

  @Post(':id/return')
  @RequirePermissions('asset.update.tenant')
  @ApiOperation({ summary: 'Return an asset (condition: good/damaged/lost)' })
  return(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ReturnAssetDto) {
    return this.service.return(user, id, dto);
  }
}
