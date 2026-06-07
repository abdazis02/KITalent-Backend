import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { OvertimesService } from './overtimes.service';
import { CreateOvertimeDto } from './dto/create-overtime.dto';
import { QueryOvertimeDto, RejectOvertimeDto } from './dto/query-overtime.dto';

@ApiTags('Overtime')
@ApiBearerAuth()
@Controller('overtimes')
export class OvertimesController {
  constructor(private readonly service: OvertimesService) {}

  @Get()
  @RequirePermissions('overtime.read.tenant')
  @ApiOperation({ summary: 'List overtime requests' })
  list(@CurrentTenant() tenantId: string | null, @Query() query: QueryOvertimeDto) {
    return this.service.list(tenantId, query);
  }

  @Post()
  @RequirePermissions('overtime.create.own')
  @ApiOperation({ summary: 'Submit an overtime request' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateOvertimeDto) {
    return this.service.create(user, dto);
  }

  @Post(':id/approve')
  @RequirePermissions('overtime.approve.tenant')
  @ApiOperation({ summary: 'Approve an overtime request' })
  approve(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.approve(user, id);
  }

  @Post(':id/reject')
  @RequirePermissions('overtime.reject.tenant')
  @ApiOperation({ summary: 'Reject an overtime request (reason required)' })
  reject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectOvertimeDto,
  ) {
    return this.service.reject(user, id, dto);
  }
}
