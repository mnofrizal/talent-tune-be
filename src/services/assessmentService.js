import { prisma } from "../config/prisma.js";
import { CustomError } from "../utils/customError.js";
import { StatusCodes } from "http-status-codes";
import { ERROR_MESSAGES } from "../config/constants.js";
import { calculateExpiryDate } from "../utils/dateUtils.js";

export const assessmentService = {
  getAssessments: async (user) => {
    try {
      const baseParticipantInclude = {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            nip: true,
            jabatan: true,
            bidang: true,
          },
        },
        assessmentRole: true,
      };

      // If user is ADMINISTRATOR, return all assessments with all participants
      if (user.systemRole === "ADMINISTRATOR") {
        return await prisma.assessment.findMany({
          include: {
            participants: {
              include: baseParticipantInclude,
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        });
      }

      // For regular users, return assessments where they are a participant
      // but only show their own data and evaluators
      return await prisma.assessment.findMany({
        where: {
          participants: {
            some: {
              userId: user.id,
            },
          },
        },
        include: {
          participants: {
            where: {
              OR: [
                { userId: user.id }, // Include user's own data
                { assessmentRole: { name: "EVALUATOR" } }, // Include all evaluators
              ],
            },
            include: baseParticipantInclude,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } catch (error) {
      throw new CustomError(
        "Failed to fetch assessments",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  },

  getAssessmentById: async (id, user) => {
    try {
      const baseParticipantInclude = {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            nip: true,
            jabatan: true,
            bidang: true,
          },
        },
        assessmentRole: true,
        submission: true,

        evaluationsGiven: true,

        evaluationsReceived: true,
      };

      const assessment = await prisma.assessment.findUnique({
        where: { id: parseInt(id) },
        include: {
          participants: {
            include: baseParticipantInclude,
          },
        },
      });

      if (!assessment) {
        throw new CustomError(
          ERROR_MESSAGES.ASSESSMENT.NOT_FOUND,
          StatusCodes.NOT_FOUND
        );
      }

      // If user is not ADMINISTRATOR, filter participants
      if (user.systemRole !== "ADMINISTRATOR") {
        const isParticipant = assessment.participants.some(
          (p) => p.userId === user.id
        );
        if (!isParticipant) {
          throw new CustomError(
            ERROR_MESSAGES.AUTH.UNAUTHORIZED,
            StatusCodes.FORBIDDEN
          );
        }

        // Filter participants to only show user's own data and evaluators
        assessment.participants = assessment.participants.filter(
          (p) => p.userId === user.id || p.assessmentRole.name === "EVALUATOR"
        );
      }

      return assessment;
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        "Failed to fetch assessment",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  },

  createAssessment: async ({ assessment, participants }) => {
    try {
      return await prisma.$transaction(async (prisma) => {
        // Create the assessment
        const createdAssessment = await prisma.assessment.create({
          data: {
            ...assessment,
            participants: {
              create: participants.map((participant) => {
                const data = {
                  userId: participant.userId,
                  assessmentRoleId: participant.assessmentRoleId,
                  participantStatus:
                    participant.assessmentRoleId === 1 ? "CREATED" : null,
                };

                // Only set schedule and expiredDate for participants with a schedule
                if (participant.schedule) {
                  const scheduleDate = new Date(participant.schedule);
                  data.schedule = scheduleDate;
                  data.expiredDate = calculateExpiryDate(scheduleDate);
                }

                return data;
              }),
            },
          },
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    nip: true,
                    jabatan: true,
                    bidang: true,
                  },
                },
                assessmentRole: true,
              },
            },
          },
        });

        return createdAssessment;
      });
    } catch (error) {
      // console.log(error);
      if (error.code === "P2002") {
        throw new CustomError(
          ERROR_MESSAGES.ASSESSMENT.PARTICIPANT_EXISTS,
          StatusCodes.CONFLICT
        );
      }
      throw new CustomError(error, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  },

  updateParticipantSchedule: async (
    assessmentId,
    participantId,
    scheduleDate
  ) => {
    try {
      const participant = await prisma.assessmentParticipant.findFirst({
        where: {
          id: parseInt(participantId),
          assessmentId: parseInt(assessmentId),
        },
        include: {
          assessmentRole: true,
        },
      });

      if (!participant) {
        throw new CustomError(
          ERROR_MESSAGES.ASSESSMENT.PARTICIPANT_NOT_FOUND,
          StatusCodes.NOT_FOUND
        );
      }

      // Check if the participant is actually a participant (not an evaluator)
      if (participant.assessmentRole.name !== "PARTICIPANT") {
        throw new CustomError(
          ERROR_MESSAGES.ASSESSMENT.SCHEDULE_UPDATE_NOT_ALLOWED,
          StatusCodes.BAD_REQUEST
        );
      }

      const schedule = new Date(scheduleDate);
      const expiredDate = calculateExpiryDate(schedule);

      return await prisma.assessmentParticipant.update({
        where: { id: parseInt(participantId) },
        data: {
          schedule,
          expiredDate,
          participantStatus: "SCHEDULED",
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              nip: true,
              jabatan: true,
              bidang: true,
            },
          },
          assessmentRole: true,
        },
      });
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        "Failed to update participant schedule",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  },

  deleteAssessment: async (id) => {
    try {
      await prisma.assessment.delete({
        where: { id: parseInt(id) },
      });
    } catch (error) {
      if (error.code === "P2025") {
        throw new CustomError(
          ERROR_MESSAGES.ASSESSMENT.NOT_FOUND,
          StatusCodes.NOT_FOUND
        );
      }
      throw new CustomError(
        "Failed to delete assessment",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  },

  updateParticipantStatus: async (assessmentId, participantId, status) => {
    try {
      const participant = await prisma.assessmentParticipant.findFirst({
        where: {
          id: parseInt(participantId),
          assessmentId: parseInt(assessmentId),
        },
        include: {
          assessmentRole: true,
        },
      });

      if (!participant) {
        throw new CustomError(
          ERROR_MESSAGES.ASSESSMENT.PARTICIPANT_NOT_FOUND,
          StatusCodes.NOT_FOUND
        );
      }

      // Check if the participant is actually a participant (not an evaluator)
      if (participant.assessmentRole.name !== "PARTICIPANT") {
        throw new CustomError(
          ERROR_MESSAGES.ASSESSMENT.STATUS_UPDATE_NOT_ALLOWED,
          StatusCodes.BAD_REQUEST
        );
      }

      return await prisma.assessmentParticipant.update({
        where: { id: parseInt(participantId) },
        data: { participantStatus: status },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              nip: true,
              jabatan: true,
              bidang: true,
            },
          },
          assessmentRole: true,
        },
      });
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        "Failed to update participant status",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  },

  addParticipant: async (assessmentId, participantData) => {
    try {
      const assessment = await prisma.assessment.findUnique({
        where: { id: parseInt(assessmentId) },
      });

      if (!assessment) {
        throw new CustomError(
          ERROR_MESSAGES.ASSESSMENT.NOT_FOUND,
          StatusCodes.NOT_FOUND
        );
      }

      const existingParticipant = await prisma.assessmentParticipant.findFirst({
        where: {
          assessmentId: parseInt(assessmentId),
          userId: participantData.userId,
        },
      });

      if (existingParticipant) {
        throw new CustomError(
          ERROR_MESSAGES.ASSESSMENT.PARTICIPANT_EXISTS,
          StatusCodes.CONFLICT
        );
      }

      const assessmentRole = await prisma.assessmentRole.findUnique({
        where: { id: participantData.assessmentRoleId },
      });

      if (!assessmentRole) {
        throw new CustomError(
          ERROR_MESSAGES.ASSESSMENT.ROLE_NOT_FOUND,
          StatusCodes.NOT_FOUND
        );
      }

      const data = {
        assessmentId: parseInt(assessmentId),
        userId: participantData.userId,
        assessmentRoleId: participantData.assessmentRoleId,
        participantStatus:
          assessmentRole.name === "PARTICIPANT" ? "CREATED" : null,
      };

      // Add schedule and expiredDate if provided and it's a participant
      if (participantData.schedule && assessmentRole.name === "PARTICIPANT") {
        const scheduleDate = new Date(participantData.schedule);
        data.schedule = scheduleDate;
        data.expiredDate = calculateExpiryDate(scheduleDate);
        data.participantStatus = "SCHEDULED";
      }

      const participant = await prisma.assessmentParticipant.create({
        data,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              nip: true,
              jabatan: true,
              bidang: true,
            },
          },
          assessmentRole: true,
        },
      });

      return participant;
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        "Failed to add participant",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  },

  removeParticipant: async (assessmentId, participantId) => {
    try {
      const participant = await prisma.assessmentParticipant.findFirst({
        where: {
          id: parseInt(participantId),
          assessmentId: parseInt(assessmentId),
        },
      });

      if (!participant) {
        throw new CustomError(
          ERROR_MESSAGES.ASSESSMENT.PARTICIPANT_NOT_FOUND,
          StatusCodes.NOT_FOUND
        );
      }

      await prisma.assessmentParticipant.delete({
        where: { id: parseInt(participantId) },
      });
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        "Failed to remove participant",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  },
};
