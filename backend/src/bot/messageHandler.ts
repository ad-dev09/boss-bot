import {
  PaymentStatus,
  Priority,
  ProjectStatus,
  TaskStatus,
  type Prisma,
} from "@prisma/client";

import { askDocuments } from "../ai/fileSearchService.js";
import { classifyIntent, type Intent } from "../ai/intentRouter.js";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { paymentService } from "../modules/payments/payment.service.js";
import { projectService } from "../modules/projects/project.service.js";
import { generateManagerReport } from "../modules/reports/reportService.js";
import { taskService } from "../modules/tasks/task.service.js";
import { getTodayRange } from "../utils/dates.js";
import {
  commandList,
  formatCommandHelp,
  getCommandDefinition,
  type TelegramCommandKey,
} from "./commands.js";

type MessageSource = {
  chatId?: number | string;
  username?: string;
};

type HandlerResult = {
  response: string;
  action: string;
  projectId?: string;
};

type ParsedCommand = {
  command: TelegramCommandKey;
  args: string;
};

type TaskFilter = "all" | "today" | "overdue" | "blocked" | "completed";

const projectMetaPrefix = "[managerops-project-meta]";
const providerMetaPrefix = "[managerops-provider-meta]";
const documentMetaPrefix = "[managerops-document-meta]";

const incompleteTaskStatuses = {
  notIn: [TaskStatus.DONE, TaskStatus.CANCELLED],
};

const incompletePaymentStatuses = {
  notIn: [PaymentStatus.PAID, PaymentStatus.CANCELLED],
};

const formatDate = (date: Date | string | null | undefined) => {
  if (!date) return "No date";

  const parsedDate = date instanceof Date ? date : new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "No date";

  return parsedDate.toISOString().slice(0, 10);
};

