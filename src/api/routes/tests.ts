import { UserRole } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";

import { asyncHandler } from "../../lib/async-handler";
import { parseAcademicDate } from "../../lib/date";
import { AppError } from "../../lib/errors";
import { prisma } from "../../lib/prisma";
import { sendSuccess } from "../../lib/response";
import { dateOnlySchema, idSchema } from "../../lib/schemas";
import { requireAuth, requireRoles } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";

const createTestSchema = z.object({
  batchId: idSchema,
  subject: z.string().trim().min(1),
  testDate: dateOnlySchema,
  maxMarks: z.number().int().positive()
});

const markEntrySchema = z
  .array(
    z.object({
      studentId: idSchema,
      marksObtained: z.number().min(0),
      remarks: z.string().trim().optional()
    })
  )
  .min(1, "At least one mark entry is required");

const testParamsSchema = z.object({
  testId: idSchema
});

export const testsRouter = Router();

testsRouter.post(
  "/",
  requireAuth,
  requireRoles(UserRole.ADMIN, UserRole.TEACHER),
  validate({ body: createTestSchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof createTestSchema>;
    const batch = await prisma.batch.findFirst({
      where: {
        id: body.batchId,
        coachingId: req.auth!.coachingId
      },
      select: {
        id: true,
        teacherId: true
      }
    });

    if (!batch) {
      throw new AppError(404, "Batch not found in this coaching", "TENANT_MISMATCH");
    }

    if (req.auth!.role === UserRole.TEACHER && batch.teacherId !== req.auth!.userId) {
      throw new AppError(403, "Teachers can only create tests for their own batches", "FORBIDDEN");
    }

    const test = await prisma.test.create({
      data: {
        coachingId: req.auth!.coachingId,
        batchId: body.batchId,
        subject: body.subject,
        testDate: parseAcademicDate(body.testDate),
        maxMarks: body.maxMarks
      }
    });

    return sendSuccess(res, test, 201);
  })
);

testsRouter.post(
  "/:testId/marks",
  requireAuth,
  requireRoles(UserRole.ADMIN, UserRole.TEACHER),
  validate({ params: testParamsSchema, body: markEntrySchema }),
  asyncHandler(async (req, res) => {
    const { testId } = req.params as z.infer<typeof testParamsSchema>;
    const entries = req.body as z.infer<typeof markEntrySchema>;
    const test = await prisma.test.findFirst({
      where: {
        id: testId,
        coachingId: req.auth!.coachingId
      },
      include: {
        batch: {
          select: {
            teacherId: true
          }
        }
      }
    });

    if (!test) {
      throw new AppError(404, "Test not found in this coaching", "TENANT_MISMATCH");
    }

    if (req.auth!.role === UserRole.TEACHER && test.batch.teacherId !== req.auth!.userId) {
      throw new AppError(403, "Teachers can only update marks for their own batches", "FORBIDDEN");
    }

    const tooLargeEntry = entries.find((entry) => entry.marksObtained > test.maxMarks);

    if (tooLargeEntry) {
      throw new AppError(
        400,
        `Marks for student ${tooLargeEntry.studentId} exceed the test maximum`,
        "VALIDATION_ERROR"
      );
    }

    const studentIds = [...new Set(entries.map((entry) => entry.studentId))];
    const students = await prisma.student.findMany({
      where: {
        coachingId: req.auth!.coachingId,
        batchId: test.batchId,
        id: {
          in: studentIds
        }
      },
      select: {
        id: true
      }
    });

    if (students.length !== studentIds.length) {
      throw new AppError(
        400,
        "All students must belong to the test batch inside the same coaching",
        "TENANT_MISMATCH"
      );
    }

    const savedMarks = await prisma.$transaction(
      entries.map((entry) =>
        prisma.mark.upsert({
          where: {
            coachingId_testId_studentId: {
              coachingId: req.auth!.coachingId,
              testId,
              studentId: entry.studentId
            }
          },
          create: {
            coachingId: req.auth!.coachingId,
            testId,
            studentId: entry.studentId,
            marksObtained: entry.marksObtained,
            remarks: entry.remarks || undefined
          },
          update: {
            marksObtained: entry.marksObtained,
            remarks: entry.remarks || undefined
          }
        })
      )
    );

    return sendSuccess(res, savedMarks);
  })
);

testsRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { batchId } = req.query;
    const where: any = { coachingId: req.auth!.coachingId };
    
    if (batchId) {
      where.batchId = batchId as string;
    }

    if (req.auth!.role === UserRole.TEACHER) {
      where.batch = { teacherId: req.auth!.userId };
    }

    const tests = await prisma.test.findMany({
      where,
      orderBy: { testDate: "desc" },
      include: {
        batch: {
          select: { name: true, subject: true }
        }
      }
    });

    return sendSuccess(res, tests);
  })
);

testsRouter.get(
  "/:testId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const test = await prisma.test.findFirst({
      where: {
        id: req.params.testId,
        coachingId: req.auth!.coachingId
      },
      include: {
        batch: true
      }
    });

    if (!test) {
      throw new AppError(404, "Test not found", "TEST_NOT_FOUND");
    }

    return sendSuccess(res, test);
  })
);

