import { Module } from '@nestjs/common';
import { Body, Controller, ForbiddenException, Get, Injectable, NotFoundException, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsEmail, IsIn, IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { FieldCryptoService } from '../../common/crypto/field-crypto.service';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';

// ---- DTOs ----
class ContactDto {
  @ApiPropertyOptional({ enum: ['personal', 'emergency', 'family'], default: 'personal' }) @IsOptional() @IsIn(['personal', 'emergency', 'family']) type?: string;
  @ApiProperty() @IsString() name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() relationship?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
}
class BankAccountDto {
  @ApiProperty() @IsString() bankName!: string;
  @ApiProperty() @IsString() accountNumber!: string;
  @ApiProperty() @IsString() accountHolderName!: string;
  @ApiPropertyOptional({ default: false }) @IsOptional() @IsBoolean() isPrimary?: boolean;
}
class EmployeeDocDto {
  @ApiProperty({ example: 'KTP' }) @IsString() documentType!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() fileKey?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() documentNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() issuedDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() expiredDate?: string;
}

/** Bank-account row with its account number decrypted for an authorized reader. */
type BankRow = { accountNumber: string } & Record<string, unknown>;

@Injectable()
class EmployeeDetailsService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService, private readonly crypto: FieldCryptoService) {}
  private tid(t: string | null): string { if (!t) throw new ForbiddenException('A tenant context is required'); return t; }
  /** Decrypt accountNumber (encrypted-at-rest, PRD §22) for return to authorized readers. */
  private decBank<T extends BankRow>(row: T): T { return { ...row, accountNumber: this.crypto.decrypt(row.accountNumber) ?? row.accountNumber }; }
  private async assertEmp(tenantId: string, employeeId: string) {
    const e = await this.prisma.employee.findFirst({ where: { id: employeeId, tenantId, deletedAt: null }, select: { id: true } });
    if (!e) throw new NotFoundException('Employee not found in this tenant');
  }

  // Contacts
  listContacts(tenantId: string | null, employeeId: string) { return this.prisma.employeeContact.findMany({ where: { tenantId: this.tid(tenantId), employeeId }, orderBy: { createdAt: 'asc' } }); }
  async addContact(user: AuthenticatedUser, employeeId: string, dto: ContactDto) {
    const t = this.tid(user.tenantId); await this.assertEmp(t, employeeId);
    const row = await this.prisma.employeeContact.create({ data: { tenantId: t, employeeId, type: (dto.type as never) ?? 'personal', name: dto.name, relationship: dto.relationship, phone: dto.phone, email: dto.email, address: dto.address } });
    await this.audit.record({ tenantId: t, actorId: user.id, action: 'employee.contact.add', entityType: 'EmployeeContact', entityId: row.id });
    return row;
  }
  // Bank accounts (accountNumber encrypted-at-rest — PRD §22)
  async listBanks(tenantId: string | null, employeeId: string) {
    const rows = await this.prisma.employeeBankAccount.findMany({ where: { tenantId: this.tid(tenantId), employeeId }, orderBy: { createdAt: 'asc' } });
    return rows.map((r) => this.decBank(r));
  }
  async addBank(user: AuthenticatedUser, employeeId: string, dto: BankAccountDto) {
    const t = this.tid(user.tenantId); await this.assertEmp(t, employeeId);
    if (dto.isPrimary) await this.prisma.employeeBankAccount.updateMany({ where: { employeeId, isPrimary: true }, data: { isPrimary: false } });
    const row = await this.prisma.employeeBankAccount.create({ data: { tenantId: t, employeeId, bankName: dto.bankName, accountNumber: this.crypto.encrypt(dto.accountNumber) ?? dto.accountNumber, accountHolderName: dto.accountHolderName, isPrimary: dto.isPrimary ?? false } });
    await this.audit.record({ tenantId: t, actorId: user.id, action: 'employee.bank.add', entityType: 'EmployeeBankAccount', entityId: row.id });
    return this.decBank(row);
  }
  // Documents
  listDocs(tenantId: string | null, employeeId: string) { return this.prisma.employeeDocument.findMany({ where: { tenantId: this.tid(tenantId), employeeId }, orderBy: { createdAt: 'desc' } }); }
  async addDoc(user: AuthenticatedUser, employeeId: string, dto: EmployeeDocDto) {
    const t = this.tid(user.tenantId); await this.assertEmp(t, employeeId);
    const row = await this.prisma.employeeDocument.create({ data: { tenantId: t, employeeId, documentType: dto.documentType, fileKey: dto.fileKey, documentNumber: dto.documentNumber, issuedDate: dto.issuedDate ? new Date(dto.issuedDate) : null, expiredDate: dto.expiredDate ? new Date(dto.expiredDate) : null } });
    await this.audit.record({ tenantId: t, actorId: user.id, action: 'employee.document.add', entityType: 'EmployeeDocument', entityId: row.id });
    return row;
  }
  // Position history
  history(tenantId: string | null, employeeId: string) { return this.prisma.employeePositionHistory.findMany({ where: { tenantId: this.tid(tenantId), employeeId }, orderBy: { effectiveDate: 'desc' } }); }
}

@ApiTags('Employee Details')
@ApiBearerAuth()
@Controller('employees/:id')
class EmployeeDetailsController {
  constructor(private readonly s: EmployeeDetailsService) {}
  @Get('contacts') @RequirePermissions('employee.read.tenant') @ApiOperation({ summary: 'List employee contacts' })
  contacts(@CurrentTenant() t: string | null, @Param('id', ParseUUIDPipe) id: string) { return this.s.listContacts(t, id); }
  @Post('contacts') @RequirePermissions('employee.update.tenant') @ApiOperation({ summary: 'Add a contact (personal/emergency/family)' })
  addContact(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ContactDto) { return this.s.addContact(u, id, dto); }
  @Get('bank-accounts') @RequirePermissions('employee.read.sensitive') @ApiOperation({ summary: 'List employee bank accounts (sensitive)' })
  banks(@CurrentTenant() t: string | null, @Param('id', ParseUUIDPipe) id: string) { return this.s.listBanks(t, id); }
  @Post('bank-accounts') @RequirePermissions('employee.update.tenant') @ApiOperation({ summary: 'Add a bank account' })
  addBank(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: BankAccountDto) { return this.s.addBank(u, id, dto); }
  @Get('documents') @RequirePermissions('employee.read.tenant') @ApiOperation({ summary: 'List employee documents' })
  docs(@CurrentTenant() t: string | null, @Param('id', ParseUUIDPipe) id: string) { return this.s.listDocs(t, id); }
  @Post('documents') @RequirePermissions('employee.update.tenant') @ApiOperation({ summary: 'Attach an employee document' })
  addDoc(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: EmployeeDocDto) { return this.s.addDoc(u, id, dto); }
  @Get('history') @RequirePermissions('employee.read.tenant') @ApiOperation({ summary: 'Employee position/department history' })
  history(@CurrentTenant() t: string | null, @Param('id', ParseUUIDPipe) id: string) { return this.s.history(t, id); }
}

@Module({ controllers: [EmployeeDetailsController], providers: [EmployeeDetailsService] })
export class EmployeeDetailsModule {}
