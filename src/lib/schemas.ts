import { z } from "zod";

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\d{10}$/, "Phone must be a 10-digit number");

export const idSchema = z.string().uuid("Invalid UUID");

export const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

