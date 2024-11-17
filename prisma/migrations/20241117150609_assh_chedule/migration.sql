/*
  Warnings:

  - Added the required column `schedule` to the `Assessment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Assessment" ADD COLUMN     "schedule" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "Assessment_schedule_idx" ON "Assessment"("schedule");
