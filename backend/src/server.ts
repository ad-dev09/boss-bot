import { app } from "./app.js";
import { startTelegramBot } from "./bot/telegramBot.js";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";

const HOST = "0.0.0.0";

const server = app.listen(env.PORT, HOST, () => {
  console.log(`ManagerOps backend is running on ${HOST}:${env.PORT}`);
});

const bot = env.ENABLE_TELEGRAM_BOT
  ? await (async () => {
      if (!env.TELEGRAM_BOT_TOKEN) {
        console.error("Telegram bot polling is enabled but TELEGRAM_BOT_TOKEN is missing.");
        process.exit(1);
      }

      console.log("Telegram bot polling enabled. Starting bot...");
      return startTelegramBot();
    })()
  : null;

if (!env.ENABLE_TELEGRAM_BOT) {
  console.log("Telegram bot polling disabled. API server is running only.");
}

const shutdown = async (signal: string) => {
  console.log(`${signal} received. Shutting down ManagerOps backend...`);

  server.close(async () => {
    bot?.stop(signal);
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
