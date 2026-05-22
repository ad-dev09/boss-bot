import { Router } from "express";

import { providerService } from "../modules/providers/provider.service.js";
import {
  createProviderSchema,
  updateProviderSchema,
} from "../modules/providers/provider.validation.js";
import { idParamSchema } from "../modules/shared/validation.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const providersRouter = Router();

providersRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const providers = await providerService.list();
    res.json({ data: providers });
  }),
);

providersRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const provider = await providerService.getById(id);
    res.json({ data: provider });
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

providersRouter.put(
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
