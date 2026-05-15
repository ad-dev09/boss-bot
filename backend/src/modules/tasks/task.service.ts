import { TaskStatus } from "../../../generated/prisma/client.ts";
import { prisma } from "../../config/prisma.ts";
import { getTodayRange } from "../../utils/dates.ts";
import { notFound } from "../../utils/httpError.ts";
import type { CreateTaskInput, UpdateTaskInput } from "./task.validation.ts";

const taskRelations = {
  project: true,
  assignedTo: true,
};

const incompleteTaskStatuses = {
  notIn: [TaskStatus.DONE, TaskStatus.CANCELLED],
};

export const taskService = {
  list() {
    return prisma.task.findMany({
      include: taskRelations,
      orderBy: { createdAt: "desc" },
    });
  },

  listToday() {
    const { start, end } = getTodayRange();

    return prisma.task.findMany({
      where: {
        dueDate: {
          gte: start,
          lt: end,
        },
        status: incompleteTaskStatuses,
      },
      include: taskRelations,
      orderBy: { dueDate: "asc" },
    });
  },

  listOverdue() {
    const { start } = getTodayRange();

    return prisma.task.findMany({
      where: {
        dueDate: {
          lt: start,
        },
        status: incompleteTaskStatuses,
      },
      include: taskRelations,
      orderBy: { dueDate: "asc" },
    });
  },

  async getById(id: string) {
    const task = await prisma.task.findUnique({
      where: { id },
      include: taskRelations,
    });

    if (!task) {
      throw notFound("Task");
    }

    return task;
  },

  create(data: CreateTaskInput) {
    return prisma.task.create({
      data,
      include: taskRelations,
    });
  },

  async update(id: string, data: UpdateTaskInput) {
    await this.getById(id);

    return prisma.task.update({
      where: { id },
      data,
      include: taskRelations,
    });
  },

  async remove(id: string) {
    await this.getById(id);
    await prisma.task.delete({ where: { id } });
  },
};
