import { Telegraf } from "telegraf";

import { env } from "../config/env.js";
import { formatCommandHelp, telegramBotCommands } from "./commands.js";
import { handleTelegramText } from "./messageHandler.js";

let activeBot: Telegraf | null = null;
let launchInProgress = false;

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

  for (const command of telegramBotCommands) {
    bot.command(command.command, async (ctx) => {
      await replyWithHandler(ctx.message.text, ctx.reply.bind(ctx), {
        chatId: ctx.chat.id,
        username: ctx.from?.username,
      });
    });
  }

  bot.help(async (ctx) => {
    await ctx.reply(formatCommandHelp());
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
  if (activeBot || launchInProgress) {
    console.warn("Telegram bot startup skipped because a bot instance is already active.");
    return activeBot;
  }

  launchInProgress = true;
  const bot = createTelegramBot();

  if (!bot) {
    launchInProgress = false;
    return null;
  }

  try {
    await bot.launch();
    activeBot = bot;
    await bot.telegram.setMyCommands(telegramBotCommands);
    console.log("Telegram bot is running.");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes("409")) {
      console.warn(
        "Telegram polling conflict detected. Stop duplicate backend/node processes before starting the bot again.",
      );
    }

    throw error;
  } finally {
    launchInProgress = false;
  }

  return bot;
};
