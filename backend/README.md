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

3. Update `.env` with your Supabase `DATABASE_URL` and `DIRECT_URL`. Add `OPENAI_API_KEY`, `TELEGRAM_BOT_TOKEN`, and `TELEGRAM_ALLOWED_USER_IDS` when those integrations are enabled.

   For Supabase shared pooler URLs, the username must include the project ref:

   ```bash
   DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[DATABASE_PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
   ```

   For Prisma migrations/introspection, prefer the direct connection when your network supports it:

   ```bash
   DIRECT_URL="postgresql://postgres:[DATABASE_PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"
   ```

   If direct IPv6 is unavailable locally, use the Supabase session pooler on port `5432` for `DIRECT_URL`.

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
ENABLE_TELEGRAM_BOT=false
```

Local development runs the API only by default. To test the bot locally, first stop or suspend the Render service, or use a separate development Telegram bot token. Then set `ENABLE_TELEGRAM_BOT=true`, start the backend with `npm run dev`, send `/start` to your Telegram bot, and copy the `Telegram chat ID` printed in the terminal. Add that value to `.env` as `TELEGRAM_MANAGER_CHAT_ID`.

When `TELEGRAM_MANAGER_CHAT_ID` is empty, the bot allows messages only in development mode so you can discover your chat ID safely.

## Production Runtime

Render is the production backend.

Render runs:

- Express/API server
- Telegram bot polling

Localhost is only for development.

Localhost runs:

- Express/API server only
- Telegram bot polling disabled by default

Required Render environment variable:

```bash
ENABLE_TELEGRAM_BOT=true
```

Required local development environment variable:

```bash
ENABLE_TELEGRAM_BOT=false
```

Telegram polling/getUpdates only allows one active polling process per bot token. If Render and localhost both run the same bot token, Telegram returns a 409 Conflict.

If local bot testing is needed, stop or suspend the Render service first, set `ENABLE_TELEGRAM_BOT=false` on Render temporarily, or use a separate development Telegram bot token.

If instant production responses are required, use an always-on Render service plan. Free web services may spin down after inactivity and cause delayed first responses.

## Prisma Commands

- `npm run prisma:generate` updates the generated Prisma client.
- `npm run prisma:migrate` creates and applies development migrations.
- `npm run prisma:seed` inserts sample projects, tasks, providers, payments, documents, users, and activity logs.
- `npm run prisma:studio` opens Prisma Studio for local database inspection.
