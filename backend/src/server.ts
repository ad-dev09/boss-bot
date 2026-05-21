import { app } from "./app.js";
import { startTelegramBot } from "./bot/telegramBot.js";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";

const HOST = "0.0.0.0";

const server = app.listen(env.PORT, HOST, () => {
  console.log(`ManagerOps backend is running on ${HOST}:${env.PORT}`);
});

const bot = await startTelegramBot();

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
