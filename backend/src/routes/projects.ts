import { Router } from "express";

import { idParamSchema } from "../modules/shared/validation.ts";
import { projectService } from "../modules/projects/project.service.ts";
import {
  createProjectSchema,
  updateProjectSchema,
} from "../modules/projects/project.validation.ts";
import { asyncHandler } from "../utils/asyncHandler.ts";

export const projectsRouter = Router();

projectsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const projects = await projectService.list();
    res.json({ data: projects });
  }),
);

projectsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const project = await projectService.getById(id);
    res.json({ data: project });
  }),
);

projectsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = createProjectSchema.parse(req.body);
    const project = await projectService.create(data);
    res.status(201).json({ message: "Project created.", data: project });
  }),
);

projectsRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const data = updateProjectSchema.parse(req.body);
    const project = await projectService.update(id, data);
    res.json({ message: "Project updated.", data: project });
  }),
);

projectsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    await projectService.remove(id);
    res.json({ message: "Project deleted." });
  }),
);
