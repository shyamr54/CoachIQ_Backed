import { Prisma, UserRole } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";

import { asyncHandler } from "../../lib/async-handler";
import { formatTestName, getMonthRange } from "../../lib/date";
import { AppError } from "../../lib/errors";
import { prisma } from "../../lib/prisma";
import { sendSuccess } from "../../lib/response";
import { idSchema } from "../../lib/schemas";
import { requireAuth } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";

const reportParamsSchema = z.object({
  id: idSchema
});

const reportQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100)
});

export const reportsRouter = Router();

reportsRouter.get(
  "/student/:id",
  requireAuth,
  validate({ params: reportParamsSchema, query: reportQuerySchema }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as z.infer<typeof reportParamsSchema>;
    const { month, year } = req.query as unknown as z.infer<typeof reportQuerySchema>;
    const range = getMonthRange(month, year);
    const where: Prisma.StudentWhereInput = {
      id,
      coachingId: req.auth!.coachingId
    };

    if (req.auth!.role === UserRole.TEACHER) {
      where.batch = {
        teacherId: req.auth!.userId
      };
    }

    const student = await prisma.student.findFirst({
      where,
      select: {
        id: true,
        name: true,
        marks: {
          where: {
            coachingId: req.auth!.coachingId,
            test: {
              testDate: {
                gte: range.start,
                lt: range.end
              }
            }
          },
          orderBy: {
            createdAt: "asc"
          },
          select: {
            marksObtained: true,
            test: {
              select: {
                subject: true,
                testDate: true,
                maxMarks: true
              }
            }
          }
        },
        attendance: {
          where: {
            coachingId: req.auth!.coachingId,
            timestamp: {
              gte: range.start,
              lt: range.end
            }
          },
          orderBy: {
            timestamp: "asc"
          },
          select: {
            type: true
          }
        }
      }
    });

    if (!student) {
      throw new AppError(404, "Student not found in this coaching", "TENANT_MISMATCH");
    }

    const marksHistory = student.marks.map((mark) => ({
      testName: formatTestName(mark.test.subject, mark.test.testDate),
      marks: mark.marksObtained
    }));

    const academicPerformance =
      student.marks.length === 0
        ? null
        : Number(
            (
              student.marks.reduce((total, mark) => {
                return total + (mark.marksObtained / mark.test.maxMarks) * 100;
              }, 0) / student.marks.length
            ).toFixed(2)
          );

    const hasIn = student.attendance.some((entry) => entry.type === "IN");
    const hasOut = student.attendance.some((entry) => entry.type === "OUT");

    const attendanceStatus =
      student.attendance.length === 0 ? "no-records" : hasIn && hasOut ? "complete" : "partial";

    return sendSuccess(res, {
      studentName: student.name,
      academicPerformance,
      attendanceStatus,
      marksHistory
    });
  })
);
