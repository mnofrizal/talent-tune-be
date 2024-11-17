/*
  Warnings:

  - You are about to drop the column `status` on the `assessments` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `assessment_roles` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "assessment_participants" ADD COLUMN     "status" "AssessmentStatus" NOT NULL DEFAULT 'CREATED';

-- AlterTable
ALTER TABLE "assessments" DROP COLUMN "status";

-- CreateIndex
CREATE UNIQUE INDEX "assessment_roles_name_key" ON "assessment_roles"("name");
