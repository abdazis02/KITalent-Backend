import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { PlacementsService } from './placements.service';
import { CreatePlacementDto } from './dto/create-placement.dto';
import { QueryPlacementDto } from './dto/query-placement.dto';

@ApiTags('Placements')
@ApiBearerAuth()
@Controller('placements')
export class PlacementsController {
  constructor(private readonly service: PlacementsService) {}

  @Get()
  @RequirePermissions('placement.read.tenant')
  @ApiOperation({ summary: 'List placements (filter by status/employee/client)' })
  list(@CurrentTenant() tenantId: string | null, @Query() query: QueryPlacementDto) {
    return this.service.list(tenantId, query);
  }

  @Get(':id')
  @RequirePermissions('placement.read.tenant')
  @ApiOperation({ summary: 'Get a placement' })
  findOne(@CurrentTenant() tenantId: string | null, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(tenantId, id);
  }

  @Post()
  @RequirePermissions('placement.create.tenant')
  @ApiOperation({ summary: 'Create a placement (employee → client/site)' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePlacementDto) {
    return this.service.create(user, dto);
  }

  @Post(':id/submit')
  @RequirePermissions('placement.update.tenant')
  @ApiOperation({ summary: 'Submit a draft placement into the tiered approval workflow' })
  submit(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.submitForApproval(user, id);
  }

  @Post(':id/activate')
  @RequirePermissions('placement.approve.tenant')
  @ApiOperation({ summary: 'Activate a placement (inline, when no workflow is active)' })
  activate(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.activate(user, id);
  }

  @Post(':id/complete')
  @RequirePermissions('placement.update.tenant')
  @ApiOperation({ summary: 'Complete a placement' })
  complete(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.complete(user, id);
  }

  @Post(':id/request-replacement')
  @RequirePermissions('placement.update.tenant')
  @ApiOperation({ summary: 'Request replacement for a placement' })
  requestReplacement(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.requestReplacement(user, id);
  }

  @Delete(':id')
  @RequirePermissions('placement.delete.tenant')
  @ApiOperation({ summary: 'Soft-delete a placement' })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(user, id);
  }
}
