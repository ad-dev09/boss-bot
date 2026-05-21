import { ProjectStatus } from "@prisma/client";

import { askDocuments } from "../ai/fileSearchService.js";
import { classifyIntent, type Intent } from "../ai/intentRouter.js";
import { prisma } from "../config/prisma.js";
import { paymentService } from "../modules/payments/payment.service.js";
import { projectService } from "../modules/projects/project.service.js";
import { generateManagerReport } from "../modules/reports/reportService.js";
import { taskService } from "../modules/tasks/task.service.js";

type MessageSource = {
  chatId?: number | string;
  username?: string;
};

type HandlerResult = {
  response: string;
  intent: Intent;
  projectId?: string;
};

const commandIntents: Record<string, Intent> = {
  "/projects": "PROJECT_STATUS",
  "/tasks": "LIST_TASKS",
  "/payments": "LIST_PAYMENTS",
  "/report": "GENERAL_REPORT",
};

const formatDate = (date: Date | null) =>
  date ? date.toISOString().slice(0, 10) : "No date";

const formatMoney = (amount: { toString: () => string }, currency: string) =>
  `${currency} ${amount.toString()}`;

const truncate = (value: string, maxLength = 80) =>
  value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;

const getIntent = (text: string): Intent =>
  commandIntents[text.trim().toLowerCase()] ?? classifyIntent(text);

const formatActiveProjects = async () => {
  const projects = await projectService.list();
  const activeProjects = projects.filter((project) => project.status === "ACTIVE");

  if (activeProjects.length === 0) {
    return "No active projects found.";
  }

  return [
    "Active projects:",
    ...activeProjects.slice(0, 8).map((project) =>
      [
        `- ${project.name}`,
        `  Priority: ${project.priority}`,
        `  Due: ${formatDate(project.dueDate)}`,
      ].join("\n"),
    ),
  ].join("\n");
};

const formatOpenTasks = async () => {
  const tasks = await taskService.list();
  const openTasks = tasks.filter(
    (task) => task.status !== "DONE" && task.status !== "CANCELLED",
  );

  if (openTasks.length === 0) {
    return "No open tasks found.";
  }

  return [
    "Open tasks:",
    ...openTasks.slice(0, 8).map((task) =>
      [
        `- ${truncate(task.title)}`,
        `  ${task.status} | ${task.priority} | Due: ${formatDate(task.dueDate)}`,
        `  Project: ${task.project.name}`,
      ].join("\n"),
    ),
  ].join("\n");
};

const formatPendingPayments = async () => {
  const [pendingPayments, overduePayments] = await Promise.all([
    paymentService.listPending(),
    paymentService.listOverdue(),
  ]);
  const paymentsById = new Map(
    [...overduePayments, ...pendingPayments].map((payment) => [payment.id, payment]),
  );
  const payments = [...paymentsById.values()];

  if (payments.length === 0) {
    return "No pending or overdue payments found.";
  }

  return [
    "Pending and overdue payments:",
    ...payments.slice(0, 8).map((payment) =>
      [
        `- ${truncate(payment.description)}`,
        `  ${formatMoney(payment.amount, payment.currency)} | ${payment.status}`,
        `  Due: ${formatDate(payment.dueDate)} | ${payment.provider.name}`,
      ].join("\n"),
    ),
  ].join("\n");
};

const getInboxProject = async () => {
  const existingInbox = await prisma.project.findFirst({
    where: { name: "Inbox" },
    orderBy: { createdAt: "asc" },
  });

  if (existingInbox) {
    return existingInbox;
  }

  return prisma.project.create({
    data: {
      name: "Inbox",
      description: "Default project for tasks created from Telegram.",
      status: ProjectStatus.ACTIVE,
    },
  });
};

const parseTaskTitle = (text: string) => {
  const cleaned = text
    .replace(/^\/tasks\s*/i, "")
    .replace(/^(add task|create task|remind me to)\s*:?\s*/i, "")
    .replace(/\b(today|tomorrow)\b/gi, "")
    .trim();

  return cleaned || "Untitled task";
};

const parseDueDate = (text: string) => {
  const normalizedText = text.toLowerCase();
  const dueDate = new Date();

  if (normalizedText.includes("tomorrow")) {
    dueDate.setDate(dueDate.getDate() + 1);
    dueDate.setHours(9, 0, 0, 0);
    return dueDate;
  }

  if (normalizedText.includes("today")) {
    dueDate.setHours(17, 0, 0, 0);
    return dueDate;
  }

  return undefined;
};

const createTaskFromMessage = async (text: string) => {
  const project = await getInboxProject();
  const task = await taskService.create({
    title: parseTaskTitle(text),
    dueDate: parseDueDate(text),
    completedAt: undefined,
    projectId: project.id,
  });

  return {
    response: [
      "Task created:",
      `- ${task.title}`,
      `  Project: ${task.project.name}`,
      `  Due: ${formatDate(task.dueDate)}`,
    ].join("\n"),
    projectId: project.id,
  };
};

const runIntent = async (text: string, intent: Intent): Promise<HandlerResult> => {
  switch (intent) {
    case "LIST_TASKS":
      return { intent, response: await formatOpenTasks() };
    case "LIST_PAYMENTS":
      return { intent, response: await formatPendingPayments() };
    case "PROJECT_STATUS":
      return { intent, response: await formatActiveProjects() };
    case "DOCUMENT_QUESTION":
      return { intent, response: await askDocuments(text) };
    case "GENERAL_REPORT":
      return { intent, response: await generateManagerReport() };
    case "CREATE_TASK": {
      const taskResult = await createTaskFromMessage(text);
      return { intent, ...taskResult };
    }
    default:
      return {
        intent,
        response: "I am not sure yet. Try /projects, /tasks, /payments, or /report.",
      };
  }
};

const logActivity = async ({
  text,
  source,
  result,
  error,
}: {
  text: string;
  source?: MessageSource;
  result?: HandlerResult;
  error?: unknown;
}) => {
  try {
    await prisma.activityLog.create({
      data: {
        action: result ? `TELEGRAM_${result.intent}` : "TELEGRAM_ERROR",
        projectId: result?.projectId,
        details: {
          message: truncate(text, 500),
          chatId: source?.chatId ? String(source.chatId) : undefined,
          username: source?.username,
          response: result ? truncate(result.response, 1000) : undefined,
          error:
            error instanceof Error
              ? truncate(error.message, 500)
              : error
                ? "Unknown error"
                : undefined,
        },
      },
    });
  } catch (logError) {
    console.error("Failed to save Telegram activity log:", logError);
  }
};

export const handleTelegramText = async (
  text: string,
  source?: MessageSource,
) => {
  try {
    const intent = getIntent(text);
    const result = await runIntent(text, intent);

    await logActivity({ text, source, result });

    return result.response;
  } catch (error) {
    console.error("Telegram message handler error:", error);
    await logActivity({ text, source, error });
    return "I could not complete that request. Check the backend logs.";
  }
};
