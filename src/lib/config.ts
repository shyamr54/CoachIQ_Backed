import "dotenv/config";

import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().default("file:./dev.db"),
  UPLOADS_DIR: z.string().default("uploads"),
  JWT_SECRET: z.string().min(1),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("*"),
  OTP_TTL_SECONDS: z.coerce.number().int().positive().default(300),
  EXPOSE_DEBUG_OTP: z
    .string()
    .default("false")
    .transform((value) => value.toLowerCase() === "true"),
  BOOTSTRAP_DEMO_DATA: z
    .string()
    .default("true")
    .transform((value) => value.toLowerCase() === "true"),
  BOOTSTRAP_COACHING_NAME: z.string().default("CoachIQ Demo Coaching"),
  BOOTSTRAP_OWNER_NAME: z.string().default("Demo Owner"),
  BOOTSTRAP_COACHING_PHONE: z.string().default("9999999999"),
  BOOTSTRAP_ADMIN_NAME: z.string().default("Admin User"),
  BOOTSTRAP_ADMIN_PHONE: z.string().default("9999999999"),
  BOOTSTRAP_TEACHER_NAME: z.string().default("Aman Sir"),
  BOOTSTRAP_TEACHER_PHONE: z.string().default("9999999998"),
  BOOTSTRAP_GATE_NAME: z.string().default("Gate Operator"),
  BOOTSTRAP_GATE_PHONE: z.string().default("9999999997"),
  BOOTSTRAP_STUDENT_NAME: z.string().default("Rahul Sharma"),
  BOOTSTRAP_STUDENT_PARENT_NAME: z.string().default("Suresh Sharma"),
  BOOTSTRAP_STUDENT_PARENT_PHONE: z.string().default("9999999996")
});

const parsed = envSchema.parse(process.env);

export const config = {
  nodeEnv: parsed.NODE_ENV,
  port: parsed.PORT,
  databaseUrl: parsed.DATABASE_URL,
  uploadsDir: parsed.UPLOADS_DIR,
  jwtSecret: parsed.JWT_SECRET,
  jwtExpiresIn: parsed.JWT_EXPIRES_IN,
  corsOrigin: parsed.CORS_ORIGIN,
  otpTtlSeconds: parsed.OTP_TTL_SECONDS,
  exposeDebugOtp: parsed.EXPOSE_DEBUG_OTP,
  bootstrapDemoData: parsed.BOOTSTRAP_DEMO_DATA,
  bootstrapCoachingName: parsed.BOOTSTRAP_COACHING_NAME,
  bootstrapOwnerName: parsed.BOOTSTRAP_OWNER_NAME,
  bootstrapCoachingPhone: parsed.BOOTSTRAP_COACHING_PHONE,
  bootstrapAdminName: parsed.BOOTSTRAP_ADMIN_NAME,
  bootstrapAdminPhone: parsed.BOOTSTRAP_ADMIN_PHONE,
  bootstrapTeacherName: parsed.BOOTSTRAP_TEACHER_NAME,
  bootstrapTeacherPhone: parsed.BOOTSTRAP_TEACHER_PHONE,
  bootstrapGateName: parsed.BOOTSTRAP_GATE_NAME,
  bootstrapGatePhone: parsed.BOOTSTRAP_GATE_PHONE,
  bootstrapStudentName: parsed.BOOTSTRAP_STUDENT_NAME,
  bootstrapStudentParentName: parsed.BOOTSTRAP_STUDENT_PARENT_NAME,
  bootstrapStudentParentPhone: parsed.BOOTSTRAP_STUDENT_PARENT_PHONE
} as const;
