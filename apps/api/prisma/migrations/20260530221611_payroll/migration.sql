-- CreateEnum
CREATE TYPE "PayrollComponentType" AS ENUM ('earning', 'deduction', 'benefit', 'tax', 'employer_contribution', 'employee_contribution', 'reimbursement', 'loan', 'adjustment');

-- CreateEnum
CREATE TYPE "PayrollStatus" AS ENUM ('draft', 'calculating', 'need_review', 'waiting_approval', 'approved', 'paid', 'locked', 'cancelled');

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "basicSalary" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "payroll_components" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PayrollComponentType" NOT NULL,
    "taxable" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "payroll_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_payroll_items" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "componentId" UUID NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_payroll_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_runs" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "periodLabel" TEXT NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "status" "PayrollStatus" NOT NULL DEFAULT 'draft',
    "totalGross" INTEGER NOT NULL DEFAULT 0,
    "totalDeduction" INTEGER NOT NULL DEFAULT 0,
    "totalNet" INTEGER NOT NULL DEFAULT 0,
    "employeeCount" INTEGER NOT NULL DEFAULT 0,
    "approvedBy" UUID,
    "approvedAt" TIMESTAMP(3),
    "lockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" UUID,
    "updatedBy" UUID,

    CONSTRAINT "payroll_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payslips" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "runId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "basicSalary" INTEGER NOT NULL DEFAULT 0,
    "totalEarning" INTEGER NOT NULL DEFAULT 0,
    "totalDeduction" INTEGER NOT NULL DEFAULT 0,
    "netSalary" INTEGER NOT NULL DEFAULT 0,
    "presentDays" INTEGER NOT NULL DEFAULT 0,
    "absentDays" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payslips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payslip_components" (
    "id" UUID NOT NULL,
    "payslipId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PayrollComponentType" NOT NULL,
    "amount" INTEGER NOT NULL,

    CONSTRAINT "payslip_components_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payroll_components_tenantId_code_key" ON "payroll_components"("tenantId", "code");

-- CreateIndex
CREATE INDEX "employee_payroll_items_tenantId_idx" ON "employee_payroll_items"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "employee_payroll_items_employeeId_componentId_key" ON "employee_payroll_items"("employeeId", "componentId");

-- CreateIndex
CREATE INDEX "payroll_runs_tenantId_status_idx" ON "payroll_runs"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_runs_tenantId_periodLabel_key" ON "payroll_runs"("tenantId", "periodLabel");

-- CreateIndex
CREATE INDEX "payslips_tenantId_idx" ON "payslips"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "payslips_runId_employeeId_key" ON "payslips"("runId", "employeeId");

-- CreateIndex
CREATE INDEX "payslip_components_payslipId_idx" ON "payslip_components"("payslipId");

-- AddForeignKey
ALTER TABLE "payroll_components" ADD CONSTRAINT "payroll_components_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_payroll_items" ADD CONSTRAINT "employee_payroll_items_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_payroll_items" ADD CONSTRAINT "employee_payroll_items_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "payroll_components"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_runId_fkey" FOREIGN KEY ("runId") REFERENCES "payroll_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslip_components" ADD CONSTRAINT "payslip_components_payslipId_fkey" FOREIGN KEY ("payslipId") REFERENCES "payslips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
