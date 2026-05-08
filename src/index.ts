import type { Server } from "node:http";

import { app } from "./app";
import { config } from "./lib/config";
import { bootstrapDemoData } from "./lib/bootstrap";
import { prisma } from "./lib/prisma";

let server: Server | undefined;

async function shutdown(signal: string) {
  console.log(`Received ${signal}, shutting down CoachIQ backend`);

  if (server) {
    await new Promise<void>((resolve, reject) => {
      server!.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }

  await prisma.$disconnect();
  process.exit(0);
}

async function start() {
  await prisma.$connect();
  await bootstrapDemoData(prisma);

  server = app.listen(config.port, () => {
    console.log(`CoachIQ backend listening on port ${config.port}`);
  });

  server.on("error", async (error) => {
    console.error("Failed to bind CoachIQ backend listener", error);
    await prisma.$disconnect();
    process.exit(1);
  });
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    void shutdown(signal);
  });
}

void start().catch(async (error) => {
  console.error("Failed to start CoachIQ backend", error);
  await prisma.$disconnect();
  process.exit(1);
});
