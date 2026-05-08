import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import { ZodError } from "zod";

import { AppError } from "../lib/errors";

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      data: null,
      error: {
        message: error.message,
        code: error.code,
        details: error.details ?? null
      }
    });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      data: null,
      error: {
        message: "Request validation failed",
        code: "VALIDATION_ERROR",
        details: error.flatten()
      }
    });
    return;
  }

  if (error instanceof jwt.TokenExpiredError) {
    res.status(401).json({
      success: false,
      data: null,
      error: {
        message: "JWT is expired",
        code: "AUTH_EXPIRED",
        details: null
      }
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    res.status(400).json({
      success: false,
      data: null,
      error: {
        message: "Database request failed",
        code: "DATABASE_ERROR",
        details: {
          prismaCode: error.code,
          meta: error.meta ?? null
        }
      }
    });
    return;
  }

  console.error(error);

  res.status(500).json({
    success: false,
    data: null,
    error: {
      message: "Unexpected server error",
      code: "INTERNAL_SERVER_ERROR",
      details: null
    }
  });
}

