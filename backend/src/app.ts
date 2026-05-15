import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env.ts";
import { errorHandler } from "./middleware/errorHandler.ts";
import { notFoundHandler } from "./middleware/notFoundHandler.ts";
import { documentsRouter } from "./routes/documents.ts";
import { healthRouter } from "./routes/health.ts";
import { paymentsRouter } from "./routes/payments.ts";
import { projectsRouter } from "./routes/projects.ts";
import { providersRouter } from "./routes/providers.ts";
import { tasksRouter } from "./routes/tasks.ts";

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: env.CORS_ORIGIN !== "*",
  }),
);
app.use(express.json());
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

app.use("/health", healthRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/providers", providersRouter);
app.use("/api/documents", documentsRouter);

app.use(notFoundHandler);
app.use(errorHandler);
