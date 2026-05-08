import { Router } from "express";

import { attendanceRouter } from "./attendance";
import { authRouter } from "./auth";
import { batchesRouter } from "./batches";
import { coachingRouter } from "./coaching";
import { reportsRouter } from "./reports";
import { studentsRouter } from "./students";
import { testsRouter } from "./tests";
import { usersRouter } from "./users";
import { statsRouter } from "./stats";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: "ok"
    },
    error: null
  });
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/coaching", coachingRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/batches", batchesRouter);
apiRouter.use("/students", studentsRouter);
apiRouter.use("/tests", testsRouter);
apiRouter.use("/attendance", attendanceRouter);
apiRouter.use("/reports", reportsRouter);
apiRouter.use("/stats", statsRouter);

