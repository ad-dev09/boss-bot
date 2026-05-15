import { app } from "./app.ts";
import { env } from "./config/env.ts";
import { prisma } from "./config/prisma.ts";

const server = app.listen(env.PORT, () => {
  console.log(`ManagerOps backend is running on port ${env.PORT}`);
});

const shutdown = async (signal: string) => {
  console.log(`${signal} received. Shutting down ManagerOps backend...`);

  server.close(async () => {
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
