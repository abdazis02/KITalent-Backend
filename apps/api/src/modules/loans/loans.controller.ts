import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { LoansService } from './loans.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { QueryLoanDto, RejectLoanDto } from './dto/query-loan.dto';

@ApiTags('Loan')
@ApiBearerAuth()
@Controller('loans')
export class LoansController {
  constructor(private readonly service: LoansService) {}

  @Get()
  @RequirePermissions('loan.read.tenant')
  @ApiOperation({ summary: 'List loans / cash advances' })
  list(@CurrentTenant() tenantId: string | null, @Query() query: QueryLoanDto) {
    return this.service.list(tenantId, query);
  }

  @Post()
  @RequirePermissions('loan.create.own')
  @ApiOperation({ summary: 'Request a loan / cash advance' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateLoanDto) {
    return this.service.create(user, dto);
  }

  @Post(':id/approve')
  @RequirePermissions('loan.approve.tenant')
  @ApiOperation({ summary: 'Approve a loan → active (installments deduct in payroll)' })
  approve(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.approve(user, id);
  }

  @Post(':id/reject')
  @RequirePermissions('loan.reject.tenant')
  @ApiOperation({ summary: 'Reject a loan request (reason required)' })
  reject(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: RejectLoanDto) {
    return this.service.reject(user, id, dto);
  }
}
