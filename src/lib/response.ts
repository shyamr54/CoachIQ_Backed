import type { Response } from "express";

export function sendSuccess<T>(res: Response, data: T, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
    error: null
  });
}

export function sendNoContent(res: Response, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data: null,
    error: null
  });
}

