import { Router } from "express";

import { asyncHandler } from "../utils/asyncHandler.js";

export const healthRouter = Router();

healthRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.status(200).json({
      status: "ok",
      service: "managerops-backend",
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  }),
);
