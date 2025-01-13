import { prisma } from "../config/prisma.js";
import { CustomError } from "../utils/customError.js";
import { StatusCodes } from "http-status-codes";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import { uploadsDir } from "../utils/uploadConfig.js";
import { generateQuestionnairePDF } from "../utils/pdfGenerator.js";

const unlinkAsync = promisify(fs.unlink);

export const assessmentService = {
  async getAssessments({
    status,
    metodePelaksanaan,
    startDate,
    endDate,
    participantId,
    evaluatorId,
    page = 1,
    limit = 10,
    searchTerm = "",
  }) {
    try {
      const skip = (page - 1) * limit;
      const where = {
        isActive: true,
        OR: searchTerm
          ? [
              { judul: { contains: searchTerm, mode: "insensitive" } },
              { materi: { contains: searchTerm, mode: "insensitive" } },
              { proyeksi: { contains: searchTerm, mode: "insensitive" } },
            ]
          : undefined,
        AND: [],
      };

      if (status) where.AND.push({ status });
      if (metodePelaksanaan) where.AND.push({ metodePelaksanaan });
      if (participantId) where.AND.push({ participantId });
      if (evaluatorId) {
        where.AND.push({
          evaluations: {
            some: { evaluatorId },
          },
        });
      }
      if (startDate && endDate) {
        where.AND.push({
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        });
      }

      const [total, assessments] = await prisma.$transaction([
        prisma.assessment.count({ where }),
        prisma.assessment.findMany({
          where,
          include: {
            notaDinas: true,
            presentationFile: true,
            questionnaireFile: true,
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
            evaluations: {
              include: {
                evaluationFile: true,
                evaluator: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    nip: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          skip,
          take: limit,
        }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        assessments,
        metadata: {
          total,
          page,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      throw new CustomError(
        "Error fetching assessments",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error
      );
    }
  },

  // Get assessment by ID
  async getAssessmentById(id) {
    try {
      const assessment = await prisma.assessment.findUnique({
        where: { id },
        include: {
          presentationFile: true,
          questionnaireFile: true,
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
          evaluations: {
            include: {
              evaluator: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  nip: true,
                },
              },
            },
          },
        },
      });

      if (!assessment) {
        throw new CustomError("Assessment not found", StatusCodes.NOT_FOUND);
      }

      return assessment;
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        "Error fetching assessment",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error
      );
    }
  },

  // Get assessments for a specific participant
  async getParticipantAssessments(participantId, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;
      const where = {
        participantId,
        isActive: true,
      };

      const [total, assessments] = await prisma.$transaction([
        prisma.assessment.count({ where }),
        prisma.assessment.findMany({
          where,
          include: {
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
            evaluations: {
              include: {
                evaluator: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    nip: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          skip,
          take: limit,
        }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        assessments,
        metadata: {
          total,
          page,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      throw new CustomError(
        "Error fetching participant assessments",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error
      );
    }
  },

  // Get assessments for a specific evaluator
  async getEvaluatorAssessments(evaluatorId, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;
      const where = {
        evaluations: {
          some: {
            evaluatorId,
          },
        },
        isActive: true,
      };

      const [total, assessments] = await prisma.$transaction([
        prisma.assessment.count({ where }),
        prisma.assessment.findMany({
          where,
          include: {
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
            evaluations: {
              where: {
                evaluatorId,
              },
              include: {
                evaluator: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    nip: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          skip,
          take: limit,
        }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        assessments,
        metadata: {
          total,
          page,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      throw new CustomError(
        "Error fetching evaluator assessments",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error
      );
    }
  },

  // Create new assessment
  async createAssessment(data, notaDinasFile) {
    try {
      const { assessment, evaluators } = data;
      const { participants, ...assessmentData } = assessment;

      // Handle notaDinas file if provided
      let notaDinasData = null;
      if (notaDinasFile) {
        notaDinasData = {
          fileName: notaDinasFile.filename,
          filePath: notaDinasFile.filename,
        };
      }

      // Get unique participant IDs
      const participantIds = participants.map((p) => p.participantId);

      // Check if all participants exist
      const existingParticipants = await prisma.user.findMany({
        where: {
          id: {
            in: participantIds,
          },
        },
      });

      if (existingParticipants.length !== participantIds.length) {
        throw new CustomError(
          "One or more participants not found",
          StatusCodes.NOT_FOUND
        );
      }

      // Check if evaluators exist and are valid
      const evaluatorIds = evaluators.map((e) => e.evaluatorId);
      const foundEvaluators = await prisma.user.findMany({
        where: {
          id: { in: evaluatorIds },
        },
      });

      if (foundEvaluators.length !== evaluatorIds.length) {
        throw new CustomError(
          "One or more evaluators not found",
          StatusCodes.NOT_FOUND
        );
      }

      // Check for duplicate evaluators
      if (new Set(evaluatorIds).size !== evaluatorIds.length) {
        throw new CustomError(
          "Duplicate evaluators are not allowed",
          StatusCodes.BAD_REQUEST
        );
      }

      // Check if any participant is also an evaluator
      const participantEvaluatorOverlap = participantIds.some((id) =>
        evaluatorIds.includes(id)
      );

      if (participantEvaluatorOverlap) {
        throw new CustomError(
          "A participant cannot be an evaluator",
          StatusCodes.BAD_REQUEST
        );
      }

      // Create assessments for each participant with their individual schedules
      const createdAssessments = await prisma.$transaction(async (tx) => {
        const assessments = [];

        for (const participant of participants) {
          // Create the assessment with individual schedule and notaDinas if provided
          const newAssessment = await tx.assessment.create({
            data: {
              ...assessmentData,
              schedule: new Date(participant.schedule),
              participant: {
                connect: { id: participant.participantId },
              },
              ...(notaDinasData && {
                notaDinas: {
                  create: notaDinasData,
                },
              }),
            },
          });

          // Create evaluations for each evaluator
          await tx.evaluation.createMany({
            data: evaluators.map((evaluator) => ({
              assessmentId: newAssessment.id,
              evaluatorId: evaluator.evaluatorId,
              status: "PENDING",
            })),
          });

          // Fetch the complete assessment with relations
          const completeAssessment = await tx.assessment.findUnique({
            where: { id: newAssessment.id },
            include: {
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
              evaluations: {
                include: {
                  evaluator: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      nip: true,
                    },
                  },
                },
              },
            },
          });

          assessments.push(completeAssessment);
        }

        return assessments;
      });

      return {
        createdCount: createdAssessments.length,
        assessments: createdAssessments,
      };
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        "Error creating assessments",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error
      );
    }
  },

  // Add a method to get conflicting schedules
  async checkScheduleConflicts(
    participantId,
    schedule,
    excludeAssessmentId = null
  ) {
    const conflictWindow = {
      start: new Date(schedule),
      end: new Date(new Date(schedule).getTime() + 2 * 60 * 60 * 1000), // 2 hours window
    };

    const where = {
      participantId,
      schedule: {
        gte: conflictWindow.start,
        lte: conflictWindow.end,
      },
      status: {
        notIn: ["CANCELED", "DONE"],
      },
    };

    if (excludeAssessmentId) {
      where.id = { not: excludeAssessmentId };
    }

    const conflicts = await prisma.assessment.findMany({
      where,
      select: {
        id: true,
        schedule: true,
        judul: true,
      },
    });

    return conflicts;
  },

  // Update assessment
  async updateAssessment(id, data) {
    console.log({ data });
    try {
      const assessment = await prisma.assessment.findUnique({
        where: { id },
      });

      if (!assessment) {
        throw new CustomError("Assessment not found", StatusCodes.NOT_FOUND);
      }

      // Prevent updates if assessment is in certain statuses
      const restrictedStatuses = ["DONE", "CANCELED"];
      if (restrictedStatuses.includes(assessment.status)) {
        throw new CustomError(
          `Cannot update assessment in ${assessment.status} status`,
          StatusCodes.BAD_REQUEST
        );
      }

      return await prisma.assessment.update({
        where: { id },
        data,
        include: {
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
          evaluations: {
            include: {
              evaluator: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  nip: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        "Error updating assessment",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error
      );
    }
  },
  async resetAssessmentStatus(id) {
    try {
      const assessment = await prisma.assessment.findUnique({
        where: { id },
      });

      if (!assessment) {
        throw new CustomError("Assessment not found", StatusCodes.NOT_FOUND);
      }

      // Get current assessment with files
      const currentAssessment = await prisma.assessment.findUnique({
        where: { id },
        include: {
          presentationFile: true,
          questionnaireFile: true,
        },
      });

      // Delete physical files if they exist
      const fileDeletionPromises = [];

      // Helper function to attempt file deletion with multiple possible paths
      const attemptFileDeletion = (filePath, type, uploadDir) => {
        console.log(`Attempting to delete ${type} file: ${filePath}`);

        const possiblePaths = [
          // Try stored path directly
          filePath,
          // Try with project root
          path.join(process.cwd(), filePath),
          // Try in specific upload directory
          path.join(uploadDir, path.basename(filePath)),
        ];

        console.log(`Checking possible paths for ${type}:`, possiblePaths);

        // Try to delete from each possible location
        for (const tryPath of possiblePaths) {
          if (fs.existsSync(tryPath)) {
            console.log(`${type} file found at: ${tryPath}`);
            fileDeletionPromises.push(
              unlinkAsync(tryPath).catch((error) =>
                console.error(
                  `Error deleting ${type} file at ${tryPath}:`,
                  error
                )
              )
            );
            // Break after finding and attempting to delete the first occurrence
            break;
          }
        }
      };

      // Delete presentation file if exists
      if (currentAssessment.presentationFile?.filePath) {
        attemptFileDeletion(
          currentAssessment.presentationFile.filePath,
          "presentation",
          uploadsDir.presentation
        );
      }

      // Delete questionnaire file if exists
      if (currentAssessment.questionnaireFile?.filePath) {
        attemptFileDeletion(
          currentAssessment.questionnaireFile.filePath,
          "questionnaire",
          uploadsDir.questionnaire
        );
      }

      // Wait for all file deletions to complete
      await Promise.all(fileDeletionPromises);

      // Update assessment status and disconnect files
      const updatedAssessment = await prisma.$transaction(async (tx) => {
        // Delete file records first
        if (currentAssessment.presentationFile) {
          await tx.file.delete({
            where: { id: currentAssessment.presentationFile.id },
          });
        }
        if (currentAssessment.questionnaireFile) {
          await tx.file.delete({
            where: { id: currentAssessment.questionnaireFile.id },
          });
        }

        // Then update assessment
        return await tx.assessment.update({
          where: { id },
          data: {
            status: "SCHEDULED",
            attendanceConfirmation: false,
            questionnaireResponses: null,
          },
          include: {
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
            evaluations: {
              include: {
                evaluator: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    nip: true,
                  },
                },
              },
            },
          },
        });
      });

      return updatedAssessment;
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        "Error resetting assessment status",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error
      );
    }
  },

  // Update assessment status
  async updateAssessmentStatus(id, status) {
    try {
      const assessment = await prisma.assessment.findUnique({
        where: { id },
        include: {
          evaluations: true,
        },
      });

      if (!assessment) {
        throw new CustomError("Assessment not found", StatusCodes.NOT_FOUND);
      }

      // Status transition validation
      const statusTransitions = {
        CREATED: ["SCHEDULED", "CANCELED"],
        SCHEDULED: ["WAITING_CONFIRMATION", "RESCHEDULE", "CANCELED"],
        WAITING_CONFIRMATION: ["TALENT_REQUIREMENTS", "RESCHEDULE", "CANCELED"],
        TALENT_REQUIREMENTS: ["READY_FOR_ASSESSMENT", "RESCHEDULE", "CANCELED"],
        READY_FOR_ASSESSMENT: ["EVALUATING", "RESCHEDULE", "CANCELED"],
        EVALUATING: ["NEED_REVIEW", "CANCELED"],
        NEED_REVIEW: ["DONE", "EVALUATING", "CANCELED"],
        DONE: [],
        CANCELED: ["CREATED"],
        RESCHEDULE: ["SCHEDULED"],
      };

      const allowedTransitions = statusTransitions[assessment.status];
      if (!allowedTransitions.includes(status)) {
        throw new CustomError(
          `Invalid status transition from ${assessment.status} to ${status}`,
          StatusCodes.BAD_REQUEST
        );
      }

      // Additional validations based on status
      if (status === "EVALUATING") {
        if (assessment.evaluations.length < 1) {
          throw new CustomError(
            "Cannot move to EVALUATING status without evaluators",
            StatusCodes.BAD_REQUEST
          );
        }
      }

      if (status === "DONE") {
        // Check if all evaluations are completed
        const pendingEvaluations = assessment.evaluations.some(
          (evaluation) => evaluation.status !== "COMPLETED"
        );

        if (pendingEvaluations) {
          throw new CustomError(
            "Cannot mark assessment as DONE with pending evaluations",
            StatusCodes.BAD_REQUEST
          );
        }
      }

      return await prisma.assessment.update({
        where: { id },
        data: { status },
        include: {
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
          evaluations: {
            include: {
              evaluator: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  nip: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        "Error updating assessment status",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error
      );
    }
  },

  // Delete assessment
  async deleteAssessment(id) {
    try {
      console.log(`Starting deletion process for assessment ID: ${id}`);

      const assessment = await prisma.assessment.findUnique({
        where: { id },
        include: {
          evaluations: {
            include: {
              evaluationFile: true,
            },
          },
          presentationFile: true,
          questionnaireFile: true,
          notaDinas: true,
        },
      });

      console.log("Found assessment:", assessment ? "Yes" : "No");

      if (!assessment) {
        throw new CustomError("Assessment not found", StatusCodes.NOT_FOUND);
      }

      // Use transaction to ensure all deletions succeed or fail together
      const result = await prisma.$transaction(async (tx) => {
        console.log("Starting database transaction");

        // Delete evaluation files first
        for (const evaluation of assessment.evaluations) {
          if (evaluation.evaluationFile) {
            console.log(
              `Deleting evaluation file ID: ${evaluation.evaluationFile.id}`
            );
            await tx.evaluationFile.delete({
              where: { id: evaluation.evaluationFile.id },
            });
          }
        }

        // Delete evaluations
        console.log(`Deleting evaluations for assessment ID: ${id}`);
        await tx.evaluation.deleteMany({
          where: { assessmentId: id },
        });

        // Delete associated files
        if (assessment.presentationFile) {
          console.log(
            `Deleting presentation file ID: ${assessment.presentationFile.id}`
          );
          await tx.file.delete({
            where: { id: assessment.presentationFile.id },
          });
        }

        if (assessment.questionnaireFile) {
          console.log(
            `Deleting questionnaire file ID: ${assessment.questionnaireFile.id}`
          );
          await tx.file.delete({
            where: { id: assessment.questionnaireFile.id },
          });
        }

        // Delete nota dinas if exists
        if (assessment.notaDinas) {
          console.log(`Deleting nota dinas ID: ${assessment.notaDinas.id}`);
          await tx.notaDinas.delete({
            where: { id: assessment.notaDinas.id },
          });
        }

        // Finally delete the assessment
        console.log(`Deleting assessment ID: ${id}`);
        return await tx.assessment.delete({
          where: { id },
        });
      });

      console.log("Database transaction completed successfully");

      // Delete physical files after successful database transaction
      const fileDeletionPromises = [];

      // Delete evaluation files
      assessment.evaluations.forEach((evaluation) => {
        if (evaluation.evaluationFile && evaluation.evaluationFile.filePath) {
          const filePath = evaluation.evaluationFile.filePath;
          console.log(`Attempting to delete evaluation file: ${filePath}`);

          // Try all possible paths where the file might exist
          const possiblePaths = [
            // Try stored path directly
            filePath,
            // Try with project root
            path.join(process.cwd(), filePath),
            // Try in penilaian directory
            path.join(
              process.cwd(),
              "src",
              "uploads",
              "assesment",
              "penilaian",
              path.basename(filePath)
            ),
          ];

          console.log("Checking possible file paths:", possiblePaths);

          // Try to delete from each possible location
          for (const tryPath of possiblePaths) {
            if (fs.existsSync(tryPath)) {
              console.log(`File found at: ${tryPath}`);
              fileDeletionPromises.push(
                unlinkAsync(tryPath).catch((error) =>
                  console.error(`Error deleting file at ${tryPath}:`, error)
                )
              );
              // Break after finding and attempting to delete the first occurrence
              break;
            }
          }
        }
      });

      // Helper function to attempt file deletion with multiple possible paths
      const attemptFileDeletion = (filePath, type, uploadDir) => {
        console.log(`Attempting to delete ${type} file: ${filePath}`);

        const possiblePaths = [
          // Try stored path directly
          filePath,
          // Try with project root
          path.join(process.cwd(), filePath),
          // Try in specific upload directory
          path.join(uploadDir, path.basename(filePath)),
        ];

        console.log(`Checking possible paths for ${type}:`, possiblePaths);

        // Try to delete from each possible location
        for (const tryPath of possiblePaths) {
          if (fs.existsSync(tryPath)) {
            console.log(`${type} file found at: ${tryPath}`);
            fileDeletionPromises.push(
              unlinkAsync(tryPath).catch((error) =>
                console.error(
                  `Error deleting ${type} file at ${tryPath}:`,
                  error
                )
              )
            );
            // Break after finding and attempting to delete the first occurrence
            break;
          }
        }
      };

      // Delete presentation file
      if (assessment.presentationFile?.filePath) {
        attemptFileDeletion(
          assessment.presentationFile.filePath,
          "presentation",
          uploadsDir.presentation
        );
      }

      // Delete questionnaire file
      if (assessment.questionnaireFile?.filePath) {
        attemptFileDeletion(
          assessment.questionnaireFile.filePath,
          "questionnaire",
          uploadsDir.questionnaire
        );
      }

      // Delete nota dinas file
      if (assessment.notaDinas?.filePath) {
        attemptFileDeletion(
          assessment.notaDinas.filePath,
          "nota dinas",
          uploadsDir.notaDinas
        );
      }

      // Wait for all file deletions to complete
      console.log("Waiting for physical file deletions to complete");
      await Promise.all(fileDeletionPromises);
      console.log("All physical files deleted successfully");

      return result;
    } catch (error) {
      console.error("Error in deleteAssessment:", error);
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        "Error deleting assessment",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error
      );
    }
  },

  async sendInvitation(id) {
    try {
      const assessment = await prisma.assessment.findUnique({
        where: { id },
        include: {
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
      });

      console.log({ assessment });

      if (!assessment) {
        throw new CustomError("Assessment not found", StatusCodes.NOT_FOUND);
      }

      // Check if the assessment is in a valid state to send invitation
      if (assessment.status !== "SCHEDULED") {
        throw new CustomError(
          `Cannot send invitation for assessment in ${assessment.status} status`,
          StatusCodes.BAD_REQUEST
        );
      }

      // Prepare payload for WhatsApp invitation
      const payload = {
        phone: "6287733760363", // Replace with participant's phone number dynamically if available
        template: "fitAndProper",
        templateData: {
          name: assessment.participant.name,
          grade: assessment.participant.proyeksi || "Unknown Grade",
          link: `https://renval.msdm.app/`,
        },
      };

      // Send the invitation via fetch
      const response = await fetch("http://localhost:2200/api/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new CustomError(
          `Failed to send WhatsApp invitation: ${response.statusText}`,
          StatusCodes.BAD_REQUEST,
          errorText
        );
      }

      // Update assessment status to WAITING_CONFIRMATION
      const updatedAssessment = await prisma.assessment.update({
        where: { id },
        data: { status: "WAITING_CONFIRMATION" },
      });

      console.log("Invitation sent successfully");

      return updatedAssessment;
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        "Error sending invitation",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error
      );
    }
  },

  async updateAssessmentSubmission(
    id,
    presentationFileData,
    attendanceConfirmation,
    questionnaireResponses
  ) {
    console.log({ questionnaireResponses });
    try {
      const assessment = await prisma.assessment.findUnique({
        where: { id },
        include: {
          presentationFile: true,
          questionnaireFile: true,
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
      });

      if (!assessment) {
        throw new CustomError("Assessment not found", StatusCodes.NOT_FOUND);
      }

      // Delete existing presentation file if it exists and new file is provided
      if (assessment.presentationFile && presentationFileData) {
        await prisma.file.delete({
          where: { id: assessment.presentationFile.id },
        });

        // Delete physical file with multiple path attempts
        const possiblePaths = [
          // Try stored path directly
          assessment.presentationFile.filePath,
          // Try with project root
          path.join(process.cwd(), assessment.presentationFile.filePath),
          // Try in presentation directory
          path.join(
            uploadsDir.presentation,
            path.basename(assessment.presentationFile.filePath)
          ),
        ];

        for (const tryPath of possiblePaths) {
          if (fs.existsSync(tryPath)) {
            console.log(`Found presentation file at: ${tryPath}`);
            await unlinkAsync(tryPath);
            break;
          }
        }
      }

      // Delete existing questionnaire file if it exists and new responses are provided
      if (assessment.questionnaireFile && questionnaireResponses) {
        await prisma.file.delete({
          where: { id: assessment.questionnaireFile.id },
        });

        // Delete physical file with multiple path attempts
        const possiblePaths = [
          // Try stored path directly
          assessment.questionnaireFile.filePath,
          // Try with project root
          path.join(process.cwd(), assessment.questionnaireFile.filePath),
          // Try in questionnaire directory
          path.join(
            uploadsDir.questionnaire,
            path.basename(assessment.questionnaireFile.filePath)
          ),
        ];

        for (const tryPath of possiblePaths) {
          if (fs.existsSync(tryPath)) {
            console.log(`Found questionnaire file at: ${tryPath}`);
            await unlinkAsync(tryPath);
            break;
          }
        }
      }

      // Generate PDF from questionnaire responses if provided
      let questionnaireFileData;
      if (questionnaireResponses) {
        const pdfResult = await generateQuestionnairePDF(
          questionnaireResponses,
          id,
          assessment.participant
        );
        questionnaireFileData = {
          fileName: pdfResult.filename,
          filePath: pdfResult.filePath,
          fileType: "application/pdf",
        };
      }

      // Update assessment status based on attendanceConfirmation and additional data
      let statusUpdate;
      if (
        attendanceConfirmation &&
        (presentationFileData || assessment.presentationFile) &&
        (questionnaireResponses || assessment.questionnaireFile)
      ) {
        statusUpdate = "READY_FOR_ASSESSMENT";
      } else if (
        attendanceConfirmation ||
        presentationFileData ||
        assessment.presentationFile ||
        questionnaireResponses ||
        assessment.questionnaireFile
      ) {
        statusUpdate = "TALENT_REQUIREMENTS";
      } else {
        statusUpdate = "CANCELED";
      }

      // Update assessment with transaction to ensure data consistency
      const updatedAssessment = await prisma.$transaction(async (tx) => {
        // Create new presentation file record if provided
        let presentationFile = undefined;
        if (presentationFileData) {
          presentationFile = {
            create: presentationFileData,
          };
        }

        // Create new questionnaire file record if provided
        let questionnaireFile = undefined;
        if (questionnaireFileData) {
          questionnaireFile = {
            create: questionnaireFileData,
          };
        }

        // Update assessment
        return await tx.assessment.update({
          where: { id },
          data: {
            attendanceConfirmation,
            status: statusUpdate,
            presentationFile,
            questionnaireFile,
            questionnaireResponses: questionnaireResponses || undefined,
          },
          include: {
            presentationFile: true,
            questionnaireFile: true,
          },
        });
      });

      console.log("Assessment submission updated");

      return updatedAssessment;
    } catch (error) {
      console.log(error);
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        "Error updating assessment submission",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error
      );
    }
  },

  // Update assessment status to 'EVALUATING'
  async startAssessment(id) {
    try {
      const updatedAssessment = await prisma.assessment.update({
        where: { id },
        data: {
          status: "EVALUATING",
        },
      });

      console.log("Assessment status updated to 'EVALUATING'");

      return updatedAssessment;
    } catch (error) {
      console.log(error);
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        "Error updating assessment status to 'EVALUATING'",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error
      );
    }
  },
};
