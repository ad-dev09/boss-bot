import { z } from "zod";

import {
  nullableDateSchema,
  prioritySchema,
  taskStatusSchema,
} from "../shared/validation.ts";

export const createTaskSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().nullable().optional(),
  status: taskStatusSchema.optional(),
  priority: prioritySchema.optional(),
  dueDate: nullableDateSchema,
  completedAt: nullableDateSchema,
  projectId: z.string().uuid(),
  assignedToId: z.string().uuid().nullable().optional(),
});

export const updateTaskSchema = createTaskSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required.",
  });

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
