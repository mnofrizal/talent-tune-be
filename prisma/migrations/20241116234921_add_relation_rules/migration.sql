/*
  Warnings:

  - You are about to drop the column `aspectScores` on the `evaluations` table. All the data in the column will be lost.
  - You are about to drop the column `conclusionRecommendation` on the `evaluations` table. All the data in the column will be lost.
  - You are about to drop the column `evaluatorParticipantId` on the `evaluations` table. All the data in the column will be lost.
  - You are about to drop the column `userParticipantId` on the `evaluations` table. All the data in the column will be lost.
  - You are about to drop the column `pptxFile` on the `user_submissions` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[assessmentId,evaluatorId,participantId]` on the table `evaluations` will be added. If there are existing duplicate values, this will fail.
  - Made the column `ruangan` on table `assessments` required. This step will fail if there are existing NULL values in that column.
  - Made the column `notaDinas` on table `assessments` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `evaluatorId` to the `evaluations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `participantId` to the `evaluations` table without a default value. This is not possible if the table is not empty.
  - Made the column `attendanceConfirmation` on table `user_submissions` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AssessmentStatus" ADD VALUE 'CANCELED';
ALTER TYPE "AssessmentStatus" ADD VALUE 'RESCHEDULE';

-- DropForeignKey
ALTER TABLE "assessment_participants" DROP CONSTRAINT "assessment_participants_assessmentId_fkey";

-- DropForeignKey
ALTER TABLE "assessment_participants" DROP CONSTRAINT "assessment_participants_assessmentRoleId_fkey";

-- DropForeignKey
ALTER TABLE "assessment_participants" DROP CONSTRAINT "assessment_participants_userId_fkey";

-- DropForeignKey
ALTER TABLE "evaluations" DROP CONSTRAINT "evaluations_evaluatorParticipantId_fkey";

-- DropForeignKey
ALTER TABLE "evaluations" DROP CONSTRAINT "evaluations_userParticipantId_fkey";

-- DropForeignKey
ALTER TABLE "user_submissions" DROP CONSTRAINT "user_submissions_assessmentId_fkey";

-- DropIndex
DROP INDEX "evaluations_assessmentId_evaluatorParticipantId_userPartici_key";

-- AlterTable
ALTER TABLE "assessments" ALTER COLUMN "ruangan" SET NOT NULL,
ALTER COLUMN "notaDinas" SET NOT NULL;

-- AlterTable
ALTER TABLE "evaluations" DROP COLUMN "aspectScores",
DROP COLUMN "conclusionRecommendation",
DROP COLUMN "evaluatorParticipantId",
DROP COLUMN "userParticipantId",
ADD COLUMN     "evaluatorId" INTEGER NOT NULL,
ADD COLUMN     "participantId" INTEGER NOT NULL,
ADD COLUMN     "recommendation" TEXT,
ADD COLUMN     "scores" JSONB;

-- AlterTable
ALTER TABLE "user_submissions" DROP COLUMN "pptxFile",
ADD COLUMN     "presentationFile" TEXT,
ALTER COLUMN "attendanceConfirmation" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "evaluations_assessmentId_evaluatorId_participantId_key" ON "evaluations"("assessmentId", "evaluatorId", "participantId");

-- AddForeignKey
ALTER TABLE "assessment_participants" ADD CONSTRAINT "assessment_participants_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_participants" ADD CONSTRAINT "assessment_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_participants" ADD CONSTRAINT "assessment_participants_assessmentRoleId_fkey" FOREIGN KEY ("assessmentRoleId") REFERENCES "assessment_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "assessment_participants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "assessment_participants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
