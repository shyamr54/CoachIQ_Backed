import { UserRole } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        coachingId: string;
        role: UserRole;
        name: string;
        phone: string;
      };
    }
  }
}

export {};

