import { Prisma, UserRole } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";

import { asyncHandler } from "../../lib/async-handler";
import { prisma } from "../../lib/prisma";
import { sendSuccess } from "../../lib/response";
import { requireAuth } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";

const listBatchesQuerySchema = z.object({
  isActive: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return undefined;
      }

      return value === "true";
    })
});

const createBatchSchema = z.object({
  name: z.string().trim().min(1),
  subject: z.string().trim().min(1),
  teacherId: z.string().trim().min(1),
  isActive: z.boolean().default(true)
});

export const batchesRouter = Router();

batchesRouter.post(
  "/",
  requireAuth,
  requireRoles(UserRole.ADMIN),
  validate({ body: createBatchSchema }),
  asyncHandler(async (req, res) => {
    const payload = req.body as z.infer<typeof createBatchSchema>;

    const teacher = await prisma.user.findFirst({
      where: {
        id: payload.teacherId,
        coachingId: req.auth!.coachingId,
        role: UserRole.TEACHER
      }
    });

    if (!teacher) {
      throw new AppError(404, "Teacher not found", "TEACHER_NOT_FOUND");
    }

    const batch = await prisma.batch.create({
      data: {
        ...payload,
        coachingId: req.auth!.coachingId
      }
    });

    return sendSuccess(res, batch, 201);
  })
);

batchesRouter.get(
  "/",
  requireAuth,
  validate({ query: listBatchesQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = req.query as z.infer<typeof listBatchesQuerySchema>;
    const where: Prisma.BatchWhereInput = {
      coachingId: req.auth!.coachingId
    };

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (req.auth!.role === UserRole.TEACHER) {
      where.teacherId = req.auth!.userId;
    }

    const batches = await prisma.batch.findMany({
      where,
      orderBy: {
        createdAt: "asc"
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        _count: {
          select: {
            students: true,
            tests: true
          }
        }
      }
    });

    return sendSuccess(res, batches);
  })
);

batchesRouter.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const batch = await prisma.batch.findFirst({
      where: {
        id: req.params.id,
        coachingId: req.auth!.coachingId
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            students: true,
            tests: true
          }
        }
      }
    });

    if (!batch) {
      throw new AppError(404, "Batch not found", "BATCH_NOT_FOUND");
    }

    return sendSuccess(res, batch);
  })
);

