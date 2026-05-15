import { Router } from "express";

import { providerService } from "../modules/providers/provider.service.ts";
import {
  createProviderSchema,
  updateProviderSchema,
} from "../modules/providers/provider.validation.ts";
import { idParamSchema } from "../modules/shared/validation.ts";
import { asyncHandler } from "../utils/asyncHandler.ts";

export const providersRouter = Router();

providersRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const providers = await providerService.list();
    res.json({ data: providers });
  }),
);

providersRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = createProviderSchema.parse(req.body);
    const provider = await providerService.create(data);
    res.status(201).json({ message: "Provider created.", data: provider });
  }),
);

providersRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const data = updateProviderSchema.parse(req.body);
    const provider = await providerService.update(id, data);
    res.json({ message: "Provider updated.", data: provider });
  }),
);

providersRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    await providerService.remove(id);
    res.json({ message: "Provider deleted." });
  }),
);