const formatMoney = (
  amount: number | string | Prisma.Decimal | { toString: () => string },
  currency = "USD",
) => {
  const number = Number(amount);

  if (Number.isNaN(number)) return `${currency} 0.00`;

  return `${currency} ${number.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const truncate = (value: string, maxLength = 80) =>
  value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;

const parseMetadata = (value: string | null | undefined, prefix: string) => {
  if (!value?.startsWith(prefix)) return {};

  try {
    return JSON.parse(value.slice(prefix.length).trim()) as Record<string, unknown>;
  } catch {
    return {};
  }
};

const metadataText = (
  metadata: Record<string, unknown>,
  key: string,
  fallback = "",
) => {
  const value = metadata[key];

  return typeof value === "string" && value.trim() ? value.trim() : fallback;
};

const parseCommand = (text: string): ParsedCommand | null => {
  const match = text.trim().match(/^\/([a-z0-9_]+)(?:@[^\s]+)?(?:\s+([\s\S]*))?$/i);

  if (!match) return null;

  const definition = getCommandDefinition(match[1]);

  if (!definition) return null;

  return {
    command: definition.key,
    args: match[2]?.trim() ?? "",
  };
};

const isSlashCommand = (text: string) => text.trim().startsWith("/");

const formatWelcome = () =>
  [
    "Hello Adrian. I am Jarvis AI Assistant for ManagerOps.",
    "",
    "I can help you review projects, tasks, payments, providers, documents, and today's priorities.",
    "",
    "Start with:",
    "/help",
    "/tasks",
    "/today",
    "/report",
  ].join("\n");

const formatActiveProjects = async () => {
  const projects = await projectService.list();
  const activeProjects = projects.filter(
    (project) =>
      project.status === ProjectStatus.ACTIVE ||
      project.status === ProjectStatus.PLANNING ||
      project.status === ProjectStatus.ON_HOLD,
  );

  if (activeProjects.length === 0) {
    return "No active projects found.";
  }

  return [
    "Active projects:",
    ...activeProjects.slice(0, 10).map((project) => {
      const meta = parseMetadata(project.description, projectMetaPrefix);
      const nextAction = metadataText(meta, "nextAction", "Review next milestone.");

      return [
        `- ${project.name}`,
        `  Status: ${project.status} | Priority: ${project.priority}`,
        `  Due: ${formatDate(project.dueDate)}`,
        `  Next: ${truncate(nextAction, 70)}`,
      ].join("\n");
    }),
  ].join("\n");
};

const formatTasks = async (filter: TaskFilter) => {
  const tasks =
    filter === "today"
      ? await taskService.listToday()
      : filter === "overdue"
        ? await taskService.listOverdue()
        : filter === "blocked"
          ? await taskService.listBlocked()
          : filter === "completed"
            ? await taskService.listCompleted()
            : (await taskService.list()).filter(
                (task) =>
                  task.status !== TaskStatus.DONE &&
                  task.status !== TaskStatus.CANCELLED,
              );

  if (tasks.length === 0) {
    return filter === "all"
      ? "No open tasks found."
      : `No ${filter} tasks found.`;
  }

  return [
    filter === "all" ? "Open tasks:" : `${filter} tasks:`,
    ...tasks.slice(0, 12).map((task) => {
      const meta = parseMetadata(task.description, "[managerops-task-meta]");
      const nextAction = metadataText(meta, "nextAction");

      return [
        `- ${truncate(task.title)}`,
        `  ${task.status} | ${task.priority} | Due: ${formatDate(task.dueDate)}`,
        `  Project: ${task.project.name}`,
        `  Assigned: ${task.assignedTo?.name ?? task.assignedTo?.email ?? "Unassigned"}`,
        ...(nextAction ? [`  Next: ${truncate(nextAction, 70)}`] : []),
      ].join("\n");
    }),
  ].join("\n");
};

const getTaskFilter = (args: string): TaskFilter => {
  const normalized = args.trim().toLowerCase();

  if (["today", "overdue", "blocked", "completed"].includes(normalized)) {
    return normalized as TaskFilter;
  }

  return "all";
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
    ...payments.slice(0, 10).map((payment) =>
      [
        `- ${truncate(payment.provider.name)}`,
        `  ${formatMoney(payment.amount, payment.currency)} | ${payment.status}`,
        `  Due: ${formatDate(payment.dueDate)} | Project: ${payment.project.name}`,
        `  Note: ${truncate(payment.description)}`,
      ].join("\n"),
    ),
  ].join("\n");
};

const formatProviders = async () => {
  const providers = await prisma.provider.findMany({
    orderBy: { updatedAt: "desc" },
    take: 12,
  });

  if (providers.length === 0) {
    return "No providers found.";
  }

  return [
    "Providers:",
    ...providers.map((provider) => {
      const meta = parseMetadata(provider.notes, providerMetaPrefix);
      const category = metadataText(meta, "category", "other");
      const status = metadataText(meta, "status", "active");
      const contact = provider.contactName || provider.email || provider.phone || "No contact";

      return [
        `- ${provider.name}`,
        `  ${category} | ${status}`,
        `  Contact: ${contact}`,
      ].join("\n");
    }),
  ].join("\n");
};

const formatDocuments = async () => {
  const documents = await prisma.document.findMany({
    include: {
      project: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  if (documents.length === 0) {
    return "No documents found.";
  }

  return [
    "Recent documents:",
    ...documents.map((document) => {
      const meta = parseMetadata(document.notes, documentMetaPrefix);
      const status = metadataText(meta, "status", "active");

      return [
        `- ${document.title}`,
        `  ${document.documentType ?? "other"} | ${status}`,
        `  Uploaded: ${formatDate(document.createdAt)} | Project: ${document.project?.name ?? "No project"}`,
      ].join("\n");
    }),
    "",
    "Ask a natural-language document question only when you want AI file search.",
  ].join("\n");
};

const formatTodaySummary = async () => {
  const { start, end } = getTodayRange();
  const [tasksDueToday, overdueTasks, paymentsDueToday, overduePayments, activeProjects] =
    await Promise.all([
      prisma.task.findMany({
        where: {
          dueDate: { gte: start, lt: end },
          status: incompleteTaskStatuses,
        },
        include: { project: true },
        orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
        take: 8,
      }),
      prisma.task.findMany({
        where: {
          dueDate: { lt: start },
          status: incompleteTaskStatuses,
        },
        include: { project: true },
        orderBy: { dueDate: "asc" },
        take: 8,
      }),
      prisma.payment.findMany({
        where: {
          dueDate: { gte: start, lt: end },
          status: incompletePaymentStatuses,
        },
        include: { provider: true, project: true },
        orderBy: { dueDate: "asc" },
        take: 8,
      }),
      prisma.payment.findMany({
        where: {
          dueDate: { lt: start },
          status: incompletePaymentStatuses,
        },
        include: { provider: true, project: true },
        orderBy: { dueDate: "asc" },
        take: 8,
      }),
      prisma.project.findMany({
        where: { status: { in: [ProjectStatus.ACTIVE, ProjectStatus.PLANNING] } },
        orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
        take: 5,
      }),
    ]);

  return [
    "Today's ManagerOps summary:",
    "",
    `Tasks due today: ${tasksDueToday.length}`,
    ...tasksDueToday.map((task) => `- ${truncate(task.title)} (${task.project.name})`),
    "",
    `Overdue tasks: ${overdueTasks.length}`,
    ...overdueTasks.map((task) => `- ${truncate(task.title)} - Due ${formatDate(task.dueDate)}`),
    "",
    `Payments due today: ${paymentsDueToday.length}`,
    ...paymentsDueToday.map(
      (payment) =>
        `- ${payment.provider.name} - ${formatMoney(payment.amount, payment.currency)}`,
    ),
    "",
    `Overdue payments: ${overduePayments.length}`,
    ...overduePayments.map(
      (payment) =>
        `- ${payment.provider.name} - ${formatMoney(payment.amount, payment.currency)} - Due ${formatDate(payment.dueDate)}`,
    ),
    "",
    "Important active projects:",
    ...(activeProjects.length
      ? activeProjects.map((project) => `- ${project.name} (${project.priority})`)
      : ["- No active projects found."]),
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
      description: "Default project for tasks and payments created from Telegram.",
      status: ProjectStatus.ACTIVE,
    },
  });
};

const findProjectByName = async (name: string | undefined) => {
  const trimmedName = name?.trim();

  if (!trimmedName) return null;

  return prisma.project.findFirst({
    where: {
      name: {
        contains: trimmedName,
        mode: "insensitive",
      },
    },
    orderBy: { updatedAt: "desc" },
  });
};

const findUserByName = async (name: string | undefined) => {
  const trimmedName = name?.trim();

  if (!trimmedName) return null;

  return prisma.user.findFirst({
    where: {
      OR: [
        { name: { contains: trimmedName, mode: "insensitive" } },
        { email: { contains: trimmedName, mode: "insensitive" } },
      ],
    },
    select: { id: true, name: true, email: true },
    orderBy: { updatedAt: "desc" },
  });
};

const parseSegments = (args: string) =>
  args
    .split("|")
    .map((segment) => segment.trim())
    .filter(Boolean);

const getSegmentValue = (segments: string[], key: string) => {
  const normalizedKey = key.toLowerCase();
  const segment = segments.find((item) =>
    item.toLowerCase().startsWith(`${normalizedKey} `),
  );

  return segment?.slice(key.length).trim();
};

const parseDateValue = (value: string | undefined) => {
  if (!value) return undefined;

  const normalized = value.toLowerCase().trim();
  const relativeDate = new Date();

  if (normalized === "today") {
    relativeDate.setHours(17, 0, 0, 0);
    return relativeDate;
  }

  if (normalized === "tomorrow") {
    relativeDate.setDate(relativeDate.getDate() + 1);
    relativeDate.setHours(9, 0, 0, 0);
    return relativeDate;
  }

  const parsedDate = new Date(value);

  return Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate;
};

const normalizeTaskPriority = (value: string | undefined) => {
  const priority = value?.trim().toUpperCase();

  return priority && priority in Priority ? (priority as Priority) : Priority.MEDIUM;
};

const createTaskFromCommand = async (args: string) => {
  const segments = parseSegments(args);
  const title = segments[0]?.trim();

  if (!title) {
    return "Usage: /addtask Task title | project Project Name | priority high | due 2026-06-15 | assign Adrian";
  }

  const project =
    (await findProjectByName(getSegmentValue(segments, "project"))) ??
    (await getInboxProject());
  const user = await findUserByName(getSegmentValue(segments, "assign"));
  const task = await taskService.create({
    title,
    description: null,
    status: TaskStatus.TODO,
    priority: normalizeTaskPriority(getSegmentValue(segments, "priority")),
    dueDate: parseDateValue(getSegmentValue(segments, "due")),
    completedAt: undefined,
    projectId: project.id,
    assignedToId: user?.id ?? null,
  });

  return [
    `Task created: ${task.title}`,
    `Project: ${task.project.name}`,
    `Priority: ${task.priority}`,
    `Due: ${formatDate(task.dueDate)}`,
    `Assigned: ${task.assignedTo?.name ?? task.assignedTo?.email ?? "Unassigned"}`,
  ].join("\n");
};

const parsePaymentAmount = (segments: string[]) => {
  const explicitAmount = getSegmentValue(segments, "amount");
  const amount = explicitAmount ?? segments[0]?.match(/\b\d+(?:\.\d{1,2})?\b/)?.[0];

  return amount && !Number.isNaN(Number(amount)) ? amount : null;
};

const getDueValue = (segments: string[]) =>
  getSegmentValue(segments, "due") ??
  segments[0]?.match(/\bdue\s+([0-9]{4}-[0-9]{2}-[0-9]{2}|today|tomorrow)\b/i)?.[1];

const parseProviderName = (segments: string[]) => {
  const explicitProvider = getSegmentValue(segments, "provider");

  if (explicitProvider) return explicitProvider;

  const firstSegment = segments[0] ?? "";

  return firstSegment
    .replace(/\bdue\s+([0-9]{4}-[0-9]{2}-[0-9]{2}|today|tomorrow)\b/gi, "")
    .replace(/\b\d+(?:\.\d{1,2})?\b/g, "")
    .trim();
};

const createPaymentFromCommand = async (args: string) => {
  const segments = parseSegments(args);
  const providerName = parseProviderName(segments);
  const amount = parsePaymentAmount(segments);

  if (!providerName || !amount) {
    return "Usage: /addpayment Provider Name | amount 2500 | due 2026-06-15 | project Warehouse Workflow Upgrade";
  }

  const project =
    (await findProjectByName(getSegmentValue(segments, "project"))) ??
    (await getInboxProject());
  const payment = await paymentService.create({
    description: getSegmentValue(segments, "description") ?? `${providerName} payment`,
    amount,
    currency: "USD",
    status: PaymentStatus.PENDING,
    dueDate: parseDateValue(getDueValue(segments)),
    paidAt: undefined,
    projectId: project.id,
    providerName,
  });

  return [
    `Payment created: ${payment.provider.name} - ${formatMoney(payment.amount, payment.currency)}`,
    `Project: ${payment.project.name}`,
    `Status: ${payment.status}`,
    `Due: ${formatDate(payment.dueDate)}`,
  ].join("\n");
};

const formatSystemStatus = async () => {
  let databaseStatus = "connected";

  try {
    await prisma.$queryRaw`select 1`;
  } catch {
    databaseStatus = "unavailable";
  }

  return [
    "ManagerOps status:",
    `Backend: running`,
    `Database: ${databaseStatus}`,
    `Telegram bot: ${env.TELEGRAM_BOT_TOKEN ? "configured" : "missing token"}`,
    `Manager chat: ${env.TELEGRAM_MANAGER_CHAT_ID ? "configured" : "missing"}`,
    `OpenAI: ${env.OPENAI_API_KEY ? "configured" : "missing"}`,
    "",
    "Supported commands:",
    ...commandList.map((definition) => `- ${definition.command}`),
  ].join("\n");
};

const runCommand = async ({ command, args }: ParsedCommand): Promise<HandlerResult> => {
  switch (command) {
    case "start":
      return { action: "COMMAND_START", response: formatWelcome() };
    case "help":
      return { action: "COMMAND_HELP", response: formatCommandHelp() };
    case "projects":
      return { action: "COMMAND_PROJECTS", response: await formatActiveProjects() };
    case "tasks":
      return { action: "COMMAND_TASKS", response: await formatTasks(getTaskFilter(args)) };
    case "payments":
      return { action: "COMMAND_PAYMENTS", response: await formatPendingPayments() };
    case "providers":
      return { action: "COMMAND_PROVIDERS", response: await formatProviders() };
    case "documents":
      return { action: "COMMAND_DOCUMENTS", response: await formatDocuments() };
    case "today":
      return { action: "COMMAND_TODAY", response: await formatTodaySummary() };
    case "report":
      return { action: "COMMAND_REPORT", response: await generateManagerReport() };
    case "addtask":
      return { action: "COMMAND_ADDTASK", response: await createTaskFromCommand(args) };
    case "addpayment":
      return {
        action: "COMMAND_ADDPAYMENT",
        response: await createPaymentFromCommand(args),
      };
    case "status":
      return { action: "COMMAND_STATUS", response: await formatSystemStatus() };
  }
};

const runIntent = async (text: string, intent: Intent): Promise<HandlerResult> => {
  switch (intent) {
    case "LIST_TASKS":
      return { action: "INTENT_LIST_TASKS", response: await formatTasks("all") };
    case "LIST_PAYMENTS":
      return { action: "INTENT_LIST_PAYMENTS", response: await formatPendingPayments() };
    case "PROJECT_STATUS":
      return { action: "INTENT_PROJECT_STATUS", response: await formatActiveProjects() };
    case "DOCUMENT_QUESTION":
      return { action: "INTENT_DOCUMENT_QUESTION", response: await askDocuments(text) };
    case "GENERAL_REPORT":
      return { action: "INTENT_GENERAL_REPORT", response: await generateManagerReport() };
    case "CREATE_TASK":
      return {
        action: "INTENT_CREATE_TASK",
        response: await createTaskFromCommand(
          text.replace(/^(add task|create task|remind me to)\s*:?\s*/i, ""),
        ),
      };
    default:
      return {
        action: "INTENT_UNKNOWN",
        response: "I am not sure yet. Try /help, /tasks, /today, or /report.",
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
        action: result ? `TELEGRAM_${result.action}` : "TELEGRAM_ERROR",
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
    const parsedCommand = parseCommand(text);
    const result = parsedCommand
      ? await runCommand(parsedCommand)
      : isSlashCommand(text)
        ? {
            action: "COMMAND_UNSUPPORTED",
            response: `Unsupported command. Try /help. Recognized commands: ${commandList
              .map((definition) => definition.command)
              .join(", ")}`,
          }
        : await runIntent(text, classifyIntent(text));

    await logActivity({ text, source, result });

    return result.response;
  } catch (error) {
    console.error("Telegram message handler error:", error);
    await logActivity({ text, source, error });
    return "I could not complete that request. Check the backend logs.";
  }
};

export const getTelegramCommandSupportMatrix = () =>
  commandList.map((definition) => ({
    command: definition.command,
    backendImplemented: true,
    requiresOpenAI: definition.requiresOpenAI,
    databaseUsed: !["/start", "/help"].includes(definition.command),
    notes:
      definition.command === "/documents"
        ? "Lists document records from the database. Natural-language document questions use OpenAI file search."
        : "Handled by deterministic backend command routing.",
  }));
