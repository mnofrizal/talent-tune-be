/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "SystemRole" AS ENUM ('ADMINISTRATOR', 'USER');

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('CREATED', 'SCHEDULED', 'WAITING_CONFIRMATION', 'TALENT_REQUIREMENTS', 'READY_FOR_ASSESSMENT', 'EVALUATING', 'NEED_REVIEW', 'DONE');

-- CreateEnum
CREATE TYPE "AssessmentRoleType" AS ENUM ('PARTICIPANT', 'EVALUATOR');

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nip" TEXT NOT NULL,
    "systemRole" "SystemRole" NOT NULL DEFAULT 'USER',
    "jabatan" TEXT NOT NULL,
    "bidang" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_roles" (
    "id" SERIAL NOT NULL,
    "name" "AssessmentRoleType" NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessment_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessments" (
    "id" SERIAL NOT NULL,
    "judul" TEXT NOT NULL,
    "materi" TEXT NOT NULL,
    "proyeksi" TEXT NOT NULL,
    "metodePelaksanaan" TEXT NOT NULL,
    "ruangan" TEXT NOT NULL,
    "linkMeeting" TEXT,
    "notaDinas" TEXT NOT NULL,
    "schedule" TIMESTAMP(3) NOT NULL,
    "expiredDate" TIMESTAMP(3) NOT NULL,
    "status" "AssessmentStatus" NOT NULL DEFAULT 'CREATED',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_participants" (
    "id" SERIAL NOT NULL,
    "assessmentId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "assessmentRoleId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessment_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_submissions" (
    "id" SERIAL NOT NULL,
    "assessmentId" INTEGER NOT NULL,
    "participantId" INTEGER NOT NULL,
    "pptxFile" TEXT NOT NULL,
    "attendanceConfirmation" BOOLEAN NOT NULL DEFAULT false,
    "questionnaireResponses" JSONB NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluations" (
    "id" SERIAL NOT NULL,
    "assessmentId" INTEGER NOT NULL,
    "evaluatorParticipantId" INTEGER NOT NULL,
    "userParticipantId" INTEGER NOT NULL,
    "aspectScores" JSONB NOT NULL,
    "conclusionRecommendation" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_nip_key" ON "users"("nip");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_participants_assessmentId_userId_key" ON "assessment_participants"("assessmentId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_submissions_assessmentId_participantId_key" ON "user_submissions"("assessmentId", "participantId");

-- CreateIndex
CREATE UNIQUE INDEX "evaluations_assessmentId_evaluatorParticipantId_userPartici_key" ON "evaluations"("assessmentId", "evaluatorParticipantId", "userParticipantId");

-- AddForeignKey
ALTER TABLE "assessment_participants" ADD CONSTRAINT "assessment_participants_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_participants" ADD CONSTRAINT "assessment_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_participants" ADD CONSTRAINT "assessment_participants_assessmentRoleId_fkey" FOREIGN KEY ("assessmentRoleId") REFERENCES "assessment_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_submissions" ADD CONSTRAINT "user_submissions_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_submissions" ADD CONSTRAINT "user_submissions_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "assessment_participants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_evaluatorParticipantId_fkey" FOREIGN KEY ("evaluatorParticipantId") REFERENCES "assessment_participants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_userParticipantId_fkey" FOREIGN KEY ("userParticipantId") REFERENCES "assessment_participants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
