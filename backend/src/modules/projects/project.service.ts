import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { notFound } from "../../utils/httpError.js";
import type { CreateProjectInput, UpdateProjectInput } from "./project.validation.js";

const projectRelations = {
  tasks: true,
  payments: true,
  documents: true,
  activityLogs: true,
};

const toCreateProjectData = (data: CreateProjectInput) => ({
  ...data,
  budget:
    data.budget === undefined || data.budget === null
      ? data.budget
      : new Prisma.Decimal(data.budget),
});

const toUpdateProjectData = (data: UpdateProjectInput) => ({
  ...data,
  budget:
    data.budget === undefined || data.budget === null
      ? data.budget
      : new Prisma.Decimal(data.budget),
});

export const projectService = {
  list() {
    return prisma.project.findMany({
      orderBy: { createdAt: "desc" },
    });
  },

  async getById(id: string) {
    const project = await prisma.project.findUnique({
      where: { id },
      include: projectRelations,
    });

    if (!project) {
      throw notFound("Project");
    }

    return project;
  },

  create(data: CreateProjectInput) {
    return prisma.project.create({
      data: toCreateProjectData(data),
    });
  },

  async update(id: string, data: UpdateProjectInput) {
    await this.getById(id);

    return prisma.project.update({
      where: { id },
      data: toUpdateProjectData(data),
    });
  },

  async remove(id: string) {
    await this.getById(id);
    await prisma.project.delete({ where: { id } });
  },
};
