import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { IncidentsService } from './incidents.service';
import { CreateIncidentDto, QueryIncidentDto, ResolveIncidentDto } from './dto/incident.dto';

@ApiTags('Incident')
@ApiBearerAuth()
@Controller('incidents')
export class IncidentsController {
  constructor(private readonly service: IncidentsService) {}

  @Get()
  @RequirePermissions('incident.read.tenant')
  @ApiOperation({ summary: 'List incidents (filter by status/severity/employee)' })
  list(@CurrentTenant() tenantId: string | null, @Query() query: QueryIncidentDto) {
    return this.service.list(tenantId, query);
  }

  @Get(':id')
  @RequirePermissions('incident.read.tenant')
  @ApiOperation({ summary: 'Get an incident' })
  findOne(@CurrentTenant() tenantId: string | null, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(tenantId, id);
  }

  @Post()
  @RequirePermissions('incident.create.tenant')
  @ApiOperation({ summary: 'Report an incident' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateIncidentDto) {
    return this.service.create(user, dto);
  }

  @Post(':id/investigate')
  @RequirePermissions('incident.update.tenant')
  @ApiOperation({ summary: 'Start investigating an incident' })
  investigate(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.investigate(user, id);
  }

  @Post(':id/resolve')
  @RequirePermissions('incident.update.tenant')
  @ApiOperation({ summary: 'Resolve an incident with optional sanction' })
  resolve(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ResolveIncidentDto) {
    return this.service.resolve(user, id, dto);
  }

  @Post(':id/dismiss')
  @RequirePermissions('incident.update.tenant')
  @ApiOperation({ summary: 'Dismiss an incident' })
  dismiss(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.dismiss(user, id);
  }
}
