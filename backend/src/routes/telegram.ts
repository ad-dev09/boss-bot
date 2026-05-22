import { Router } from "express";

import { env } from "../config/env.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const telegramRouter = Router();

const commands = [
  { command: "/start", description: "Start Jarvis AI Assistant" },
  { command: "/help", description: "Show available commands" },
  { command: "/projects", description: "Show active projects" },
  { command: "/tasks", description: "Show open tasks" },
  { command: "/payments", description: "Show pending payments" },
  { command: "/providers", description: "Review provider follow-up" },
  { command: "/documents", description: "Review document status" },
  { command: "/today", description: "Show today's priorities" },
  { command: "/report", description: "Generate manager status report" },
  { command: "/addtask", description: "Create a task from chat" },
  { command: "/addpayment", description: "Record a payment reminder" },
  { command: "/status", description: "Check system status" },
];

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
        commands,
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
