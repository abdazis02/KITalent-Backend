import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { LeavesService } from './leaves.service';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { ReviewLeaveDto } from './dto/review-leave.dto';
import { QueryLeaveDto } from './dto/query-leave.dto';

@ApiTags('Leave')
@ApiBearerAuth()
@Controller('leaves')
export class LeavesController {
  constructor(private readonly service: LeavesService) {}

  @Get()
  @RequirePermissions('leave.read.tenant')
  @ApiOperation({ summary: 'List leave requests (filter by status / employee)' })
  list(@CurrentTenant() tenantId: string | null, @Query() query: QueryLeaveDto) {
    return this.service.list(tenantId, query);
  }

  @Post()
  @RequirePermissions('leave.create.own')
  @ApiOperation({ summary: 'Submit a leave request' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateLeaveRequestDto) {
    return this.service.create(user, dto);
  }

  @Post(':id/approve')
  @RequirePermissions('leave.approve.tenant')
  @ApiOperation({ summary: 'Approve a leave request' })
  approve(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.approve(user, id);
  }

  @Post(':id/reject')
  @RequirePermissions('leave.reject.tenant')
  @ApiOperation({ summary: 'Reject a leave request (reason required)' })
  reject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewLeaveDto,
  ) {
    return this.service.reject(user, id, dto);
  }
}
