import { z } from "zod";

import {
  nullableDateSchema,
  optionalDecimalInputSchema,
  prioritySchema,
  projectStatusSchema,
} from "../shared/validation.ts";

export const createProjectSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().nullable().optional(),
  status: projectStatusSchema.optional(),
  priority: prioritySchema.optional(),
  budget: optionalDecimalInputSchema,
  startDate: nullableDateSchema,
  dueDate: nullableDateSchema,
  completedAt: nullableDateSchema,
});

export const updateProjectSchema = createProjectSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required.",
  });

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
