import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { GenerateFromPayrollDto } from './dto/generate-from-payroll.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';

@ApiTags('Invoices')
@ApiBearerAuth()
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly service: InvoicesService) {}

  @Get()
  @RequirePermissions('invoice.read.tenant')
  @ApiOperation({ summary: 'List invoices' })
  list(@CurrentTenant() tenantId: string | null, @Query() query: PaginationQueryDto) {
    return this.service.list(tenantId, query);
  }

  @Get(':id')
  @RequirePermissions('invoice.read.tenant')
  @ApiOperation({ summary: 'Get an invoice with items and payments' })
  findOne(@CurrentTenant() tenantId: string | null, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(tenantId, id);
  }

  @Post()
  @RequirePermissions('invoice.create.tenant')
  @ApiOperation({ summary: 'Create an invoice with explicit line items' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateInvoiceDto) {
    return this.service.create(user, dto);
  }

  @Post('generate-from-payroll')
  @RequirePermissions('invoice.generate.tenant')
  @ApiOperation({ summary: 'Generate a client invoice from a payroll run + management fee' })
  generate(@CurrentUser() user: AuthenticatedUser, @Body() dto: GenerateFromPayrollDto) {
    return this.service.generateFromPayroll(user, dto);
  }

  @Post(':id/submit')
  @RequirePermissions('invoice.update.tenant')
  @ApiOperation({ summary: 'Submit a draft invoice into the tiered approval workflow' })
  submit(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.submitForApproval(user, id);
  }

  @Post(':id/approve')
  @RequirePermissions('invoice.approve.tenant')
  @ApiOperation({ summary: 'Approve an invoice (inline, when no workflow is active)' })
  approve(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.approve(user, id);
  }

  @Post(':id/send')
  @RequirePermissions('invoice.update.tenant')
  @ApiOperation({ summary: 'Mark an approved invoice as sent' })
  send(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.send(user, id);
  }

  @Post(':id/payments')
  @RequirePermissions('invoice.update.tenant')
  @ApiOperation({ summary: 'Record a payment against an invoice' })
  pay(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordPaymentDto,
  ) {
    return this.service.recordPayment(user, id, dto);
  }
}
