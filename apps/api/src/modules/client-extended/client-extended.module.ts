import { Module } from '@nestjs/common';
import { Body, Controller, ForbiddenException, Get, Injectable, NotFoundException, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';

class ContactDto { @ApiProperty() @IsString() name!: string; @ApiPropertyOptional() @IsOptional() @IsString() position?: string; @ApiPropertyOptional() @IsOptional() @IsString() email?: string; @ApiPropertyOptional() @IsOptional() @IsString() phone?: string; @ApiPropertyOptional({ example: 'hr' }) @IsOptional() @IsString() type?: string; }
class ContractDto { @ApiProperty() @IsString() contractNumber!: string; @ApiProperty() @IsString() title!: string; @ApiProperty() @IsDateString() startDate!: string; @ApiProperty() @IsDateString() endDate!: string; @ApiPropertyOptional() @IsOptional() @IsString() billingType?: string; }
class ServicePositionDto { @ApiProperty() @IsUUID() serviceCategoryId!: string; @ApiProperty() @IsString() code!: string; @ApiProperty() @IsString() name!: string; @ApiPropertyOptional() @IsOptional() @IsString() minimumEducation?: string; @ApiPropertyOptional() @IsOptional() @IsString() minimumExperience?: string; }
class RateCardDto { @ApiProperty() @IsUUID() clientId!: string; @ApiProperty() @IsUUID() servicePositionId!: string; @ApiProperty() @IsInt() @Min(0) baseSalary!: number; @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) allowance?: number; @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) managementFee?: number; @ApiProperty() @IsInt() @Min(0) billingRate!: number; @ApiProperty() @IsDateString() effectiveStart!: string; }
class MrItemDto { @ApiPropertyOptional() @IsOptional() @IsUUID() servicePositionId?: string; @ApiProperty({ default: 1 }) @IsInt() @Min(1) quantity!: number; @ApiPropertyOptional() @IsOptional() @IsString() qualification?: string; @ApiPropertyOptional() @IsOptional() @IsDateString() startDate?: string; }

@Injectable()
class ClientExtService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}
  private tid(t: string | null): string { if (!t) throw new ForbiddenException('A tenant context is required'); return t; }
  private async assertClient(t: string, id: string) { const c = await this.prisma.client.findFirst({ where: { id, tenantId: t, deletedAt: null }, select: { id: true } }); if (!c) throw new NotFoundException('Client not found'); }

  listContacts(t: string | null, clientId: string) { return this.prisma.clientContact.findMany({ where: { tenantId: this.tid(t), clientId }, orderBy: { createdAt: 'asc' } }); }
  async addContact(u: AuthenticatedUser, clientId: string, dto: ContactDto) { const t = this.tid(u.tenantId); await this.assertClient(t, clientId); const r = await this.prisma.clientContact.create({ data: { tenantId: t, clientId, ...dto } }); await this.audit.record({ tenantId: t, actorId: u.id, action: 'client.contact.add', entityType: 'ClientContact', entityId: r.id }); return r; }

  listContracts(t: string | null, clientId: string) { return this.prisma.clientContract.findMany({ where: { tenantId: this.tid(t), clientId }, orderBy: { startDate: 'desc' } }); }
  async addContract(u: AuthenticatedUser, clientId: string, dto: ContractDto) { const t = this.tid(u.tenantId); await this.assertClient(t, clientId); const r = await this.prisma.clientContract.create({ data: { tenantId: t, clientId, contractNumber: dto.contractNumber, title: dto.title, startDate: new Date(dto.startDate), endDate: new Date(dto.endDate), billingType: dto.billingType } }); await this.audit.record({ tenantId: t, actorId: u.id, action: 'client.contract.add', entityType: 'ClientContract', entityId: r.id }); return r; }

  listServicePositions(t: string | null) { return this.prisma.servicePosition.findMany({ where: { tenantId: this.tid(t) }, orderBy: { code: 'asc' }, take: 500 }); }
  async addServicePosition(u: AuthenticatedUser, dto: ServicePositionDto) { const t = this.tid(u.tenantId); const cat = await this.prisma.serviceCategory.findFirst({ where: { id: dto.serviceCategoryId, tenantId: t, deletedAt: null }, select: { id: true } }); if (!cat) throw new NotFoundException('Service category not found'); const r = await this.prisma.servicePosition.create({ data: { tenantId: t, ...dto } }); await this.audit.record({ tenantId: t, actorId: u.id, action: 'service.position.create', entityType: 'ServicePosition', entityId: r.id }); return r; }

  listRateCards(t: string | null) { return this.prisma.clientRateCard.findMany({ where: { tenantId: this.tid(t) }, orderBy: { createdAt: 'desc' }, take: 500 }); }
  async addRateCard(u: AuthenticatedUser, dto: RateCardDto) { const t = this.tid(u.tenantId); await this.assertClient(t, dto.clientId); const r = await this.prisma.clientRateCard.create({ data: { tenantId: t, clientId: dto.clientId, servicePositionId: dto.servicePositionId, baseSalary: dto.baseSalary, allowance: dto.allowance ?? 0, managementFee: dto.managementFee ?? 0, billingRate: dto.billingRate, effectiveStart: new Date(dto.effectiveStart) } }); await this.audit.record({ tenantId: t, actorId: u.id, action: 'client.ratecard.create', entityType: 'ClientRateCard', entityId: r.id }); return r; }

  listMrItems(t: string | null, mrId: string) { return this.prisma.manpowerRequestItem.findMany({ where: { tenantId: this.tid(t), manpowerRequestId: mrId }, orderBy: { createdAt: 'asc' } }); }
  async addMrItem(u: AuthenticatedUser, mrId: string, dto: MrItemDto) { const t = this.tid(u.tenantId); const mr = await this.prisma.manpowerRequest.findFirst({ where: { id: mrId, tenantId: t, deletedAt: null }, select: { id: true } }); if (!mr) throw new NotFoundException('Manpower request not found'); const r = await this.prisma.manpowerRequestItem.create({ data: { tenantId: t, manpowerRequestId: mrId, servicePositionId: dto.servicePositionId, quantity: dto.quantity, qualification: dto.qualification, startDate: dto.startDate ? new Date(dto.startDate) : null } }); await this.audit.record({ tenantId: t, actorId: u.id, action: 'manpowerRequest.item.add', entityType: 'ManpowerRequestItem', entityId: r.id }); return r; }
}

