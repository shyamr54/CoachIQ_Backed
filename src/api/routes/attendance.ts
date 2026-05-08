import { AttendanceType, UserRole } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";

import { asyncHandler } from "../../lib/async-handler";
import { AppError } from "../../lib/errors";
import { prisma } from "../../lib/prisma";
import { sendSuccess } from "../../lib/response";
import { idSchema } from "../../lib/schemas";
import { requireAuth, requireRoles } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";

const attendanceSchema = z.object({
  studentId: idSchema
});

export const attendanceRouter = Router();

function createAttendanceRoute(type: AttendanceType) {
  return asyncHandler(async (req, res) => {
    const { studentId } = req.body as z.infer<typeof attendanceSchema>;
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        coachingId: req.auth!.coachingId,
        isActive: true
      },
      select: {
        id: true,
        name: true
      }
    });

    if (!student) {
      throw new AppError(404, "Student not found in this coaching", "TENANT_MISMATCH");
    }

    const attendanceLog = await prisma.attendanceLog.create({
      data: {
        coachingId: req.auth!.coachingId,
        studentId: student.id,
        type,
        source: req.auth!.role === UserRole.GATE ? "gate" : "admin"
      }
    });

    return sendSuccess(res, attendanceLog, 201);
  });
}

attendanceRouter.post(
  "/in",
  requireAuth,
  requireRoles(UserRole.ADMIN, UserRole.GATE),
  validate({ body: attendanceSchema }),
  createAttendanceRoute(AttendanceType.IN)
);

attendanceRouter.post(
  "/out",
  requireAuth,
  requireRoles(UserRole.ADMIN, UserRole.GATE),
  validate({ body: attendanceSchema }),
  createAttendanceRoute(AttendanceType.OUT)
);

