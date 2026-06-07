import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Query, Res, StreamableFile } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { QueryContractDto } from './dto/query-contract.dto';
import { RenewContractDto } from './dto/renew-contract.dto';

@ApiTags('Contracts')
@ApiBearerAuth()
@Controller('contracts')
export class ContractsController {
  constructor(private readonly service: ContractsService) {}

  @Get()
  @RequirePermissions('contract.read.tenant')
  @ApiOperation({ summary: 'List contracts (filter by status/type/expiry)' })
  list(@CurrentTenant() tenantId: string | null, @Query() query: QueryContractDto) {
    return this.service.list(tenantId, query);
  }

  @Get(':id')
  @RequirePermissions('contract.read.tenant')
  @ApiOperation({ summary: 'Get a contract' })
  findOne(@CurrentTenant() tenantId: string | null, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(tenantId, id);
  }

  @Post()
  @RequirePermissions('contract.create.tenant')
  @ApiOperation({ summary: 'Create a contract (employee or client)' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateContractDto) {
    return this.service.create(user, dto);
  }

  @Get(':id/generate-pdf')
  @RequirePermissions('contract.read.tenant')
  @ApiOperation({ summary: 'Download the contract as a PDF' })
  async pdf(@CurrentTenant() tenantId: string | null, @Param('id', ParseUUIDPipe) id: string, @Res({ passthrough: true }) res: Response): Promise<StreamableFile> {
    const { buffer, filename } = await this.service.renderPdf(tenantId, id);
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${filename}"` });
    return new StreamableFile(buffer);
  }

  @Post(':id/submit')
  @RequirePermissions('contract.update.tenant')
  @ApiOperation({ summary: 'Submit a draft contract into the tiered approval workflow' })
  submit(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.submitForApproval(user, id);
  }

  @Post(':id/approve')
  @RequirePermissions('contract.approve.tenant')
  @ApiOperation({ summary: 'Approve a contract (inline, when no workflow is active)' })
  approve(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.approve(user, id);
  }

  @Post(':id/send-signature')
  @RequirePermissions('contract.update.tenant')
  @ApiOperation({ summary: 'Send an approved contract out for signature' })
  sendSignature(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.sendForSignature(user, id);
  }

  @Post(':id/mark-signed')
  @RequirePermissions('contract.update.tenant')
  @ApiOperation({ summary: 'Mark a contract signed → active' })
  sign(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.sign(user, id);
  }

  @Post(':id/renew')
  @RequirePermissions('contract.create.tenant')
  @ApiOperation({ summary: 'Renew a contract into a new draft period' })
  renew(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: RenewContractDto) {
    return this.service.renew(user, id, dto);
  }

  @Post(':id/terminate')
  @RequirePermissions('contract.update.tenant')
  @ApiOperation({ summary: 'Terminate an active contract' })
  terminate(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.terminate(user, id);
  }

  @Delete(':id')
  @RequirePermissions('contract.delete.tenant')
  @ApiOperation({ summary: 'Soft-delete a contract' })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(user, id);
  }
}
