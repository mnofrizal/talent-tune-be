/*
  Warnings:

  - The values [CREATED] on the enum `AssessmentStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `notaDinas` on the `Assessment` table. All the data in the column will be lost.
  - You are about to drop the column `presentationFile` on the `Assessment` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AssessmentStatus_new" AS ENUM ('SCHEDULED', 'WAITING_CONFIRMATION', 'TALENT_REQUIREMENTS', 'READY_FOR_ASSESSMENT', 'EVALUATING', 'NEED_REVIEW', 'DONE', 'CANCELED', 'RESCHEDULE');
ALTER TABLE "Assessment" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Assessment" ALTER COLUMN "status" TYPE "AssessmentStatus_new" USING ("status"::text::"AssessmentStatus_new");
ALTER TYPE "AssessmentStatus" RENAME TO "AssessmentStatus_old";
ALTER TYPE "AssessmentStatus_new" RENAME TO "AssessmentStatus";
DROP TYPE "AssessmentStatus_old";
ALTER TABLE "Assessment" ALTER COLUMN "status" SET DEFAULT 'SCHEDULED';
COMMIT;

-- AlterTable
ALTER TABLE "Assessment" DROP COLUMN "notaDinas",
DROP COLUMN "presentationFile";

-- CreateTable
CREATE TABLE "NotaDinas" (
    "id" SERIAL NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assessmentId" INTEGER NOT NULL,

    CONSTRAINT "NotaDinas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "File" (
    "id" SERIAL NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assessmentId" INTEGER NOT NULL,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotaDinas_assessmentId_key" ON "NotaDinas"("assessmentId");

-- CreateIndex
CREATE UNIQUE INDEX "File_assessmentId_key" ON "File"("assessmentId");

-- AddForeignKey
ALTER TABLE "NotaDinas" ADD CONSTRAINT "NotaDinas_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
