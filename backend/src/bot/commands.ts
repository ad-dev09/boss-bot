export type TelegramCommandKey =
  | "start"
  | "help"
  | "projects"
  | "tasks"
  | "payments"
  | "providers"
  | "documents"
  | "today"
  | "report"
  | "addtask"
  | "addpayment"
  | "status";

export type TelegramCommandDefinition = {
  key: TelegramCommandKey;
  command: `/${TelegramCommandKey}`;
  description: string;
  requiresOpenAI: boolean;
};

export const COMMANDS: Record<TelegramCommandKey, TelegramCommandDefinition> = {
  start: {
    key: "start",
    command: "/start",
    description: "Show welcome message and key commands",
    requiresOpenAI: false,
  },
  help: {
    key: "help",
    command: "/help",
    description: "Show all supported commands",
    requiresOpenAI: false,
  },
  projects: {
    key: "projects",
    command: "/projects",
    description: "List active projects",
    requiresOpenAI: false,
  },
  tasks: {
    key: "tasks",
    command: "/tasks",
    description: "List tasks, with optional filters",
    requiresOpenAI: false,
  },
  payments: {
    key: "payments",
    command: "/payments",
    description: "List pending and overdue payments",
    requiresOpenAI: false,
  },
  providers: {
    key: "providers",
    command: "/providers",
    description: "List providers and vendors",
    requiresOpenAI: false,
  },
  documents: {
    key: "documents",
    command: "/documents",
    description: "List recent documents",
    requiresOpenAI: false,
  },
  today: {
    key: "today",
    command: "/today",
    description: "Show today's operational summary",
    requiresOpenAI: false,
  },
  report: {
    key: "report",
    command: "/report",
    description: "Show manager report",
    requiresOpenAI: false,
  },
  addtask: {
    key: "addtask",
    command: "/addtask",
    description: "Create a task",
    requiresOpenAI: false,
  },
  addpayment: {
    key: "addpayment",
    command: "/addpayment",
    description: "Create a payment",
    requiresOpenAI: false,
  },
  status: {
    key: "status",
    command: "/status",
    description: "Show bot and system status",
    requiresOpenAI: false,
  },
};

export const commandList = Object.values(COMMANDS);

export const telegramBotCommands = commandList.map((definition) => ({
  command: definition.command.slice(1),
  description: definition.description,
}));

export const getCommandDefinition = (command: string) => {
  const key = command.replace(/^\//, "").toLowerCase() as TelegramCommandKey;

  return COMMANDS[key];
};

export const formatCommandHelp = () =>
  [
    "Supported commands:",
    "",
    ...commandList.map(
      (definition) => `${definition.command} - ${definition.description}`,
    ),
    "",
    "Examples:",
    "/tasks overdue",
    "/addtask Call supplier about warehouse quote | priority high | due 2026-06-15",
    "/addpayment Fibergrate | amount 2500 | due 2026-06-15",
  ].join("\n");
