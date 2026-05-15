import { z } from "zod";

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

export const nullableDateSchema = z.coerce.date().nullable().optional();

export const decimalInputSchema = z
  .union([z.string().trim().min(1), z.number()])
  .refine((value) => !Number.isNaN(Number(value)), {
    message: "Expected a valid number.",
  });

export const optionalDecimalInputSchema = decimalInputSchema.nullable().optional();

export const projectStatusSchema = z.enum([
  "PLANNING",
  "ACTIVE",
  "ON_HOLD",
  "COMPLETED",
  "CANCELLED",
]);

export const taskStatusSchema = z.enum([
  "TODO",
  "IN_PROGRESS",
  "BLOCKED",
  "DONE",
  "CANCELLED",
]);

export const paymentStatusSchema = z.enum([
  "PENDING",
  "APPROVED",
  "PAID",
  "OVERDUE",
  "CANCELLED",
]);

export const prioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);
