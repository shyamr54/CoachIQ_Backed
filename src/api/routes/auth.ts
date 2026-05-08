import { Router } from "express";
import { z } from "zod";

import { asyncHandler } from "../../lib/async-handler";
import { config } from "../../lib/config";
import { AppError } from "../../lib/errors";
import { signToken } from "../../lib/jwt";
import { issueOtp, verifyOtp } from "../../lib/otp-store";
import { prisma } from "../../lib/prisma";
import { sendSuccess } from "../../lib/response";
import { phoneSchema } from "../../lib/schemas";
import { validate } from "../../middlewares/validate";

const requestOtpSchema = z.object({
  phone: phoneSchema
});

const verifyOtpSchema = z.object({
  phone: phoneSchema,
  otp: z.string().regex(/^\d{6}$/, "OTP must be a 6-digit code")
});

export const authRouter = Router();

authRouter.post(
  "/request-otp",
  validate({ body: requestOtpSchema }),
  asyncHandler(async (req, res) => {
    const { phone } = req.body as z.infer<typeof requestOtpSchema>;
    const user = await prisma.user.findUnique({
      where: { phone },
      select: {
        id: true,
        isActive: true
      }
    });

    if (!user || !user.isActive) {
      throw new AppError(404, "No active user found for this phone number", "USER_NOT_FOUND");
    }

    const otpPayload = issueOtp(phone);
    console.log(`[OTP][DEV] ${phone} => ${otpPayload.otp}`);

    return sendSuccess(res, {
      phone,
      expiresInSeconds: otpPayload.ttlSeconds,
      debugOtp: config.exposeDebugOtp ? otpPayload.otp : undefined
    });
  })
);


authRouter.post(
  "/verify-otp",
  validate({ body: verifyOtpSchema }),
  asyncHandler(async (req, res) => {
    const { phone, otp } = req.body as z.infer<typeof verifyOtpSchema>;

    if (!verifyOtp(phone, otp)) {
      throw new AppError(400, "Invalid or expired OTP", "INVALID_OTP");
    }

    const user = await prisma.user.findUnique({
      where: { phone },
      select: {
        id: true,
        coachingId: true,
        name: true,
        role: true,
        phone: true,
        isActive: true
      }
    });

    if (!user || !user.isActive) {
      throw new AppError(404, "No active user found for this phone number", "USER_NOT_FOUND");
    }

    const token = signToken({
      userId: user.id,
      coachingId: user.coachingId,
      role: user.role,
      name: user.name,
      phone: user.phone
    });

    return sendSuccess(res, {
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        coachingId: user.coachingId
      }
    });
  })
);
