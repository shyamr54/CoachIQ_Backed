import { Prisma, UserRole } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";

import { asyncHandler } from "../../lib/async-handler";
import { AppError } from "../../lib/errors";
import { prisma } from "../../lib/prisma";
import { sendSuccess } from "../../lib/response";
import { idSchema, phoneSchema } from "../../lib/schemas";
import { requireAuth, requireRoles } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";

const listStudentsQuerySchema = z.object({
  batchId: idSchema.optional(),
  search: z.string().trim().min(1).optional()
});

const bulkStudentsSchema = z
  .array(
    z.object({
      name: z.string().trim().min(1),
      parentPhone: phoneSchema,
      batchId: idSchema.optional(),
      parentName: z.string().trim().optional(),
      rollNumber: z.string().trim().optional()
    })
  )
  .min(1, "At least one student is required");

export const studentsRouter = Router();

studentsRouter.get(
  "/",
  requireAuth,
  validate({ query: listStudentsQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = req.query as z.infer<typeof listStudentsQuerySchema>;
    const where: Prisma.StudentWhereInput = {
      coachingId: req.auth!.coachingId
    };

    if (query.batchId) {
      where.batchId = query.batchId;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { parentName: { contains: query.search } },
        { parentPhone: { contains: query.search } },
        { rollNumber: { contains: query.search } }
      ];
    }

    if (req.auth!.role === UserRole.TEACHER) {
      where.batch = {
        teacherId: req.auth!.userId
      };
    }

    const students = await prisma.student.findMany({
      where,
      orderBy: {
        createdAt: "asc"
      },
      include: {
        batch: {
          select: {
            id: true,
            name: true,
            subject: true
          }
        }
      }
    });

    return sendSuccess(res, students);
  })
);

studentsRouter.post(
  "/bulk",
  requireAuth,
  requireRoles(UserRole.ADMIN),
  validate({ body: bulkStudentsSchema }),
  asyncHandler(async (req, res) => {
    const payload = req.body as z.infer<typeof bulkStudentsSchema>;
    const batchIds = [...new Set(payload.map((item) => item.batchId).filter(Boolean))] as string[];

    if (batchIds.length > 0) {
      const batches = await prisma.batch.findMany({
        where: {
          coachingId: req.auth!.coachingId,
          id: {
            in: batchIds
          }
        },
        select: {
          id: true
        }
      });

      if (batches.length !== batchIds.length) {
        throw new AppError(
          400,
          "One or more batches do not belong to this coaching",
          "TENANT_MISMATCH"
        );
      }
    }

    const createdStudents = await prisma.$transaction(
      payload.map((student) =>
        prisma.student.create({
          data: {
            coachingId: req.auth!.coachingId,
            name: student.name,
            parentName: student.parentName ?? "",
            parentPhone: student.parentPhone,
            rollNumber: student.rollNumber || undefined,
            batchId: student.batchId || undefined
          },
          include: {
            batch: {
              select: {
                id: true,
                name: true,
                subject: true
              }
            }
          }
        })
      )
    );

    return sendSuccess(res, createdStudents, 201);
  })
);

