import { Router } from "express";
import { UserRole } from "@prisma/client";

import { asyncHandler } from "../../lib/async-handler";
import { prisma } from "../../lib/prisma";
import { sendSuccess } from "../../lib/response";
import { requireAuth, requireRoles } from "../../middlewares/auth";

export const usersRouter = Router();

usersRouter.get(
  "/",
  requireAuth,
  requireRoles(UserRole.ADMIN),
  asyncHandler(async (req, res) => {
    const users = await prisma.user.findMany({
      where: {
        coachingId: req.auth!.coachingId
      },
      orderBy: {
        createdAt: "asc"
      },
      select: {
        id: true,
        coachingId: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        fcmToken: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return sendSuccess(res, users);
  })
);

