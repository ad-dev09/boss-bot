import { Router } from "express";

import { paymentService } from "../modules/payments/payment.service.ts";
import {
  createPaymentSchema,
  updatePaymentSchema,
} from "../modules/payments/payment.validation.ts";
import { idParamSchema } from "../modules/shared/validation.ts";
import { asyncHandler } from "../utils/asyncHandler.ts";

export const paymentsRouter = Router();

paymentsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const payments = await paymentService.list();
    res.json({ data: payments });
  }),
);

paymentsRouter.get(
  "/pending",
  asyncHandler(async (_req, res) => {
    const payments = await paymentService.listPending();
    res.json({ data: payments });
  }),
);

paymentsRouter.get(
  "/overdue",
  asyncHandler(async (_req, res) => {
    const payments = await paymentService.listOverdue();
    res.json({ data: payments });
  }),
);

paymentsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = createPaymentSchema.parse(req.body);
    const payment = await paymentService.create(data);
    res.status(201).json({ message: "Payment created.", data: payment });
  }),
);

paymentsRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const data = updatePaymentSchema.parse(req.body);
    const payment = await paymentService.update(id, data);
    res.json({ message: "Payment updated.", data: payment });
  }),
);

paymentsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    await paymentService.remove(id);
    res.json({ message: "Payment deleted." });
  }),
);
