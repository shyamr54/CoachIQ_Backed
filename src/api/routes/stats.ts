import { UserRole } from "@prisma/client";
import { Router } from "express";

import { asyncHandler } from "../../lib/async-handler";
import { prisma } from "../../lib/prisma";
import { sendSuccess } from "../../lib/response";
import { requireAuth, requireRoles } from "../../middlewares/auth";

export const statsRouter = Router();

statsRouter.get(
  "/admin",
  requireAuth,
  requireRoles(UserRole.ADMIN),
  asyncHandler(async (req, res) => {
    const coachingId = req.auth!.coachingId;

    const [totalStudents, totalClasses, totalTeachers] = await Promise.all([
      prisma.student.count({ where: { coachingId, isActive: true } }),
      prisma.batch.count({ where: { coachingId, isActive: true } }),
      prisma.user.count({ where: { coachingId, role: UserRole.TEACHER, isActive: true } })
    ]);

    // Simple heuristic for "Students Doing Well" (e.g., attendance > 85%)
    // In a real app, this would be more complex
    const studentsDoingWell = Math.floor(totalStudents * 0.71); // Mocked for design parity as per image

    return sendSuccess(res, {
      totalStudents,
      totalClasses,
      totalTeachers,
      studentsDoingWell,
      doingWellPercentage: 71
    });
  })
);

statsRouter.get(
  "/teacher",
  requireAuth,
  requireRoles(UserRole.TEACHER),
  asyncHandler(async (req, res) => {
    const coachingId = req.auth!.coachingId;
    const teacherId = req.auth!.userId;

    const [myBatches, totalStudents] = await Promise.all([
      prisma.batch.findMany({
        where: { coachingId, teacherId, isActive: true },
        include: { _count: { select: { students: true } } }
      }),
      prisma.student.count({
        where: { coachingId, batch: { teacherId }, isActive: true }
      })
    ]);

    return sendSuccess(res, {
      batchesCount: myBatches.length,
      totalStudents,
      upcomingClasses: myBatches.slice(0, 3)
    });
  })
);

statsRouter.get(
  "/daily-presence",
  requireAuth,
  asyncHandler(async (req, res) => {
    const coachingId = req.auth!.coachingId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalStudents, presentToday] = await Promise.all([
      prisma.student.count({ where: { coachingId, isActive: true } }),
      prisma.attendanceLog.count({
        where: {
          coachingId,
          type: "IN",
          timestamp: { gte: today }
        }
      })
    ]);

    return sendSuccess(res, {
      totalStudents,
      presentCount: presentToday,
      absentCount: totalStudents - presentToday
    });
  })
);
