import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import configuration from './config/configuration';
import { CryptoModule } from './common/crypto/crypto.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { PreferencesModule } from './modules/preferences/preferences.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { ClientsModule } from './modules/clients/clients.module';
import { AttendancesModule } from './modules/attendances/attendances.module';
import { LeavesModule } from './modules/leaves/leaves.module';
import { PayrollModule } from './modules/payroll/payroll.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { ShiftsModule } from './modules/shifts/shifts.module';
import { OvertimesModule } from './modules/overtimes/overtimes.module';
import { ContractsModule } from './modules/contracts/contracts.module';
import { PlacementsModule } from './modules/placements/placements.module';
import { ReimbursementsModule } from './modules/reimbursements/reimbursements.module';
import { LoansModule } from './modules/loans/loans.module';
import { ReportsModule } from './modules/reports/reports.module';
import { RecruitmentModule } from './modules/recruitment/recruitment.module';
import { PerformanceModule } from './modules/performance/performance.module';
import { IncidentsModule } from './modules/incidents/incidents.module';
import { FilesModule } from './modules/files/files.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AssetsModule } from './modules/assets/assets.module';
import { TrainingsModule } from './modules/trainings/trainings.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { CompanyModule } from './modules/company/company.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { ServiceCatalogModule } from './modules/service-catalog/service-catalog.module';
import { ManpowerModule } from './modules/manpower/manpower.module';
import { FingerprintModule } from './modules/fingerprint/fingerprint.module';
import { ApprovalModule } from './modules/approval/approval.module';
import { EmployeeDetailsModule } from './modules/employee-details/employee-details.module';
import { PayrollConfigModule } from './modules/payroll-config/payroll-config.module';
import { RecruitmentExtendedModule } from './modules/recruitment-extended/recruitment-extended.module';
import { ClientExtendedModule } from './modules/client-extended/client-extended.module';
import { HrExtrasModule } from './modules/hr-extras/hr-extras.module';
import { PlatformModule } from './modules/platform/platform.module';
import { OpsExtrasModule } from './modules/ops-extras/ops-extras.module';
import { I18nDbModule } from './modules/i18n-db/i18n-db.module';
import { ReportsExtendedModule } from './modules/reports-extended/reports-extended.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { TenantGuard } from './common/guards/tenant.guard';
import { PermissionGuard } from './common/guards/permission.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    // Global rate limiting (PRD §22): default 120 req/min/IP; auth routes tighten further.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    CryptoModule,
    PrismaModule,
    AuditModule,
    AuthModule,
    HealthModule,
    PreferencesModule,
    EmployeesModule,
    ClientsModule,
    AttendancesModule,
    LeavesModule,
    PayrollModule,
    InvoicesModule,
    ShiftsModule,
    OvertimesModule,
    ContractsModule,
    PlacementsModule,
    ReimbursementsModule,
    LoansModule,
    ReportsModule,
    RecruitmentModule,
    PerformanceModule,
    IncidentsModule,
    FilesModule,
    NotificationsModule,
    DocumentsModule,
    AssetsModule,
    TrainingsModule,
    TenantsModule,
    CompanyModule,
    OrganizationModule,
    ServiceCatalogModule,
    ManpowerModule,
    FingerprintModule,
    ApprovalModule,
    EmployeeDetailsModule,
    PayrollConfigModule,
    RecruitmentExtendedModule,
    ClientExtendedModule,
    HrExtrasModule,
    PlatformModule,
    OpsExtrasModule,
    I18nDbModule,
    ReportsExtendedModule,
  ],
  providers: [
    // Rate limiter runs first, before auth (PRD §22).
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Global guard chain (PRD §0.8): authenticate → isolate tenant → enforce RBAC.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: TenantGuard },
    { provide: APP_GUARD, useClass: PermissionGuard },
  ],
})
export class AppModule {}
