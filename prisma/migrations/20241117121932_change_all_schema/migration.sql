/*
  Warnings:

  - You are about to drop the `assessment_participants` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `assessment_roles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `assessments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `evaluations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_submissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "EvaluationStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "MetodePelaksanaan" AS ENUM ('OFFLINE', 'ONLINE', 'HYBRID');

-- DropForeignKey
ALTER TABLE "assessment_participants" DROP CONSTRAINT "assessment_participants_assessmentId_fkey";

-- DropForeignKey
ALTER TABLE "assessment_participants" DROP CONSTRAINT "assessment_participants_assessmentRoleId_fkey";

-- DropForeignKey
ALTER TABLE "assessment_participants" DROP CONSTRAINT "assessment_participants_userId_fkey";

-- DropForeignKey
ALTER TABLE "evaluations" DROP CONSTRAINT "evaluations_assessmentId_fkey";

-- DropForeignKey
ALTER TABLE "evaluations" DROP CONSTRAINT "evaluations_evaluatorId_fkey";

-- DropForeignKey
ALTER TABLE "evaluations" DROP CONSTRAINT "evaluations_participantId_fkey";

-- DropForeignKey
ALTER TABLE "user_submissions" DROP CONSTRAINT "user_submissions_participantId_fkey";

-- DropTable
DROP TABLE "assessment_participants";

-- DropTable
DROP TABLE "assessment_roles";

-- DropTable
DROP TABLE "assessments";

-- DropTable
DROP TABLE "evaluations";

-- DropTable
DROP TABLE "user_submissions";

-- DropTable
DROP TABLE "users";

-- DropEnum
DROP TYPE "AssessmentRoleType";

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nip" TEXT NOT NULL,
    "systemRole" "SystemRole" NOT NULL DEFAULT 'USER',
    "jabatan" TEXT NOT NULL,
    "bidang" TEXT NOT NULL,
    "refreshToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" SERIAL NOT NULL,
    "judul" TEXT NOT NULL,
    "materi" TEXT NOT NULL,
    "proyeksi" TEXT NOT NULL,
    "metodePelaksanaan" "MetodePelaksanaan" NOT NULL,
    "ruangan" TEXT NOT NULL,
    "linkMeeting" TEXT,
    "notaDinas" TEXT,
    "status" "AssessmentStatus" NOT NULL DEFAULT 'CREATED',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "presentationFile" TEXT,
    "attendanceConfirmation" BOOLEAN NOT NULL DEFAULT false,
    "questionnaireResponses" JSONB,
    "participantId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" SERIAL NOT NULL,
    "evaluatorId" INTEGER NOT NULL,
    "assessmentId" INTEGER NOT NULL,
    "scores" JSONB,
    "recommendation" TEXT NOT NULL,
    "status" "EvaluationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_nip_key" ON "User"("nip");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_nip_idx" ON "User"("nip");

-- CreateIndex
CREATE INDEX "Assessment_participantId_idx" ON "Assessment"("participantId");

-- CreateIndex
CREATE INDEX "Assessment_status_idx" ON "Assessment"("status");

-- CreateIndex
CREATE INDEX "Assessment_createdAt_idx" ON "Assessment"("createdAt");

-- CreateIndex
CREATE INDEX "Evaluation_evaluatorId_idx" ON "Evaluation"("evaluatorId");

-- CreateIndex
CREATE INDEX "Evaluation_assessmentId_idx" ON "Evaluation"("assessmentId");

-- CreateIndex
CREATE INDEX "Evaluation_status_idx" ON "Evaluation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Evaluation_evaluatorId_assessmentId_key" ON "Evaluation"("evaluatorId", "assessmentId");

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
