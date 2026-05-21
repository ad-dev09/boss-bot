import { Router } from "express";

import { generateManagerReport } from "../modules/reports/reportService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const reportsRouter = Router();

reportsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const report = await generateManagerReport();

    res.json({ data: { report } });
  }),
);

