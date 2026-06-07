import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ApprovalService } from './approval.service';
import { ActDto, CreateWorkflowDto, StartInstanceDto } from './dto/approval.dto';

@ApiTags('Approval Workflow')
@ApiBearerAuth()
@Controller('approvals')
export class ApprovalController {
  constructor(private readonly service: ApprovalService) {}

  @Get('workflows')
  @RequirePermissions('approval.read.tenant')
  @ApiQuery({ name: 'module', required: false })
  @ApiOperation({ summary: 'List approval workflows (with step templates)' })
  listWorkflows(@CurrentTenant() tenantId: string | null, @Query('module') module?: string) {
    return this.service.listWorkflows(tenantId, module);
  }

  @Post('workflows')
  @RequirePermissions('approval.create.tenant')
  @ApiOperation({ summary: 'Create a hierarchical multi-step approval workflow' })
  createWorkflow(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateWorkflowDto) {
    return this.service.createWorkflow(user, dto);
  }

  @Get('inbox')
  @RequirePermissions('approval.read.own')
  @ApiOperation({ summary: 'My approval inbox — instances pending my action' })
  inbox(@CurrentUser() user: AuthenticatedUser) {
    return this.service.myPending(user);
  }

  @Post('instances')
  @RequirePermissions('approval.create.tenant')
  @ApiOperation({ summary: 'Start an approval instance for a record' })
  start(@CurrentUser() user: AuthenticatedUser, @Body() dto: StartInstanceDto) {
    return this.service.start(user, dto);
  }

  @Get('instances/:id')
  @RequirePermissions('approval.read.tenant')
  @ApiOperation({ summary: 'Get an approval instance with resolved steps' })
  getInstance(@CurrentTenant() tenantId: string | null, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.getInstance(tenantId, id);
  }

  @Post('instances/:id/act')
  @RequirePermissions('approval.approve.tenant')
  @ApiOperation({ summary: 'Approve/reject the current step (authorized by resolved approver/role)' })
  act(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ActDto) {
    return this.service.act(user, id, dto);
  }
}
