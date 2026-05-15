import "dotenv/config";

import { z } from "zod";

const optionalSecret = z
  .string()
  .trim()
  .min(1)
  .optional()
  .or(z.literal("").transform(() => undefined));

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  CORS_ORIGIN: z.string().trim().min(1).default("*"),
  DATABASE_URL: z.string().trim().min(1),
  OPENAI_API_KEY: optionalSecret,
  TELEGRAM_BOT_TOKEN: optionalSecret,
  TELEGRAM_ALLOWED_USER_IDS: z.string().trim().default(""),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment configuration:");
  console.error(z.prettifyError(parsedEnv.error));
  process.exit(1);
}

export const env = {
  ...parsedEnv.data,
  TELEGRAM_ALLOWED_USER_IDS: parsedEnv.data.TELEGRAM_ALLOWED_USER_IDS.split(",")
    .map((userId) => userId.trim())
    .filter(Boolean),
};

export type Env = typeof env;
