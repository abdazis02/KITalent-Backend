-- CreateEnum
CREATE TYPE "ApproverType" AS ENUM ('role', 'user', 'supervisor', 'department_head', 'hr', 'finance', 'client');

-- AlterTable
ALTER TABLE "approval_instances" ADD COLUMN     "amount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "requestedBy" UUID,
ADD COLUMN     "subjectEmployeeId" UUID;

-- AlterTable
ALTER TABLE "approval_step_records" DROP COLUMN "approverRole",
ADD COLUMN     "approverRoleKey" TEXT,
ADD COLUMN     "approverType" TEXT NOT NULL DEFAULT 'role',
ADD COLUMN     "resolvedApproverUserId" UUID;

-- AlterTable
ALTER TABLE "approval_workflows" DROP COLUMN "steps";

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "jobLevelId" UUID,
ADD COLUMN     "supervisorId" UUID;

-- CreateTable
CREATE TABLE "approval_steps" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "workflowId" UUID NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "approverType" "ApproverType" NOT NULL DEFAULT 'role',
    "approverRoleKey" TEXT,
    "approverUserId" UUID,
    "minAmount" INTEGER NOT NULL DEFAULT 0,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_steps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "approval_steps_workflowId_stepOrder_idx" ON "approval_steps"("workflowId", "stepOrder");

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_jobLevelId_fkey" FOREIGN KEY ("jobLevelId") REFERENCES "job_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_steps" ADD CONSTRAINT "approval_steps_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "approval_workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

