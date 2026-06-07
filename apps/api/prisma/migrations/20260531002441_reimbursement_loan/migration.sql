-- CreateEnum
CREATE TYPE "ReimbursementStatus" AS ENUM ('submitted', 'waiting_approval', 'approved', 'rejected', 'paid', 'cancelled');

-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('requested', 'approved', 'active', 'completed', 'rejected', 'cancelled');

-- CreateTable
CREATE TABLE "reimbursements" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "receiptKey" TEXT,
    "status" "ReimbursementStatus" NOT NULL DEFAULT 'submitted',
    "approvedBy" UUID,
    "approvedAt" TIMESTAMP(3),
    "rejectReason" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" UUID,
    "updatedBy" UUID,
    "deletedBy" UUID,

    CONSTRAINT "reimbursements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loans" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "principal" INTEGER NOT NULL,
    "installmentCount" INTEGER NOT NULL,
    "monthlyDeduction" INTEGER NOT NULL,
    "outstanding" INTEGER NOT NULL,
    "status" "LoanStatus" NOT NULL DEFAULT 'requested',
    "approvedBy" UUID,
    "approvedAt" TIMESTAMP(3),
    "rejectReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" UUID,
    "updatedBy" UUID,
    "deletedBy" UUID,

    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reimbursements_tenantId_status_idx" ON "reimbursements"("tenantId", "status");

-- CreateIndex
CREATE INDEX "reimbursements_employeeId_idx" ON "reimbursements"("employeeId");

-- CreateIndex
CREATE INDEX "loans_tenantId_status_idx" ON "loans"("tenantId", "status");

-- CreateIndex
CREATE INDEX "loans_employeeId_idx" ON "loans"("employeeId");

-- AddForeignKey
ALTER TABLE "reimbursements" ADD CONSTRAINT "reimbursements_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reimbursements" ADD CONSTRAINT "reimbursements_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
