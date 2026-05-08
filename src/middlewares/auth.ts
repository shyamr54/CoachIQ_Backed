import { UserRole } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { AppError } from "../lib/errors";
import { verifyToken } from "../lib/jwt";
import { prisma } from "../lib/prisma";

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    next(new AppError(401, "Authentication required", "AUTH_REQUIRED"));
    return;
  }

  const token = authorization.slice("Bearer ".length).trim();

  try {
    const payload = verifyToken(token);
    const user = await prisma.user.findFirst({
      where: {
        id: payload.userId,
        coachingId: payload.coachingId,
        isActive: true
      },
      select: {
        id: true,
        coachingId: true,
        role: true,
        name: true,
        phone: true
      }
    });

    if (!user) {
      next(new AppError(401, "Active user not found", "AUTH_REQUIRED"));
      return;
    }

    req.auth = {
      userId: user.id,
      coachingId: user.coachingId,
      role: user.role,
      name: user.name,
      phone: user.phone
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new AppError(401, "JWT is expired", "AUTH_EXPIRED"));
      return;
    }

    next(new AppError(401, "Invalid authentication token", "AUTH_REQUIRED"));
  }
}

export function requireRoles(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) {
      next(new AppError(401, "Authentication required", "AUTH_REQUIRED"));
      return;
    }

    if (!roles.includes(req.auth.role)) {
      next(new AppError(403, "You do not have permission for this action", "FORBIDDEN"));
      return;
    }

    next();
  };
}

