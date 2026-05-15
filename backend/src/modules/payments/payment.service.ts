import { PaymentStatus, Prisma } from "../../../generated/prisma/client.ts";
import { prisma } from "../../config/prisma.ts";
import { getTodayRange } from "../../utils/dates.ts";
import { notFound } from "../../utils/httpError.ts";
import type {
  CreatePaymentInput,
  UpdatePaymentInput,
} from "./payment.validation.ts";

const paymentRelations = {
  project: true,
  provider: true,
};

const toCreatePaymentData = (data: CreatePaymentInput) => ({
  ...data,
  amount: new Prisma.Decimal(data.amount),
});

const toUpdatePaymentData = (data: UpdatePaymentInput) => ({
  ...data,
  amount:
    data.amount === undefined ? data.amount : new Prisma.Decimal(data.amount),
});

export const paymentService = {
  list() {
    return prisma.payment.findMany({
      include: paymentRelations,
      orderBy: { createdAt: "desc" },
    });
  },

  listPending() {
    return prisma.payment.findMany({
      where: { status: PaymentStatus.PENDING },
      include: paymentRelations,
      orderBy: { dueDate: "asc" },
    });
  },

  listOverdue() {
    const { start } = getTodayRange();

    return prisma.payment.findMany({
      where: {
        dueDate: {
          lt: start,
        },
        status: {
          notIn: [PaymentStatus.PAID, PaymentStatus.CANCELLED],
        },
      },
      include: paymentRelations,
      orderBy: { dueDate: "asc" },
    });
  },

  async getById(id: string) {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: paymentRelations,
    });

    if (!payment) {
      throw notFound("Payment");
    }

    return payment;
  },

  create(data: CreatePaymentInput) {
    return prisma.payment.create({
      data: toCreatePaymentData(data),
      include: paymentRelations,
    });
  },

  async update(id: string, data: UpdatePaymentInput) {
    await this.getById(id);

    return prisma.payment.update({
      where: { id },
      data: toUpdatePaymentData(data),
      include: paymentRelations,
    });
  },

  async remove(id: string) {
    await this.getById(id);
    await prisma.payment.delete({ where: { id } });
  },
};
