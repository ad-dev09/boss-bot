import { Router } from "express";

import { idParamSchema } from "../modules/shared/validation.ts";
import { taskService } from "../modules/tasks/task.service.ts";
import {
  createTaskSchema,
  updateTaskSchema,
} from "../modules/tasks/task.validation.ts";
import { asyncHandler } from "../utils/asyncHandler.ts";

export const tasksRouter = Router();

tasksRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const tasks = await taskService.list();
    res.json({ data: tasks });
  }),
);

tasksRouter.get(
  "/today",
  asyncHandler(async (_req, res) => {
    const tasks = await taskService.listToday();
    res.json({ data: tasks });
  }),
);

tasksRouter.get(
  "/overdue",
  asyncHandler(async (_req, res) => {
    const tasks = await taskService.listOverdue();
    res.json({ data: tasks });
  }),
);

tasksRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = createTaskSchema.parse(req.body);
    const task = await taskService.create(data);
    res.status(201).json({ message: "Task created.", data: task });
  }),
);

tasksRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const data = updateTaskSchema.parse(req.body);
    const task = await taskService.update(id, data);
    res.json({ message: "Task updated.", data: task });
  }),
);

tasksRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    await taskService.remove(id);
    res.json({ message: "Task deleted." });
  }),
);
