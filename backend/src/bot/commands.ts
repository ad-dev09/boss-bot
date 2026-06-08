export type TelegramCommandKey =
  | "start"
  | "help"
  | "guide"
  | "manual"
  | "instructions"
  | "projects"
  | "tasks"
  | "payments"
  | "providers"
  | "documents"
  | "today"
  | "report"
  | "addtask"
  | "addpayment"
  | "addproject"
  | "addprovider"
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
    description: "Show quick command list",
    requiresOpenAI: false,
  },
  guide: {
    key: "guide",
    command: "/guide",
    description: "Show full user guide",
    requiresOpenAI: false,
  },
  manual: {
    key: "manual",
    command: "/manual",
    description: "Show full user guide",
    requiresOpenAI: false,
  },
  instructions: {
    key: "instructions",
    command: "/instructions",
    description: "Show full user guide",
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
  addproject: {
    key: "addproject",
    command: "/addproject",
    description: "Create a project",
    requiresOpenAI: false,
  },
  addprovider: {
    key: "addprovider",
    command: "/addprovider",
    description: "Create a provider",
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
