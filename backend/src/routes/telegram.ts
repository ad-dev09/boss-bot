import { Router } from "express";

import { commandList } from "../bot/commands.js";
import { getTelegramCommandSupportMatrix } from "../bot/messageHandler.js";
import { env } from "../config/env.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const telegramRouter = Router();

telegramRouter.get(
  "/status",
  asyncHandler(async (_req, res) => {
    const botTokenConfigured = Boolean(env.TELEGRAM_BOT_TOKEN);
    const managerChatConfigured = Boolean(env.TELEGRAM_MANAGER_CHAT_ID);
    const webhookConfigured = Boolean(env.TELEGRAM_WEBHOOK_URL);

    res.json({
      data: {
        status: botTokenConfigured && managerChatConfigured ? "connected" : "needs_setup",
        botUsername: null,
        webhookStatus: webhookConfigured ? "configured" : "polling",
        lastMessageReceived: null,
        lastSyncTime: new Date().toISOString(),
        backendStatus: "online",
        environment: {
          botToken: botTokenConfigured ? "configured" : "missing",
          managerChatId: managerChatConfigured ? "configured" : "missing",
          webhookUrl: webhookConfigured ? "configured" : "missing",
        },
        commands: commandList,
        commandSupport: getTelegramCommandSupportMatrix(),
      },
    });
  }),
);

telegramRouter.get(
  "/logs",
  asyncHandler(async (_req, res) => {
    res.json({
      data: [
        {
          id: "telegram-runtime",
          level: "info",
          message: "Telegram bot runtime is managed by the backend process.",
          timestamp: new Date().toISOString(),
        },
      ],
    });
  }),
);

telegramRouter.post(
  "/test",
  asyncHandler(async (_req, res) => {
    res.json({
      data: {
        message: "Telegram test endpoint reached. Use Telegram chat to verify live message delivery.",
      },
    });
  }),
);

telegramRouter.post(
  "/webhook/setup",
  asyncHandler(async (_req, res) => {
    // TODO: Wire this to Telegram setWebhook if the deployment moves from polling to webhook mode.
    res.status(202).json({
      data: {
        message: env.TELEGRAM_WEBHOOK_URL
          ? "Webhook URL is configured. Automatic setup is not enabled yet."
          : "Webhook URL is missing. Current backend uses polling mode.",
      },
    });
  }),
);
