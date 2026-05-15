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

## Prisma Commands

- `npm run prisma:generate` updates the generated Prisma client.
- `npm run prisma:migrate` creates and applies development migrations.
- `npm run prisma:seed` inserts sample projects, tasks, providers, payments, documents, users, and activity logs.
- `npm run prisma:studio` opens Prisma Studio for local database inspection.
