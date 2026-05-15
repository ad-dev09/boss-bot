import { z } from "zod";

import {
  decimalInputSchema,
  nullableDateSchema,
  paymentStatusSchema,
} from "../shared/validation.ts";

export const createPaymentSchema = z.object({
  description: z.string().trim().min(1),
  amount: decimalInputSchema,
  currency: z.string().trim().min(3).max(3).optional(),
  status: paymentStatusSchema.optional(),
  dueDate: nullableDateSchema,
  paidAt: nullableDateSchema,
  projectId: z.string().uuid(),
  providerId: z.string().uuid(),
});

export const updatePaymentSchema = createPaymentSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required.",
  });

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
