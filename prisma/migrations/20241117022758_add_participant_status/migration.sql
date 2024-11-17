/*
  Warnings:

  - You are about to drop the column `status` on the `assessment_participants` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "assessment_participants" DROP COLUMN "status",
ADD COLUMN     "participantStatus" "AssessmentStatus" DEFAULT 'CREATED';
