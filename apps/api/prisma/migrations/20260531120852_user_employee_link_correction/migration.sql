-- AlterTable
ALTER TABLE "attendance_records" ADD COLUMN     "correctionApprovedBy" UUID,
ADD COLUMN     "correctionReason" TEXT,
ADD COLUMN     "proposedCheckInAt" TIMESTAMP(3),
ADD COLUMN     "proposedCheckOutAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "userId" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "employees_userId_key" ON "employees"("userId");

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

