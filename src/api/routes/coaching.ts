import { Router } from "express";

import { asyncHandler } from "../../lib/async-handler";
import { AppError } from "../../lib/errors";
import { prisma } from "../../lib/prisma";
import { sendSuccess } from "../../lib/response";
import { requireAuth } from "../../middlewares/auth";

export const coachingRouter = Router();

coachingRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const coaching = await prisma.coaching.findFirst({
      where: {
        id: req.auth!.coachingId
      }
    });

    if (!coaching) {
      throw new AppError(404, "Coaching profile not found", "TENANT_MISMATCH");
    }

    return sendSuccess(res, coaching);
  })
);

