import { PaymentStatus, Priority, ProjectStatus, TaskStatus } from "@prisma/client";

import { prisma } from "../../config/prisma.js";
import { getTodayRange } from "../../utils/dates.js";

const formatDate = (date: Date | null) =>
  date ? date.toISOString().slice(0, 10) : "No date";

const formatMoney = (amount: { toString: () => string }, currency: string) =>
  `${currency} ${amount.toString()}`;

const truncate = (value: string, maxLength = 80) =>
  value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;

const numberedList = (items: string[], emptyText: string) => {
  if (items.length === 0) {
    return [`1. ${emptyText}`];
  }

  return items.map((item, index) => `${index + 1}. ${item}`);
};

const getNextAction = (project: {
  payments: Array<{
    status: PaymentStatus;
    dueDate: Date | null;
    provider: { name: string };
  }>;
  tasks: Array<{
    title: string;
    status: TaskStatus;
    priority: Priority;
    dueDate: Date | null;
  }>;
}) => {
  const overduePayment = project.payments.find(
    (payment) =>
      payment.dueDate &&
      payment.dueDate < new Date() &&
      payment.status !== PaymentStatus.PAID &&
      payment.status !== PaymentStatus.CANCELLED,
  );

  if (overduePayment) {
    return `Pay or review ${overduePayment.provider.name}.`;
  }

  const blockedTask = project.tasks.find((task) => task.status === TaskStatus.BLOCKED);

  if (blockedTask) {
    return `Unblock ${truncate(blockedTask.title, 50)}.`;
  }

  const highPriorityTask = project.tasks.find(
    (task) => task.priority === Priority.HIGH || task.priority === Priority.URGENT,
  );

  if (highPriorityTask) {
    return `Work on ${truncate(highPriorityTask.title, 50)}.`;
  }

  return "Review next milestone.";
};

const getRecommendedFocus = ({
  overduePaymentCount,
  blockedTaskCount,
  highPriorityTaskCount,
  pendingPaymentCount,
}: {
  overduePaymentCount: number;
  blockedTaskCount: number;
  highPriorityTaskCount: number;
  pendingPaymentCount: number;
}) => {
  const focusItems: string[] = [];

  if (overduePaymentCount > 0) {
    focusItems.push("Pay overdue supplier.");
  }

  if (blockedTaskCount > 0) {
    focusItems.push("Clear blocked tasks.");
  }

  if (highPriorityTaskCount > 0) {
    focusItems.push("Finish high-priority tasks.");
  }

  if (pendingPaymentCount > 0) {
    focusItems.push("Review pending payments.");
  }

  focusItems.push("Update project documentation.");

  return numberedList(focusItems.slice(0, 3), "No urgent focus items.");
};

export const generateManagerReport = async () => {
  const { start } = getTodayRange();
  const [overduePayments, pendingPayments, highPriorityTasks, blockedTasks, activeProjects, openTasks] =
    await Promise.all([
      prisma.payment.findMany({
        where: {
          dueDate: { lt: start },
          status: {
            notIn: [PaymentStatus.PAID, PaymentStatus.CANCELLED],
          },
        },
        include: {
          provider: true,
          project: true,
        },
        orderBy: { dueDate: "asc" },
        take: 10,
      }),
      prisma.payment.findMany({
        where: { status: PaymentStatus.PENDING },
        include: {
          provider: true,
          project: true,
        },
        orderBy: { dueDate: "asc" },
        take: 10,
      }),
      prisma.task.findMany({
        where: {
          status: {
            notIn: [TaskStatus.DONE, TaskStatus.CANCELLED],
          },
          priority: {
            in: [Priority.HIGH, Priority.URGENT],
          },
        },
        include: { project: true },
        orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
        take: 10,
      }),
      prisma.task.findMany({
        where: { status: TaskStatus.BLOCKED },
        include: { project: true },
        orderBy: { dueDate: "asc" },
        take: 10,
      }),
      prisma.project.findMany({
        where: { status: ProjectStatus.ACTIVE },
        include: {
          payments: {
            include: { provider: true },
            orderBy: { dueDate: "asc" },
          },
          tasks: {
            where: {
              status: {
                notIn: [TaskStatus.DONE, TaskStatus.CANCELLED],
              },
            },
            orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
          },
        },
        orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
        take: 8,
      }),
      prisma.task.findMany({
        where: {
          status: {
            notIn: [TaskStatus.DONE, TaskStatus.CANCELLED],
          },
        },
        include: { project: true },
        orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
        take: 10,
      }),
    ]);

  const urgentItems = [
    ...overduePayments.map(
      (payment) =>
        `Payment overdue: ${payment.provider.name} - ${formatMoney(
          payment.amount,
          payment.currency,
        )} - Due ${formatDate(payment.dueDate)}`,
    ),
    ...blockedTasks.map(
      (task) => `Task blocked: ${truncate(task.title)} - ${task.project.name}`,
    ),
  ];

  const activeProjectItems = activeProjects.map((project) =>
    [
      project.name,
      `   Status: Active`,
      `   Priority: ${project.priority}`,
      `   Next action: ${getNextAction(project)}`,
    ].join("\n"),
  );

  const pendingPaymentItems = pendingPayments.map(
    (payment) =>
      `${payment.provider.name} - ${formatMoney(payment.amount, payment.currency)} - Due ${formatDate(
        payment.dueDate,
      )}`,
  );

  const openTaskItems = openTasks.map(
    (task) => `${truncate(task.title)} - Due ${formatDate(task.dueDate)} - ${task.priority}`,
  );

  return [
    "ManagerOps Daily Report",
    "",
    "Urgent Items:",
    ...numberedList(urgentItems.slice(0, 10), "No urgent items found."),
    "",
    "Active Projects:",
    ...numberedList(activeProjectItems, "No active projects found."),
    "",
    "Pending Payments:",
    ...numberedList(pendingPaymentItems.slice(0, 10), "No pending payments found."),
    "",
    "Open Tasks:",
    ...numberedList(openTaskItems.slice(0, 10), "No open tasks found."),
    "",
    "Recommended Focus:",
    ...getRecommendedFocus({
      overduePaymentCount: overduePayments.length,
      blockedTaskCount: blockedTasks.length,
      highPriorityTaskCount: highPriorityTasks.length,
      pendingPaymentCount: pendingPayments.length,
    }),
  ].join("\n");
};
