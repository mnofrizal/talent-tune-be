/*
  Warnings:

  - You are about to drop the column `expiredDate` on the `assessments` table. All the data in the column will be lost.
  - You are about to drop the column `schedule` on the `assessments` table. All the data in the column will be lost.
  - You are about to drop the column `assessmentId` on the `user_submissions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "assessment_participants" ADD COLUMN     "expiredDate" TIMESTAMP(3),
ADD COLUMN     "schedule" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "assessments" DROP COLUMN "expiredDate",
DROP COLUMN "schedule";

-- AlterTable
ALTER TABLE "user_submissions" DROP COLUMN "assessmentId";
