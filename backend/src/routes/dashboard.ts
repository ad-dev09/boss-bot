import { PaymentStatus, ProjectStatus, TaskStatus } from "@prisma/client";
import { Router } from "express";

import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const dashboardRouter = Router();

dashboardRouter.get(
  "/summary",
  asyncHandler(async (_req, res) => {
    const now = new Date();

    const [
      activeProjects,
      openTasks,
      pendingPayments,
      overduePayments,
      documentsUploaded,
      todaysPriorities,
      recentActivity,
    ] = await Promise.all([
      prisma.project.count({
        where: { status: ProjectStatus.ACTIVE },
      }),
      prisma.task.count({
        where: { status: { notIn: [TaskStatus.DONE, TaskStatus.CANCELLED] } },
      }),
      prisma.payment.count({
        where: { status: PaymentStatus.PENDING },
      }),
      prisma.payment.count({
        where: {
          dueDate: { lt: now },
          status: { notIn: [PaymentStatus.PAID, PaymentStatus.CANCELLED] },
        },
      }),
      prisma.document.count(),
      prisma.task.findMany({
        where: { status: { notIn: [TaskStatus.DONE, TaskStatus.CANCELLED] } },
        include: { project: true },
        orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
        take: 8,
      }),
      prisma.activityLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
    ]);

    res.json({
      data: {
        activeProjects,
        openTasks,
        pendingPayments,
        overduePayments,
        documentsUploaded,
        todaysPriorities: todaysPriorities.map((task) => ({
          id: task.id,
          title: task.title,
          project: task.project.name,
          due: task.dueDate?.toISOString(),
        })),
        recentActivity: recentActivity.map((activity) => ({
          id: activity.id,
          message: activity.action,
          timestamp: activity.createdAt.toISOString(),
        })),
      },
    });
  }),
);

