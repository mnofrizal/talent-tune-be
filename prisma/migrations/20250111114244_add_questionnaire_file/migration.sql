/*
  Warnings:

  - You are about to drop the column `assessmentId` on the `File` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[presentationAssessmentId]` on the table `File` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[questionnaireAssessmentId]` on the table `File` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_assessmentId_fkey";

-- DropIndex
DROP INDEX "File_assessmentId_key";

-- AlterTable
ALTER TABLE "File" DROP COLUMN "assessmentId",
ADD COLUMN     "fileType" TEXT,
ADD COLUMN     "presentationAssessmentId" INTEGER,
ADD COLUMN     "questionnaireAssessmentId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "File_presentationAssessmentId_key" ON "File"("presentationAssessmentId");

-- CreateIndex
CREATE UNIQUE INDEX "File_questionnaireAssessmentId_key" ON "File"("questionnaireAssessmentId");

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_presentationAssessmentId_fkey" FOREIGN KEY ("presentationAssessmentId") REFERENCES "Assessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_questionnaireAssessmentId_fkey" FOREIGN KEY ("questionnaireAssessmentId") REFERENCES "Assessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
