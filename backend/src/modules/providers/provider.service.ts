import { prisma } from "../../config/prisma.js";
import { notFound } from "../../utils/httpError.js";
import type {
  CreateProviderInput,
  UpdateProviderInput,
} from "./provider.validation.js";

const providerRelations = {
  payments: true,
};

export const providerService = {
  list() {
    return prisma.provider.findMany({
      orderBy: { createdAt: "desc" },
    });
  },

  async getById(id: string) {
    const provider = await prisma.provider.findUnique({
      where: { id },
      include: providerRelations,
    });

    if (!provider) {
      throw notFound("Provider");
    }

    return provider;
  },

  create(data: CreateProviderInput) {
    return prisma.provider.create({ data });
  },

  async update(id: string, data: UpdateProviderInput) {
    await this.getById(id);

    return prisma.provider.update({
      where: { id },
      data,
    });
  },

  async remove(id: string) {
    await this.getById(id);
    await prisma.provider.delete({ where: { id } });
  },
};
