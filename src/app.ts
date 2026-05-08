import cors from "cors";
import express from "express";
import path from "node:path";

import { apiRouter } from "./api/routes";
import { config } from "./lib/config";
import { errorHandler } from "./middlewares/error-handler";
import { notFoundHandler } from "./middlewares/not-found";

export const app = express();
const uploadsPath = path.isAbsolute(config.uploadsDir)
  ? config.uploadsDir
  : path.resolve(process.cwd(), config.uploadsDir);

const corsOrigin =
  config.corsOrigin === "*"
    ? true
    : config.corsOrigin
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

app.disable("x-powered-by");
app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(uploadsPath));
app.use("/api/v1", apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);
