import { prisma } from "../config/prisma.js";
import { CustomError } from "../utils/customError.js";
import { StatusCodes } from "http-status-codes";
import { ERROR_MESSAGES } from "../config/constants.js";
import { generateAssessmentPDF } from "../utils/assessmentPdfGenerator.js";
import path from "path";
import fs from "fs";

export const evaluationService = {
  getEvaluations: async (filters = {}) => {
    try {
      const { status, assessmentId, evaluatorId } = filters;
      const where = {};

      if (status) where.status = status;
      if (assessmentId) where.assessmentId = parseInt(assessmentId);
      if (evaluatorId) where.evaluatorId = parseInt(evaluatorId);

      return prisma.evaluation.findMany({
        where,
        include: {
          evaluator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          assessment: {
            select: {
              id: true,
              judul: true,
              status: true,
            },
          },
        },
      });
    } catch (error) {
      throw new CustomError(
        "Failed to retrieve evaluations",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  },

  getEvaluationById: async (id) => {
    try {
      const evaluation = await prisma.evaluation.findUnique({
        where: { id: parseInt(id) },
        include: {
          evaluator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          assessment: {
            select: {
              id: true,
              judul: true,
              status: true,
              proyeksi: true,
              judul: true,
              participant: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  nip: true,
                  jabatan: true,
                  bidang: true,
                },
              },
            },
          },
        },
      });

      if (!evaluation) {
        throw new CustomError("Evaluation not found", StatusCodes.NOT_FOUND);
      }

      return evaluation;
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        "Failed to retrieve evaluation",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  },

  createEvaluation: async (evaluatorId, evaluationData) => {
    try {
      const { assessmentId, scores, recommendation, status } = evaluationData;

      // Check if the assessment exists
      const assessment = await prisma.assessment.findUnique({
        where: { id: assessmentId },
      });

      if (!assessment) {
        throw new CustomError("Assessment not found", StatusCodes.NOT_FOUND);
      }

      // Check if an evaluation already exists for this assessment and evaluator
      const existingEvaluation = await prisma.evaluation.findUnique({
        where: {
          evaluatorId_assessmentId: {
            evaluatorId,
            assessmentId,
          },
        },
      });

      if (existingEvaluation) {
        throw new CustomError(
          "Evaluation already exists for this assessment",
          StatusCodes.CONFLICT
        );
      }

      return prisma.evaluation.create({
        data: {
          evaluatorId,
          assessmentId,
          scores,
          recommendation,
          status: status || "PENDING",
        },
        include: {
          evaluator: {
            select: {
              id: true,
              name: true,
              jabatan: true,
            },
          },
          assessment: {
            select: {
              id: true,
              judul: true,
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        "Failed to create evaluation",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  },

  updateEvaluation: async (id, evaluatorId, evaluationData, userRole) => {
    try {
      const { scores, recommendation, status } = evaluationData;

      // First check if evaluation exists
      const existingEvaluation = await prisma.evaluation.findUnique({
        where: {
          id: parseInt(id),
        },
      });

      if (!existingEvaluation) {
        throw new CustomError("Evaluation not found", StatusCodes.NOT_FOUND);
      }

      // Check authorization - allow if user is admin or the original evaluator
      const isAdmin = userRole === "ADMINISTRATOR";
      const isEvaluator =
        Number(existingEvaluation.evaluatorId) === Number(evaluatorId);

      if (!isAdmin && !isEvaluator) {
        throw new CustomError(
          "Unauthorized to update this evaluation",
          StatusCodes.FORBIDDEN
        );
      }

      console.log("Evaluation found and authorized:", {
        evaluationId: id,
        evaluatorId,
        existingEvaluatorId: existingEvaluation.evaluatorId,
        userRole,
        isAdmin,
        isEvaluator,
      });

      // Get existing evaluation file if any
      const existingFile = await prisma.evaluationFile.findFirst({
        where: { evaluationId: parseInt(id) },
      });

      // Delete existing evaluation file if it exists
      if (existingFile) {
        try {
          // Try with the stored path directly
          if (fs.existsSync(existingFile.filePath)) {
            fs.unlinkSync(existingFile.filePath);
          } else {
            // If not found, try with full path
            const fullPath = path.join(process.cwd(), existingFile.filePath);
            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath);
            }
          }

          // Also check in the penilaian directory
          const penilaianPath = path.join(
            process.cwd(),
            "src",
            "uploads",
            "assesment",
            "penilaian",
            path.basename(existingFile.filePath)
          );
          if (fs.existsSync(penilaianPath)) {
            fs.unlinkSync(penilaianPath);
          }
        } catch (error) {
          console.error("Error deleting file:", error);
        }

        // Delete the file record from database
        await prisma.evaluationFile.delete({
          where: { id: existingFile.id },
        });
      }

      // Get full assessment details for PDF generation
      const assessment = await prisma.assessment.findUnique({
        where: { id: existingEvaluation.assessmentId },
        include: {
          participant: {
            select: {
              name: true,
              nip: true,
              jabatan: true,
              bidang: true,
            },
          },
        },
      });

      // Update evaluation and assessment if status is completed
      const updatedEvaluation = await prisma.$transaction(async (prisma) => {
        const evaluation = await prisma.evaluation.update({
          where: { id: parseInt(id) },
          data: {
            ...(scores && { scores }),
            ...(recommendation && { recommendation }),
            ...(status && { status }),
          },
          include: {
            evaluator: {
              select: {
                id: true,
                name: true,
                jabatan: true,
              },
            },
            assessment: {
              select: {
                id: true,
                judul: true,
                proyeksi: true,
              },
            },
          },
        });

        // If status is completed, update assessment status to NEED_REVIEW
        if (status === "COMPLETED") {
          await prisma.assessment.update({
            where: { id: existingEvaluation.assessmentId },
            data: { status: "NEED_REVIEW" },
          });
        }

        return evaluation;
      });

      let fileError = null;
      console.log({ assessment });

      // Generate PDF if evaluation is completed
      if (status === "COMPLETED") {
        try {
          const assessmentData = {
            tingkatGeneralist:
              assessment.proyeksi.replace(/_/g, " ") || "GENERALIST",
            tanggal: assessment.schedule
              ? new Date(assessment.schedule).toLocaleDateString("id-ID")
              : "",
            waktu: assessment.schedule
              ? new Date(assessment.schedule).toLocaleTimeString("id-ID")
              : "",
            no: "1",
            nama: assessment.participant.name,
            nip: assessment.participant.nip,
            grade: "",
            bidang: assessment.participant.bidang,
            jabatanEksisting: assessment.participant.jabatan || "-",
            bidangEksisting: assessment.participant.bidang || "-",
            tglJabatanTerakhir: "",
            proyeksiJabatan: assessment.proyeksi?.replace(/_/g, " ") || "-",
            pendidikan: "",
            aspekPenilaian: {
              pemahamanUnit: updatedEvaluation.scores?.q1?.rating || 0,
              pemahamanBidangKerja: updatedEvaluation.scores?.q2?.rating || 0,
              sikap: updatedEvaluation.scores?.q3?.rating || 0,
              keterampilanKomunikasi: updatedEvaluation.scores?.q4?.rating || 0,
            },
            kesimpulanRekomendasi: updatedEvaluation.recommendation || "-",
            tanggalTtd: `Suralaya, ${new Date().toLocaleDateString("id-ID", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}`,
            evaluator: updatedEvaluation.evaluator.name || "-",
            jabatanEvaluator: updatedEvaluation.evaluator.jabatan || "-",
          };

          // Generate PDF and save to database in a transaction
          await prisma.$transaction(async (prisma) => {
            const pdfPath = await generateAssessmentPDF(assessmentData);
            const filename = path.basename(pdfPath);

            await prisma.evaluationFile.create({
              data: {
                fileName: filename,
                filePath: pdfPath,
                evaluationId: updatedEvaluation.id,
              },
            });

            return pdfPath;
          });
        } catch (error) {
          console.error("PDF Generation Error:", error);
          fileError = error;
        }
      }

      // Return both the updated evaluation and any file error
      return {
        evaluation: updatedEvaluation,
        fileError: fileError ? fileError.message : null,
      };
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        "Failed to update evaluation",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  },

  deleteEvaluation: async (id, evaluatorId, userRole) => {
    try {
      // First check if evaluation exists
      const existingEvaluation = await prisma.evaluation.findUnique({
        where: {
          id: parseInt(id),
        },
      });

      if (!existingEvaluation) {
        throw new CustomError("Evaluation not found", StatusCodes.NOT_FOUND);
      }

      // Check authorization - allow if user is admin or the original evaluator
      const isAdmin = userRole === "ADMINISTRATOR";
      const isEvaluator =
        Number(existingEvaluation.evaluatorId) === Number(evaluatorId);

      if (!isAdmin && !isEvaluator) {
        throw new CustomError(
          "Unauthorized to delete this evaluation",
          StatusCodes.FORBIDDEN
        );
      }

      // Get existing evaluation file if any
      const existingFile = await prisma.evaluationFile.findFirst({
        where: { evaluationId: parseInt(id) },
      });

      // Delete existing evaluation file if it exists
      if (existingFile) {
        try {
          // Try with the stored path directly
          if (fs.existsSync(existingFile.filePath)) {
            fs.unlinkSync(existingFile.filePath);
          } else {
            // If not found, try with full path
            const fullPath = path.join(process.cwd(), existingFile.filePath);
            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath);
            }
          }

          // Also check in the penilaian directory
          const penilaianPath = path.join(
            process.cwd(),
            "src",
            "uploads",
            "assesment",
            "penilaian",
            path.basename(existingFile.filePath)
          );
          if (fs.existsSync(penilaianPath)) {
            fs.unlinkSync(penilaianPath);
          }
        } catch (error) {
          console.error("Error deleting file:", error);
        }

        // Delete the file record from database
        await prisma.evaluationFile.delete({
          where: { id: existingFile.id },
        });
      }

      // Delete the evaluation
      await prisma.evaluation.delete({
        where: { id: parseInt(id) },
      });
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        "Failed to delete evaluation",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  },
};