@ApiTags('Client (Full)')
@ApiBearerAuth()
@Controller()
class ClientExtController {
  constructor(private readonly s: ClientExtService) {}
  @Get('clients/:id/contacts') @RequirePermissions('client.read.tenant') @ApiOperation({ summary: 'List client contacts' }) contacts(@CurrentTenant() t: string | null, @Param('id', ParseUUIDPipe) id: string) { return this.s.listContacts(t, id); }
  @Post('clients/:id/contacts') @RequirePermissions('client.update.tenant') @ApiOperation({ summary: 'Add a client contact' }) addContact(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ContactDto) { return this.s.addContact(u, id, dto); }
  @Get('clients/:id/contracts') @RequirePermissions('client.read.tenant') @ApiOperation({ summary: 'List client contracts' }) contracts(@CurrentTenant() t: string | null, @Param('id', ParseUUIDPipe) id: string) { return this.s.listContracts(t, id); }
  @Post('clients/:id/contracts') @RequirePermissions('client.update.tenant') @ApiOperation({ summary: 'Add a client contract' }) addContract(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ContractDto) { return this.s.addContract(u, id, dto); }
  @Get('service-positions') @RequirePermissions('service.read.tenant') @ApiOperation({ summary: 'List service positions' }) servicePositions(@CurrentTenant() t: string | null) { return this.s.listServicePositions(t); }
  @Post('service-positions') @RequirePermissions('service.create.tenant') @ApiOperation({ summary: 'Create a service position' }) addServicePosition(@CurrentUser() u: AuthenticatedUser, @Body() dto: ServicePositionDto) { return this.s.addServicePosition(u, dto); }
  @Get('client-rate-cards') @RequirePermissions('client.read.tenant') @ApiOperation({ summary: 'List client rate cards' }) rateCards(@CurrentTenant() t: string | null) { return this.s.listRateCards(t); }
  @Post('client-rate-cards') @RequirePermissions('client.update.tenant') @ApiOperation({ summary: 'Create a client rate card' }) addRateCard(@CurrentUser() u: AuthenticatedUser, @Body() dto: RateCardDto) { return this.s.addRateCard(u, dto); }
  @Get('manpower-requests/:id/items') @RequirePermissions('manpowerRequest.read.tenant') @ApiOperation({ summary: 'List manpower request items' }) mrItems(@CurrentTenant() t: string | null, @Param('id', ParseUUIDPipe) id: string) { return this.s.listMrItems(t, id); }
  @Post('manpower-requests/:id/items') @RequirePermissions('manpowerRequest.update.tenant') @ApiOperation({ summary: 'Add a manpower request item' }) addMrItem(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: MrItemDto) { return this.s.addMrItem(u, id, dto); }
}

@Module({ controllers: [ClientExtController], providers: [ClientExtService] })
export class ClientExtendedModule {}
