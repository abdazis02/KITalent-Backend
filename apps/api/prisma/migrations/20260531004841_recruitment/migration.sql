-- CreateEnum
CREATE TYPE "VacancyStatus" AS ENUM ('draft', 'open', 'on_hold', 'closed', 'cancelled');

-- CreateEnum
CREATE TYPE "RecruitmentStage" AS ENUM ('applied', 'screening', 'shortlisted', 'interview_scheduled', 'interviewed', 'assessment', 'mcu', 'background_check', 'offering', 'accepted', 'rejected', 'onboarding', 'hired');

-- CreateTable
CREATE TABLE "job_vacancies" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "clientId" UUID,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "position" TEXT,
    "location" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" "VacancyStatus" NOT NULL DEFAULT 'draft',
    "description" TEXT,
    "requirements" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" UUID,
    "updatedBy" UUID,
    "deletedBy" UUID,

    CONSTRAINT "job_vacancies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidates" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "vacancyId" UUID,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "source" TEXT,
    "stage" "RecruitmentStage" NOT NULL DEFAULT 'applied',
    "cvKey" TEXT,
    "notes" TEXT,
    "rejectReason" TEXT,
    "blacklisted" BOOLEAN NOT NULL DEFAULT false,
    "convertedEmployeeId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" UUID,
    "updatedBy" UUID,
    "deletedBy" UUID,

    CONSTRAINT "candidates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "job_vacancies_tenantId_status_idx" ON "job_vacancies"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "job_vacancies_tenantId_code_key" ON "job_vacancies"("tenantId", "code");

-- CreateIndex
CREATE INDEX "candidates_tenantId_stage_idx" ON "candidates"("tenantId", "stage");

-- CreateIndex
CREATE INDEX "candidates_vacancyId_idx" ON "candidates"("vacancyId");

-- AddForeignKey
ALTER TABLE "job_vacancies" ADD CONSTRAINT "job_vacancies_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_vacancies" ADD CONSTRAINT "job_vacancies_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_vacancyId_fkey" FOREIGN KEY ("vacancyId") REFERENCES "job_vacancies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
