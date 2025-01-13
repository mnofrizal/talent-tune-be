-- CreateTable
CREATE TABLE "EvaluationFile" (
    "id" SERIAL NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evaluationId" INTEGER NOT NULL,

    CONSTRAINT "EvaluationFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationFile_evaluationId_key" ON "EvaluationFile"("evaluationId");

-- AddForeignKey
ALTER TABLE "EvaluationFile" ADD CONSTRAINT "EvaluationFile_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
