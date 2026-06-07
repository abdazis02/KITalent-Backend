import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { AttendancesService } from './attendances.service';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { QueryAttendanceDto } from './dto/query-attendance.dto';
import { RequestCorrectionDto } from './dto/correction.dto';

@ApiTags('Attendance')
@ApiBearerAuth()
@Controller('attendances')
export class AttendancesController {
  constructor(private readonly service: AttendancesService) {}

  @Post('check-in')
  @RequirePermissions('attendance.create.own')
  @ApiOperation({ summary: 'Record a check-in (GPS + selfie)' })
  checkIn(@CurrentUser() user: AuthenticatedUser, @Body() dto: CheckInDto, @Req() req: Request) {
    return this.service.checkIn(user, dto, req.ip);
  }

  @Post('check-out')
  @RequirePermissions('attendance.create.own')
  @ApiOperation({ summary: 'Record a check-out' })
  checkOut(@CurrentUser() user: AuthenticatedUser, @Body() dto: CheckOutDto) {
    return this.service.checkOut(user, dto);
  }

  @Get()
  @RequirePermissions('attendance.read.tenant')
  @ApiOperation({ summary: 'List attendance records (filter by employee / date range)' })
  list(@CurrentTenant() tenantId: string | null, @Query() query: QueryAttendanceDto) {
    return this.service.list(tenantId, query);
  }

  @Post(':id/correction')
  @RequirePermissions('attendance.update.own')
  @ApiOperation({ summary: 'Request a correction of an attendance record' })
  requestCorrection(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: RequestCorrectionDto) {
    return this.service.requestCorrection(user, id, dto);
  }

  @Post(':id/correction/approve')
  @RequirePermissions('attendance.approve.tenant')
  @ApiOperation({ summary: 'Approve a correction (applies proposed times)' })
  approveCorrection(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.approveCorrection(user, id);
  }

  @Post(':id/correction/reject')
  @RequirePermissions('attendance.approve.tenant')
  @ApiOperation({ summary: 'Reject a correction' })
  rejectCorrection(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.rejectCorrection(user, id);
  }
}
