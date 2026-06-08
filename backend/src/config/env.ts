import "dotenv/config";

import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  PORT: z.coerce.number().int().positive().default(3000),
  CORS_ORIGIN: z.string().trim().min(1),
  DATABASE_URL: z.string().trim().min(1),
  DIRECT_URL: z.string().trim().min(1),
  OPENAI_API_KEY: z.string().trim().min(1),
  OPENAI_MODEL: z.string().trim().min(1),
  OPENAI_VECTOR_STORE_ID: z.string().trim().min(1),
  JWT_SECRET: z.string().trim().min(1),
  TELEGRAM_BOT_TOKEN: z.string().trim().default(""),
  TELEGRAM_MANAGER_CHAT_ID: z.string().trim().default(""),
  TELEGRAM_WEBHOOK_URL: z.string().trim().default(""),
  TELEGRAM_ALLOWED_USER_IDS: z.string().trim().default(""),
  ENABLE_TELEGRAM_BOT: z.string().trim().default("false"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment configuration:");
  console.error(z.prettifyError(parsedEnv.error));
  process.exit(1);
}

export const env = {
  ...parsedEnv.data,
  ENABLE_TELEGRAM_BOT: parsedEnv.data.ENABLE_TELEGRAM_BOT === "true",
  CORS_ORIGINS: parsedEnv.data.CORS_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  TELEGRAM_ALLOWED_USER_IDS: parsedEnv.data.TELEGRAM_ALLOWED_USER_IDS.split(",")
    .map((userId) => userId.trim())
    .filter(Boolean),
};

export type Env = typeof env;
