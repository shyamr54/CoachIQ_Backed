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

export const batchesRouter = Router();

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

