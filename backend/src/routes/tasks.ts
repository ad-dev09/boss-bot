import { Router } from "express";

import { idParamSchema } from "../modules/shared/validation.js";
import { taskService } from "../modules/tasks/task.service.js";
import {
  createTaskSchema,
  updateTaskSchema,
} from "../modules/tasks/task.validation.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const tasksRouter = Router();

tasksRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const filter = typeof req.query.filter === "string" ? req.query.filter : "all";
    const tasks =
      filter === "today"
        ? await taskService.listToday()
        : filter === "overdue"
          ? await taskService.listOverdue()
          : filter === "blocked"
            ? await taskService.listBlocked()
            : filter === "completed"
              ? await taskService.listCompleted()
              : await taskService.list();

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

tasksRouter.get(
  "/blocked",
  asyncHandler(async (_req, res) => {
    const tasks = await taskService.listBlocked();
    res.json({ data: tasks });
  }),
);

tasksRouter.get(
  "/completed",
  asyncHandler(async (_req, res) => {
    const tasks = await taskService.listCompleted();
    res.json({ data: tasks });
  }),
);

tasksRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const task = await taskService.getById(id);
    res.json({ data: task });
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

tasksRouter.put(
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
