import { prisma } from "../config/prisma.js";
import { CustomError } from "../utils/customError.js";
import { StatusCodes } from "http-status-codes";

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
  async createAssessment(data) {
    try {
      const { assessment, evaluators } = data;
      const { participants, ...assessmentData } = assessment;

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
          // Create the assessment with individual schedule
          const newAssessment = await tx.assessment.create({
            data: {
              ...assessmentData,
              schedule: new Date(participant.schedule),
              participant: {
                connect: { id: participant.participantId },
              },
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
    const assessment = await prisma.assessment.findUnique({
      where: { id },
    });

    if (!assessment) {
      throw new CustomError("Assessment not found", StatusCodes.NOT_FOUND);
    }

    // Delete associated evaluations first
    await prisma.evaluation.deleteMany({
      where: { assessmentId: id },
    });

    // Then delete the assessment
    return await prisma.assessment.delete({
      where: { id },
    });
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
    presentationFile,
    attendanceConfirmation,
    questionnaireResponses
  ) {
    try {
      const assessment = await prisma.assessment.findUnique({
        where: { id },
      });

      if (!assessment) {
        throw new CustomError("Assessment not found", StatusCodes.NOT_FOUND);
      }

      console.log({ attendanceConfirmation });

      // Update assessment status based on attendanceConfirmation and additional data
      let statusUpdate;
      if (
        attendanceConfirmation &&
        presentationFile &&
        questionnaireResponses
      ) {
        statusUpdate = "READY_FOR_ASSESSMENT";
      } else if (attendanceConfirmation) {
        statusUpdate = "TALENT_REQUIREMENTS";
      } else {
        statusUpdate = "CANCELED";
      }

      // Update assessment status and additional fields
      const updatedAssessment = await prisma.assessment.update({
        where: { id },
        data: {
          attendanceConfirmation,
          status: statusUpdate,
          presentationFile: presentationFile
            ? presentationFile
            : assessment.presentationFile,
          questionnaireResponses: questionnaireResponses
            ? questionnaireResponses
            : assessment.questionnaireResponses,
        },
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
