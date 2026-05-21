import { Router } from "express";

import { generateManagerReport } from "../modules/reports/reportService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const reportsRouter = Router();

const getManagerReport = asyncHandler(async (_req, res) => {
  const report = await generateManagerReport();

  res.json({ data: { report } });
});

reportsRouter.get("/", getManagerReport);
reportsRouter.get("/manager", getManagerReport);
