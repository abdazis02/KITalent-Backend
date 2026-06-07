import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('dashboard')
  @RequirePermissions('report.read.tenant')
  @ApiOperation({ summary: 'Aggregate dashboard: workforce, attendance, approvals, billing, payroll' })
  dashboard(@CurrentTenant() tenantId: string | null) {
    return this.service.dashboard(tenantId);
  }
}
