/*
  Warnings:

  - A unique constraint covering the columns `[participantId]` on the table `user_submissions` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "user_submissions_assessmentId_participantId_key";

-- AlterTable
ALTER TABLE "assessments" ALTER COLUMN "ruangan" DROP NOT NULL,
ALTER COLUMN "notaDinas" DROP NOT NULL;

-- AlterTable
ALTER TABLE "evaluations" ALTER COLUMN "aspectScores" DROP NOT NULL,
ALTER COLUMN "conclusionRecommendation" DROP NOT NULL;

-- AlterTable
ALTER TABLE "user_submissions" ALTER COLUMN "pptxFile" DROP NOT NULL,
ALTER COLUMN "attendanceConfirmation" DROP NOT NULL,
ALTER COLUMN "questionnaireResponses" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "user_submissions_participantId_key" ON "user_submissions"("participantId");
