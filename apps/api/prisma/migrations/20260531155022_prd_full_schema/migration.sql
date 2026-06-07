-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('permanent', 'contract', 'outsourcing', 'daily', 'internship');

-- CreateEnum
CREATE TYPE "EmployeeContactType" AS ENUM ('personal', 'emergency', 'family');

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "address" TEXT,
ADD COLUMN     "birthDate" DATE,
ADD COLUMN     "birthPlace" TEXT,
ADD COLUMN     "employmentType" "EmploymentType",
ADD COLUMN     "endDate" DATE,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "joinDate" DATE,
ADD COLUMN     "maritalStatus" TEXT,
ADD COLUMN     "nationality" TEXT,
ADD COLUMN     "payrollGroupId" UUID,
ADD COLUMN     "photoFileId" UUID,
ADD COLUMN     "preferredName" TEXT,
ADD COLUMN     "religion" TEXT,
ADD COLUMN     "resignDate" DATE;

-- CreateTable
CREATE TABLE "employee_contacts" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "type" "EmployeeContactType" NOT NULL DEFAULT 'personal',
    "name" TEXT NOT NULL,
    "relationship" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_bank_accounts" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountHolderName" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_documents" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "documentType" TEXT NOT NULL,
    "fileKey" TEXT,
    "documentNumber" TEXT,
    "issuedDate" DATE,
    "expiredDate" DATE,
    "status" TEXT NOT NULL DEFAULT 'valid',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_position_histories" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "oldPositionId" UUID,
    "newPositionId" UUID,
    "oldDepartmentId" UUID,
    "newDepartmentId" UUID,
    "effectiveDate" DATE NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_position_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_groups" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "companyId" UUID,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "paymentSchedule" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "payroll_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_periods" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "payrollGroupId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "paymentDate" DATE,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salary_slips" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "payslipId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "fileKey" TEXT,
    "publishedAt" TIMESTAMP(3),
    "downloadedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salary_slips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_installments" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "loanId" UUID NOT NULL,
    "payrollPeriodId" UUID,
    "installmentNumber" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loan_installments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reimbursement_types" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "maxAmount" INTEGER,
    "requiresReceipt" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reimbursement_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_schedules" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "scheduleType" TEXT NOT NULL DEFAULT 'fixed',
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_schedules" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "shiftId" UUID NOT NULL,
    "workLocationId" UUID,
    "scheduleDate" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_policies" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "requireGps" BOOLEAN NOT NULL DEFAULT true,
    "requireSelfie" BOOLEAN NOT NULL DEFAULT true,
    "allowOutsideGeofence" BOOLEAN NOT NULL DEFAULT false,
    "allowAttendanceCorrection" BOOLEAN NOT NULL DEFAULT true,
    "allowOfflineAttendance" BOOLEAN NOT NULL DEFAULT false,
    "lateToleranceMinutes" INTEGER NOT NULL DEFAULT 0,
    "earlyCheckoutToleranceMinutes" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "biometric_logs" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "deviceId" UUID NOT NULL,
    "employeeId" UUID,
    "biometricUserId" TEXT NOT NULL,
    "logTime" TIMESTAMP(3) NOT NULL,
    "logType" TEXT,
    "rawPayload" JSONB NOT NULL DEFAULT '{}',
    "syncStatus" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "biometric_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_balances" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "leaveTypeId" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "openingBalance" INTEGER NOT NULL DEFAULT 0,
    "earned" INTEGER NOT NULL DEFAULT 0,
    "used" INTEGER NOT NULL DEFAULT 0,
    "remaining" INTEGER NOT NULL DEFAULT 0,
    "expired" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permission_requests" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "permissionDate" DATE NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "reason" TEXT NOT NULL,
    "attachmentKey" TEXT,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "approvedBy" UUID,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permission_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_contacts" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "position" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "type" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_contracts" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "contractNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "billingType" TEXT,
    "serviceFeeType" TEXT,
    "fileKey" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_positions" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "serviceCategoryId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "minimumEducation" TEXT,
    "minimumExperience" TEXT,
    "requiredCertification" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_rate_cards" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "servicePositionId" UUID NOT NULL,
    "baseSalary" INTEGER NOT NULL DEFAULT 0,
    "allowance" INTEGER NOT NULL DEFAULT 0,
    "managementFee" INTEGER NOT NULL DEFAULT 0,
    "billingRate" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "effectiveStart" DATE NOT NULL,
    "effectiveEnd" DATE,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_rate_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manpower_request_items" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "manpowerRequestId" UUID NOT NULL,
    "servicePositionId" UUID,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "workLocationId" UUID,
    "shiftId" UUID,
    "startDate" DATE,
    "endDate" DATE,
    "qualification" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manpower_request_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_requisitions" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "manpowerRequestId" UUID,
    "companyId" UUID,
    "clientId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_requisitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_applications" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "candidateId" UUID NOT NULL,
    "vacancyId" UUID NOT NULL,
    "pipelineStatus" TEXT NOT NULL DEFAULT 'applied',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentStage" TEXT NOT NULL DEFAULT 'applied',
    "score" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidate_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_documents" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "candidateId" UUID NOT NULL,
    "documentType" TEXT NOT NULL,
    "fileKey" TEXT,
    "status" TEXT NOT NULL DEFAULT 'valid',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidate_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_schedules" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "candidateApplicationId" UUID NOT NULL,
    "interviewerId" UUID,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "meetingLink" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interview_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_results" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "interviewScheduleId" UUID NOT NULL,
    "score" INTEGER,
    "result" TEXT NOT NULL DEFAULT 'consideration',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interview_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_offers" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "candidateApplicationId" UUID NOT NULL,
    "offeredSalary" INTEGER,
    "startDate" DATE,
    "fileKey" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidate_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding_tasks" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "employeeId" UUID,
    "candidateId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" DATE,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onboarding_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "placement_histories" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "placementId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "oldClientId" UUID,
    "newClientId" UUID,
    "oldLocationId" UUID,
    "newLocationId" UUID,
    "effectiveDate" DATE NOT NULL,
    "type" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "placement_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "replacement_requests" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "placementId" UUID NOT NULL,
    "requestedBy" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "requestedDate" DATE NOT NULL,
    "targetReplacementDate" DATE,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "replacement_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "priceMonthly" INTEGER NOT NULL DEFAULT 0,
    "priceYearly" INTEGER NOT NULL DEFAULT 0,
    "employeeLimit" INTEGER NOT NULL DEFAULT 0,
    "storageLimitMb" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_features" (
    "id" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "featureCode" TEXT NOT NULL,
    "featureName" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "limitValue" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_subscriptions" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "trialEndDate" DATE,
    "billingCycle" TEXT NOT NULL DEFAULT 'monthly',
    "employeeLimit" INTEGER NOT NULL DEFAULT 0,
    "storageLimitMb" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'trial',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_histories" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tenantId" UUID,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceId" TEXT,
    "status" TEXT NOT NULL,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_templates" (
    "id" UUID NOT NULL,
    "tenantId" UUID,
    "code" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "translation_keys" (
    "id" UUID NOT NULL,
    "namespace" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "translation_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "translations" (
    "id" UUID NOT NULL,
    "translationKeyId" UUID NOT NULL,
    "tenantId" UUID,
    "locale" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "translations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "employee_contacts_employeeId_idx" ON "employee_contacts"("employeeId");

-- CreateIndex
CREATE INDEX "employee_bank_accounts_employeeId_idx" ON "employee_bank_accounts"("employeeId");

-- CreateIndex
CREATE INDEX "employee_documents_employeeId_idx" ON "employee_documents"("employeeId");

-- CreateIndex
CREATE INDEX "employee_documents_expiredDate_idx" ON "employee_documents"("expiredDate");

-- CreateIndex
CREATE INDEX "employee_position_histories_employeeId_idx" ON "employee_position_histories"("employeeId");

-- CreateIndex
CREATE INDEX "payroll_groups_tenantId_idx" ON "payroll_groups"("tenantId");

-- CreateIndex
CREATE INDEX "payroll_periods_tenantId_status_idx" ON "payroll_periods"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "salary_slips_payslipId_key" ON "salary_slips"("payslipId");

-- CreateIndex
CREATE INDEX "salary_slips_tenantId_status_idx" ON "salary_slips"("tenantId", "status");

-- CreateIndex
CREATE INDEX "salary_slips_employeeId_idx" ON "salary_slips"("employeeId");

-- CreateIndex
CREATE INDEX "loan_installments_loanId_idx" ON "loan_installments"("loanId");

-- CreateIndex
CREATE UNIQUE INDEX "reimbursement_types_tenantId_code_key" ON "reimbursement_types"("tenantId", "code");

-- CreateIndex
CREATE INDEX "work_schedules_tenantId_idx" ON "work_schedules"("tenantId");

-- CreateIndex
CREATE INDEX "employee_schedules_tenantId_scheduleDate_idx" ON "employee_schedules"("tenantId", "scheduleDate");

-- CreateIndex
CREATE UNIQUE INDEX "employee_schedules_employeeId_scheduleDate_key" ON "employee_schedules"("employeeId", "scheduleDate");

-- CreateIndex
CREATE INDEX "attendance_policies_tenantId_idx" ON "attendance_policies"("tenantId");

-- CreateIndex
CREATE INDEX "biometric_logs_tenantId_logTime_idx" ON "biometric_logs"("tenantId", "logTime");

-- CreateIndex
CREATE INDEX "biometric_logs_deviceId_idx" ON "biometric_logs"("deviceId");

-- CreateIndex
CREATE INDEX "leave_balances_tenantId_idx" ON "leave_balances"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "leave_balances_employeeId_leaveTypeId_year_key" ON "leave_balances"("employeeId", "leaveTypeId", "year");

-- CreateIndex
CREATE INDEX "permission_requests_tenantId_status_idx" ON "permission_requests"("tenantId", "status");

-- CreateIndex
CREATE INDEX "permission_requests_employeeId_idx" ON "permission_requests"("employeeId");

-- CreateIndex
CREATE INDEX "client_contacts_clientId_idx" ON "client_contacts"("clientId");

-- CreateIndex
CREATE INDEX "client_contracts_clientId_idx" ON "client_contracts"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "client_contracts_tenantId_contractNumber_key" ON "client_contracts"("tenantId", "contractNumber");

-- CreateIndex
CREATE INDEX "service_positions_serviceCategoryId_idx" ON "service_positions"("serviceCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "service_positions_tenantId_code_key" ON "service_positions"("tenantId", "code");

-- CreateIndex
CREATE INDEX "client_rate_cards_clientId_idx" ON "client_rate_cards"("clientId");

-- CreateIndex
CREATE INDEX "manpower_request_items_manpowerRequestId_idx" ON "manpower_request_items"("manpowerRequestId");

-- CreateIndex
CREATE INDEX "job_requisitions_tenantId_status_idx" ON "job_requisitions"("tenantId", "status");

-- CreateIndex
CREATE INDEX "candidate_applications_tenantId_pipelineStatus_idx" ON "candidate_applications"("tenantId", "pipelineStatus");

-- CreateIndex
CREATE UNIQUE INDEX "candidate_applications_candidateId_vacancyId_key" ON "candidate_applications"("candidateId", "vacancyId");

-- CreateIndex
CREATE INDEX "candidate_documents_candidateId_idx" ON "candidate_documents"("candidateId");

-- CreateIndex
CREATE INDEX "interview_schedules_candidateApplicationId_idx" ON "interview_schedules"("candidateApplicationId");

-- CreateIndex
CREATE UNIQUE INDEX "interview_results_interviewScheduleId_key" ON "interview_results"("interviewScheduleId");

-- CreateIndex
CREATE INDEX "candidate_offers_candidateApplicationId_idx" ON "candidate_offers"("candidateApplicationId");

-- CreateIndex
CREATE INDEX "onboarding_tasks_tenantId_status_idx" ON "onboarding_tasks"("tenantId", "status");

-- CreateIndex
CREATE INDEX "placement_histories_placementId_idx" ON "placement_histories"("placementId");

-- CreateIndex
CREATE INDEX "replacement_requests_tenantId_status_idx" ON "replacement_requests"("tenantId", "status");

-- CreateIndex
CREATE INDEX "replacement_requests_placementId_idx" ON "replacement_requests"("placementId");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_code_key" ON "subscription_plans"("code");

-- CreateIndex
CREATE INDEX "plan_features_planId_idx" ON "plan_features"("planId");

-- CreateIndex
CREATE INDEX "tenant_subscriptions_tenantId_idx" ON "tenant_subscriptions"("tenantId");

-- CreateIndex
CREATE INDEX "login_histories_userId_idx" ON "login_histories"("userId");

-- CreateIndex
CREATE INDEX "notification_templates_tenantId_code_idx" ON "notification_templates"("tenantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "translation_keys_namespace_key_key" ON "translation_keys"("namespace", "key");

-- CreateIndex
CREATE UNIQUE INDEX "translations_translationKeyId_tenantId_locale_key" ON "translations"("translationKeyId", "tenantId", "locale");

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_payrollGroupId_fkey" FOREIGN KEY ("payrollGroupId") REFERENCES "payroll_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_contacts" ADD CONSTRAINT "employee_contacts_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_bank_accounts" ADD CONSTRAINT "employee_bank_accounts_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_documents" ADD CONSTRAINT "employee_documents_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_position_histories" ADD CONSTRAINT "employee_position_histories_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_periods" ADD CONSTRAINT "payroll_periods_payrollGroupId_fkey" FOREIGN KEY ("payrollGroupId") REFERENCES "payroll_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_slips" ADD CONSTRAINT "salary_slips_payslipId_fkey" FOREIGN KEY ("payslipId") REFERENCES "payslips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_installments" ADD CONSTRAINT "loan_installments_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "loans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_installments" ADD CONSTRAINT "loan_installments_payrollPeriodId_fkey" FOREIGN KEY ("payrollPeriodId") REFERENCES "payroll_periods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_schedules" ADD CONSTRAINT "employee_schedules_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permission_requests" ADD CONSTRAINT "permission_requests_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_schedules" ADD CONSTRAINT "interview_schedules_candidateApplicationId_fkey" FOREIGN KEY ("candidateApplicationId") REFERENCES "candidate_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_results" ADD CONSTRAINT "interview_results_interviewScheduleId_fkey" FOREIGN KEY ("interviewScheduleId") REFERENCES "interview_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_offers" ADD CONSTRAINT "candidate_offers_candidateApplicationId_fkey" FOREIGN KEY ("candidateApplicationId") REFERENCES "candidate_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_features" ADD CONSTRAINT "plan_features_planId_fkey" FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_subscriptions" ADD CONSTRAINT "tenant_subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "translations" ADD CONSTRAINT "translations_translationKeyId_fkey" FOREIGN KEY ("translationKeyId") REFERENCES "translation_keys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

