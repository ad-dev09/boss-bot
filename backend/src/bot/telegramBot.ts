import { Telegraf } from "telegraf";

import { env } from "../config/env.js";
import { handleTelegramText } from "./messageHandler.js";

const startMessage = [
  "Hello Adrian. I am Jarvis AI Assistant.",
  "",
  "I can help track:",
  "- projects",
  "- tasks",
  "- payments",
  "- providers",
  "- documents",
  "- daily priorities",
  "",
  "Try:",
  "\"Show pending payments\"",
  "\"Create a task for tomorrow\"",
  "\"Summarize active projects\"",
].join("\n");

const helpMessage = [
  "Available commands:",
  "",
  "/projects - show active projects",
  "/tasks - show open tasks",
  "/payments - show pending payments",
  "/report - generate manager status report",
  "",
  "You can also type naturally:",
  "\"Add task: call supplier tomorrow\"",
  "\"What payments are overdue?\"",
  "\"Summarize the FRP grating project\"",
].join("\n");

const telegramCommands = [
  { command: "start", description: "Start Jarvis AI Assistant" },
  { command: "help", description: "Show available commands" },
  { command: "projects", description: "Show active projects" },
  { command: "tasks", description: "Show open tasks" },
  { command: "payments", description: "Show pending payments" },
  { command: "report", description: "Generate manager status report" },
];

const replyWithHandler = async (
  text: string,
  reply: (message: string) => Promise<unknown>,
  source?: { chatId?: number | string; username?: string },
) => {
  await reply(await handleTelegramText(text, source));
};

export const isAllowedUser = (chatId: number | string) => {
  const managerChatId = env.TELEGRAM_MANAGER_CHAT_ID.trim();

  if (!managerChatId) {
    return env.NODE_ENV === "development";
  }

  return String(chatId) === managerChatId;
};

export const createTelegramBot = () => {
  if (!env.TELEGRAM_BOT_TOKEN) {
    console.log("TELEGRAM_BOT_TOKEN is not set. Telegram bot startup skipped.");
    return null;
  }

  const bot = new Telegraf(env.TELEGRAM_BOT_TOKEN);

  bot.use(async (ctx, next) => {
    const chatId = ctx.chat?.id;

    if (chatId) {
      console.log(`Telegram chat ID: ${chatId}`);
    }

    if (!chatId || !isAllowedUser(chatId)) {
      await ctx.reply("You are not allowed to use this bot.");
      return;
    }

    await next();
  });

  bot.start(async (ctx) => {
    await ctx.reply(startMessage);
  });

  bot.help(async (ctx) => {
    await ctx.reply(helpMessage);
  });

  bot.command("projects", async (ctx) => {
    await replyWithHandler("/projects", ctx.reply.bind(ctx), {
      chatId: ctx.chat.id,
      username: ctx.from?.username,
    });
  });

  bot.command("tasks", async (ctx) => {
    await replyWithHandler("/tasks", ctx.reply.bind(ctx), {
      chatId: ctx.chat.id,
      username: ctx.from?.username,
    });
  });

  bot.command("payments", async (ctx) => {
    await replyWithHandler("/payments", ctx.reply.bind(ctx), {
      chatId: ctx.chat.id,
      username: ctx.from?.username,
    });
  });

  bot.command("report", async (ctx) => {
    await replyWithHandler("/report", ctx.reply.bind(ctx), {
      chatId: ctx.chat.id,
      username: ctx.from?.username,
    });
  });

  bot.on("message", async (ctx) => {
    if (!("text" in ctx.message)) {
      await ctx.reply("I can read text messages for now. Documents come next.");
      return;
    }

    await replyWithHandler(ctx.message.text, ctx.reply.bind(ctx), {
      chatId: ctx.chat.id,
      username: ctx.from?.username,
    });
  });

  bot.catch((error) => {
    console.error("Telegram bot error:", error);
  });

  return bot;
};

export const startTelegramBot = async () => {
  const bot = createTelegramBot();

  if (!bot) {
    return null;
  }

  await bot.launch();
  await bot.telegram.setMyCommands(telegramCommands);
  console.log("Telegram bot is running.");

  return bot;
};
