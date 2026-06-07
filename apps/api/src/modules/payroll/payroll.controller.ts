import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PayrollService } from './payroll.service';
import { CreateComponentDto } from './dto/create-component.dto';
import { AssignItemDto, SetBasicSalaryDto } from './dto/assign-item.dto';
import { CreateRunDto } from './dto/create-run.dto';

@ApiTags('Payroll')
@ApiBearerAuth()
@Controller('payroll')
export class PayrollController {
  constructor(private readonly service: PayrollService) {}

  // ---- Components --------------------------------------------------------
  @Post('components')
  @RequirePermissions('payroll.create.tenant')
  @ApiOperation({ summary: 'Create a configurable payroll component' })
  createComponent(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateComponentDto) {
    return this.service.createComponent(user, dto);
  }

  @Get('components')
  @RequirePermissions('payroll.read.tenant')
  @ApiOperation({ summary: 'List payroll components' })
  listComponents(@CurrentTenant() tenantId: string | null) {
    return this.service.listComponents(tenantId);
  }

  // ---- Employee setup ----------------------------------------------------
  @Put('employees/:employeeId/salary')
  @RequirePermissions('payroll.update.tenant')
  @ApiOperation({ summary: 'Set an employee base salary' })
  setSalary(
    @CurrentUser() user: AuthenticatedUser,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Body() dto: SetBasicSalaryDto,
  ) {
    return this.service.setBasicSalary(user, employeeId, dto);
  }

  @Post('employees/:employeeId/items')
  @RequirePermissions('payroll.update.tenant')
  @ApiOperation({ summary: 'Assign a recurring payroll component to an employee' })
  assignItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Body() dto: AssignItemDto,
  ) {
    return this.service.assignItem(user, employeeId, dto);
  }

  // ---- Runs --------------------------------------------------------------
  @Post('runs')
  @RequirePermissions('payroll.process.tenant')
  @ApiOperation({ summary: 'Create/recalculate a payroll run for a period' })
  createRun(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateRunDto) {
    return this.service.createRun(user, dto);
  }

  @Get('runs')
  @RequirePermissions('payroll.read.tenant')
  @ApiOperation({ summary: 'List payroll runs' })
  listRuns(@CurrentTenant() tenantId: string | null, @Query() query: PaginationQueryDto) {
    return this.service.listRuns(tenantId, query);
  }

  @Get('runs/:id')
  @RequirePermissions('payroll.read.tenant')
  @ApiOperation({ summary: 'Get a payroll run' })
  getRun(@CurrentTenant() tenantId: string | null, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.getRun(tenantId, id);
  }

  @Post('runs/:id/submit')
  @RequirePermissions('payroll.process.tenant')
  @ApiOperation({ summary: 'Submit a calculated run into the tiered approval workflow' })
  submitRun(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.submitForApproval(user, id);
  }

  @Post('runs/:id/approve')
  @RequirePermissions('payroll.approve.tenant')
  @ApiOperation({ summary: 'Approve a payroll run (inline, when no workflow is active)' })
  approveRun(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.approveRun(user, id);
  }

  @Post('runs/:id/lock')
  @RequirePermissions('payroll.process.tenant')
  @ApiOperation({ summary: 'Lock an approved run (immutable thereafter)' })
  lockRun(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.lockRun(user, id);
  }

  @Get('runs/:id/payslips')
  @RequirePermissions('payroll.read.tenant')
  @ApiOperation({ summary: 'List payslips of a run' })
  listPayslips(@CurrentTenant() tenantId: string | null, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.listPayslips(tenantId, id);
  }

  @Get('payslips/:id')
  @RequirePermissions('payroll.read.tenant')
  @ApiOperation({ summary: 'Get a full salary slip with line items' })
  getPayslip(@CurrentTenant() tenantId: string | null, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.getPayslip(tenantId, id);
  }
}
