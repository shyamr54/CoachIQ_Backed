import { UserRole } from "@prisma/client";
import jwt, { type SignOptions } from "jsonwebtoken";

import { config } from "./config";

export interface AuthTokenPayload {
  userId: string;
  coachingId: string;
  role: UserRole;
  name: string;
  phone: string;
}

export function signToken(payload: AuthTokenPayload) {
  const options: SignOptions = {
    expiresIn: config.jwtExpiresIn as SignOptions["expiresIn"]
  };

  return jwt.sign(payload, config.jwtSecret, options);
}

export function verifyToken(token: string) {
  return jwt.verify(token, config.jwtSecret) as AuthTokenPayload;
}
