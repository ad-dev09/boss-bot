import { prisma } from "../../config/prisma.js";
import { notFound } from "../../utils/httpError.js";
import type {
  CreateDocumentInput,
  UpdateDocumentInput,
} from "./document.validation.js";

const documentRelations = {
  project: true,
};

export const documentService = {
  list() {
    return prisma.document.findMany({
      include: documentRelations,
      orderBy: { createdAt: "desc" },
    });
  },

  async getById(id: string) {
    const document = await prisma.document.findUnique({
      where: { id },
      include: documentRelations,
    });

    if (!document) {
      throw notFound("Document");
    }

    return document;
  },

  create(data: CreateDocumentInput) {
    return prisma.document.create({
      data,
      include: documentRelations,
    });
  },

  async update(id: string, data: UpdateDocumentInput) {
    await this.getById(id);

    return prisma.document.update({
      where: { id },
      data,
      include: documentRelations,
    });
  },

  async remove(id: string) {
    await this.getById(id);
    await prisma.document.delete({ where: { id } });
  },
};
