import { PrismaClient, UserRole } from "@prisma/client";

import { config } from "./config";

export async function bootstrapDemoData(prisma: PrismaClient) {
  if (!config.bootstrapDemoData) {
    return;
  }

  const existingCoachingCount = await prisma.coaching.count();

  if (existingCoachingCount > 0) {
    return;
  }

  const coaching = await prisma.coaching.create({
    data: {
      name: config.bootstrapCoachingName,
      ownerName: config.bootstrapOwnerName,
      phone: config.bootstrapCoachingPhone,
      timezone: "Asia/Kolkata"
    }
  });

  await prisma.user.create({
    data: {
      coachingId: coaching.id,
      name: config.bootstrapAdminName,
      phone: config.bootstrapAdminPhone,
      role: UserRole.ADMIN
    }
  });

  const teacher = await prisma.user.create({
    data: {
      coachingId: coaching.id,
      name: config.bootstrapTeacherName,
      phone: config.bootstrapTeacherPhone,
      role: UserRole.TEACHER
    }
  });

  await prisma.user.create({
    data: {
      coachingId: coaching.id,
      name: config.bootstrapGateName,
      phone: config.bootstrapGatePhone,
      role: UserRole.GATE
    }
  });

  const batch = await prisma.batch.create({
    data: {
      coachingId: coaching.id,
      name: "Batch A",
      subject: "Mathematics",
      teacherId: teacher.id
    }
  });

  await prisma.student.create({
    data: {
      coachingId: coaching.id,
      name: config.bootstrapStudentName,
      parentName: config.bootstrapStudentParentName,
      parentPhone: config.bootstrapStudentParentPhone,
      rollNumber: "A-01",
      batchId: batch.id
    }
  });

  console.log(`Bootstrapped demo tenant for ${coaching.name}`);
}

