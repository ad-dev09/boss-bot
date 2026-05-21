import cors, { type CorsOptions } from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFoundHandler } from "./middleware/notFoundHandler.js";
import { requireAuth } from "./middleware/requireAuth.js";
import { authRouter } from "./routes/auth.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { documentsRouter } from "./routes/documents.js";
import { healthRouter } from "./routes/health.js";
import { paymentsRouter } from "./routes/payments.js";
import { projectsRouter } from "./routes/projects.js";
import { providersRouter } from "./routes/providers.js";
import { reportsRouter } from "./routes/reports.js";
import { tasksRouter } from "./routes/tasks.js";
import { prisma } from "./lib/prisma.js";

export const app = express();

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    const allowsAnyOrigin = env.CORS_ORIGINS.includes("*");
    const isAllowedExact = env.CORS_ORIGINS.includes(origin);
    const isVercelPreview =
      env.NODE_ENV === "production" && /\.vercel\.app$/.test(origin);

    if (allowsAnyOrigin || isAllowedExact || isVercelPreview) {
      callback(null, true);
      return;
    }

    if (env.NODE_ENV === "development") {
      console.warn(`CORS blocked origin: ${origin}`);
    }

    callback(new Error(`CORS blocked origin: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
};

app.use(helmet());
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json());
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

app.use("/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/dashboard", requireAuth, dashboardRouter);
app.use("/api/projects", requireAuth, projectsRouter);
app.use("/api/tasks", requireAuth, tasksRouter);
app.use("/api/payments", requireAuth, paymentsRouter);
app.use("/api/providers", requireAuth, providersRouter);
app.use("/api/documents", requireAuth, documentsRouter);
app.use("/api/reports", requireAuth, reportsRouter);

app.get("/db-test", async (_req, res) => {
  try {
    const result = await prisma.$queryRaw`select now()`;

    res.json({
      status: "connected",
      databaseTime: result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      message: "Could not connect to database",
    });
  }
});

app.use(notFoundHandler);
app.use(errorHandler);
