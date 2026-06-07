-- CreateEnum
CREATE TYPE "PerformanceStatus" AS ENUM ('draft', 'in_review', 'submitted', 'approved', 'published', 'archived');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('reported', 'investigating', 'action_taken', 'resolved', 'dismissed');

-- CreateTable
CREATE TABLE "performance_reviews" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "reviewerId" UUID,
    "period" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'supervisor',
    "overallScore" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "status" "PerformanceStatus" NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" UUID,
    "updatedBy" UUID,
    "deletedBy" UUID,

    CONSTRAINT "performance_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_items" (
    "id" UUID NOT NULL,
    "reviewId" UUID NOT NULL,
    "kpi" TEXT NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "score" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "performance_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidents" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "incidentDate" DATE NOT NULL,
    "status" "IncidentStatus" NOT NULL DEFAULT 'reported',
    "sanction" TEXT,
    "investigationNotes" TEXT,
    "attachmentKey" TEXT,
    "reportedBy" UUID,
    "resolvedBy" UUID,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" UUID,
    "updatedBy" UUID,
    "deletedBy" UUID,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "performance_reviews_tenantId_status_idx" ON "performance_reviews"("tenantId", "status");

-- CreateIndex
CREATE INDEX "performance_reviews_employeeId_idx" ON "performance_reviews"("employeeId");

-- CreateIndex
CREATE INDEX "performance_items_reviewId_idx" ON "performance_items"("reviewId");

-- CreateIndex
CREATE INDEX "incidents_tenantId_status_idx" ON "incidents"("tenantId", "status");

-- CreateIndex
CREATE INDEX "incidents_employeeId_idx" ON "incidents"("employeeId");

-- AddForeignKey
ALTER TABLE "performance_reviews" ADD CONSTRAINT "performance_reviews_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_reviews" ADD CONSTRAINT "performance_reviews_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_items" ADD CONSTRAINT "performance_items_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "performance_reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
