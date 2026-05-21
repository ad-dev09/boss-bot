# ManagerOps AI Assistant Backend

Node.js, Express, TypeScript, and Prisma backend for the ManagerOps AI Assistant.

## Running The Backend

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your local environment file:

   ```bash
   cp .env.example .env
   ```

3. Update `.env` with your Supabase `DATABASE_URL`. Add `OPENAI_API_KEY`, `TELEGRAM_BOT_TOKEN`, and `TELEGRAM_ALLOWED_USER_IDS` when those integrations are enabled.

4. Generate the Prisma client:

   ```bash
   npm run prisma:generate
   ```

5. Run database migrations after your `DATABASE_URL` is configured:

   ```bash
   npm run prisma:migrate
   ```

6. Add sample development data:

   ```bash
   npm run prisma:seed
   ```

7. Start the development server:

   ```bash
   npm run dev
   ```

8. Check the API:

   ```bash
   curl http://localhost:3000/health
   ```

## Current Structure

- `src/app.ts` configures Express middleware and routes.
- `src/server.ts` starts the HTTP server and disconnects Prisma during shutdown.
- `src/config/env.ts` validates environment variables with Zod.
- `src/config/prisma.ts` creates the shared Prisma client.
- `src/routes/health.ts` exposes `GET /health`.
- `prisma/schema.prisma` defines users, projects, tasks, providers, payments, documents, and activity logs.
- `prisma/seed.ts` creates sample development records for the core ManagerOps workflows.

Secrets must stay in `.env` and should never be hardcoded in source files.

## Admin User Seed

Set temporary admin credentials in your local shell before running the seed. Do not commit these values:

```bash
ADMIN_EMAIL="adrian@fullspectrumsupplies.com"
ADMIN_PASSWORD="temporary-password-here"
ADMIN_NAME="Adrian"
npx prisma db seed
```

The seed stores a bcrypt password hash for the admin user and never logs the password.

## Telegram Bot Setup

Add your bot token to `.env`:

```bash
TELEGRAM_BOT_TOKEN="your_bot_token"
TELEGRAM_MANAGER_CHAT_ID=""
```

Start the backend with `npm run dev`, send `/start` to your Telegram bot, then copy the `Telegram chat ID` printed in the terminal. Add that value to `.env` as `TELEGRAM_MANAGER_CHAT_ID`.

When `TELEGRAM_MANAGER_CHAT_ID` is empty, the bot allows messages only in development mode so you can discover your chat ID safely.

## Prisma Commands

- `npm run prisma:generate` updates the generated Prisma client.
- `npm run prisma:migrate` creates and applies development migrations.
- `npm run prisma:seed` inserts sample projects, tasks, providers, payments, documents, users, and activity logs.
- `npm run prisma:studio` opens Prisma Studio for local database inspection.
