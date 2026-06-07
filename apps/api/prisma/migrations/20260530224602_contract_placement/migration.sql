-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('pkwt', 'pkwtt', 'client_agreement', 'addendum', 'placement_letter', 'nda', 'offering_letter');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('draft', 'waiting_approval', 'approved', 'sent', 'signed', 'active', 'expiring_soon', 'expired', 'renewed', 'terminated', 'cancelled');

-- CreateEnum
CREATE TYPE "PlacementStatus" AS ENUM ('draft', 'waiting_approval', 'active', 'on_hold', 'replacement_requested', 'replaced', 'completed', 'cancelled');

-- CreateTable
CREATE TABLE "contracts" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "employeeId" UUID,
    "clientId" UUID,
    "number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "ContractType" NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'draft',
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "value" INTEGER,
    "fileKey" TEXT,
    "notes" TEXT,
    "approvedBy" UUID,
    "approvedAt" TIMESTAMP(3),
    "signedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" UUID,
    "updatedBy" UUID,
    "deletedBy" UUID,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "placements" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "contractId" UUID,
    "shiftId" UUID,
    "position" TEXT,
    "location" TEXT,
    "supervisorId" UUID,
    "status" "PlacementStatus" NOT NULL DEFAULT 'draft',
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" UUID,
    "updatedBy" UUID,
    "deletedBy" UUID,

    CONSTRAINT "placements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contracts_tenantId_status_idx" ON "contracts"("tenantId", "status");

-- CreateIndex
CREATE INDEX "contracts_endDate_idx" ON "contracts"("endDate");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_tenantId_number_key" ON "contracts"("tenantId", "number");

-- CreateIndex
CREATE INDEX "placements_tenantId_status_idx" ON "placements"("tenantId", "status");

-- CreateIndex
CREATE INDEX "placements_employeeId_idx" ON "placements"("employeeId");

-- CreateIndex
CREATE INDEX "placements_clientId_idx" ON "placements"("clientId");

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placements" ADD CONSTRAINT "placements_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placements" ADD CONSTRAINT "placements_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placements" ADD CONSTRAINT "placements_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placements" ADD CONSTRAINT "placements_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placements" ADD CONSTRAINT "placements_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
