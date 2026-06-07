import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { OrganizationService } from './organization.service';
import { CreateDepartmentDto, CreateJobLevelDto, CreatePositionDto } from './dto/organization.dto';

@ApiTags('Organization')
@ApiBearerAuth()
@Controller()
export class OrganizationController {
  constructor(private readonly service: OrganizationService) {}

  @Get('departments')
  @RequirePermissions('organization.read.tenant')
  @ApiOperation({ summary: 'List departments' })
  listDepartments(@CurrentTenant() tenantId: string | null) {
    return this.service.listDepartments(tenantId);
  }

  @Post('departments')
  @RequirePermissions('organization.create.tenant')
  @ApiOperation({ summary: 'Create a department' })
  createDepartment(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateDepartmentDto) {
    return this.service.createDepartment(user, dto);
  }

  @Get('job-levels')
  @RequirePermissions('organization.read.tenant')
  @ApiOperation({ summary: 'List job levels' })
  listJobLevels(@CurrentTenant() tenantId: string | null) {
    return this.service.listJobLevels(tenantId);
  }

  @Post('job-levels')
  @RequirePermissions('organization.create.tenant')
  @ApiOperation({ summary: 'Create a job level' })
  createJobLevel(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateJobLevelDto) {
    return this.service.createJobLevel(user, dto);
  }

  @Get('positions')
  @RequirePermissions('organization.read.tenant')
  @ApiOperation({ summary: 'List positions' })
  listPositions(@CurrentTenant() tenantId: string | null) {
    return this.service.listPositions(tenantId);
  }

  @Post('positions')
  @RequirePermissions('organization.create.tenant')
  @ApiOperation({ summary: 'Create a position' })
  createPosition(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePositionDto) {
    return this.service.createPosition(user, dto);
  }
}
