import "dotenv/config";

import { bootstrapDemoData } from "../src/lib/bootstrap";
import { prisma } from "../src/lib/prisma";

async function main() {
  await prisma.$connect();
  await bootstrapDemoData(prisma);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
