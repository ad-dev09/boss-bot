import { PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { getTodayRange } from "../../utils/dates.js";
import { notFound } from "../../utils/httpError.js";
import type {
  CreatePaymentInput,
  UpdatePaymentInput,
} from "./payment.validation.js";

const paymentRelations = {
  project: {
    select: {
      id: true,
      name: true,
    },
  },
  provider: {
    select: {
      id: true,
      name: true,
    },
  },
};

type PaymentWithRelations = Prisma.PaymentGetPayload<{
  include: typeof paymentRelations;
}>;

const serializePayment = (payment: PaymentWithRelations) => ({
  ...payment,
  amount: Number(payment.amount),
});

const serializePayments = (payments: PaymentWithRelations[]) =>
  payments.map(serializePayment);

const resolveProviderId = async (data: Pick<CreatePaymentInput, "providerId" | "providerName">) => {
  if (data.providerId) return data.providerId;

  const providerName = data.providerName?.trim();

  if (!providerName) {
    throw new Error("providerId or providerName is required.");
  }

  const existingProvider = await prisma.provider.findFirst({
    where: { name: providerName },
    select: { id: true },
  });

  if (existingProvider) return existingProvider.id;

  const provider = await prisma.provider.create({
    data: { name: providerName },
    select: { id: true },
  });

  return provider.id;
};

const toCreatePaymentData = async (data: CreatePaymentInput) => {
  const { providerName: _providerName, providerId: _providerId, ...paymentData } = data;
  const providerId = await resolveProviderId(data);

  return {
    ...paymentData,
    providerId,
    amount: new Prisma.Decimal(data.amount),
  };
};

const toUpdatePaymentData = async (data: UpdatePaymentInput) => {
  const { providerName: _providerName, providerId, ...paymentData } = data;

  return {
    ...paymentData,
    ...(providerId || data.providerName
      ? { providerId: await resolveProviderId({ providerId, providerName: data.providerName }) }
      : {}),
    amount:
      data.amount === undefined ? data.amount : new Prisma.Decimal(data.amount),
  };
};

export const paymentService = {
  async list() {
    const payments = await prisma.payment.findMany({
      include: paymentRelations,
      orderBy: { createdAt: "desc" },
    });

    return serializePayments(payments);
  },

  async listPending() {
    const payments = await prisma.payment.findMany({
      where: { status: PaymentStatus.PENDING },
      include: paymentRelations,
      orderBy: { dueDate: "asc" },
    });

    return serializePayments(payments);
  },

  async listOverdue() {
    const { start } = getTodayRange();

    const payments = await prisma.payment.findMany({
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

    return serializePayments(payments);
  },

  async getById(id: string) {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: paymentRelations,
    });

    if (!payment) {
      throw notFound("Payment");
    }

    return serializePayment(payment);
  },

  async create(data: CreatePaymentInput) {
    const payment = await prisma.payment.create({
      data: await toCreatePaymentData(data),
      include: paymentRelations,
    });

    return serializePayment(payment);
  },

  async update(id: string, data: UpdatePaymentInput) {
    await this.getById(id);

    const payment = await prisma.payment.update({
      where: { id },
      data: await toUpdatePaymentData(data),
      include: paymentRelations,
    });

    return serializePayment(payment);
  },

  async remove(id: string) {
    await this.getById(id);
    await prisma.payment.delete({ where: { id } });
  },
};
