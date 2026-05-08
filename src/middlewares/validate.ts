import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodTypeAny } from "zod";

import { AppError } from "../lib/errors";

interface ValidationSchemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }

      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }

      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new AppError(400, "Request validation failed", "VALIDATION_ERROR", error.flatten()));
        return;
      }

      next(error);
    }
  };
}

