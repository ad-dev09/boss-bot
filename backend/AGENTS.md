# ManagerOps AI Assistant - Codex Instructions

You are helping build a production-ready Telegram AI assistant for business project management.

## Main Goal

Build a backend system that connects:
- Telegram Bot API
- OpenAI Responses API
- OpenAI File Search / vector stores
- Supabase PostgreSQL through Prisma
- Lovable React frontend

## Coding Rules

- Use TypeScript.
- Use Express for backend routes.
- Use Prisma for database access.
- Keep business logic inside module service files.
- Do not put all logic inside server.ts.
- Use environment variables for all secrets.
- Never hardcode API keys.
- Add error handling to every route.
- Add clear comments for beginner developers.
- Prefer simple, readable code over complex architecture.
- Every new feature should include a short explanation in README.md.

## Architecture Rules

Use this folder structure:

src/
- app.ts
- server.ts
- config/
- bot/
- ai/
- modules/
- routes/
- middleware/
- utils/
- types/

## AI Assistant Rules

The assistant must:
- Answer from the database for projects, tasks, payments, providers.
- Use OpenAI File Search for document questions.
- Never invent payment status, amounts, dates, or supplier details.
- If information is missing, say it is missing.
- Ask a follow-up only when required.
- Keep answers concise for Telegram.
- Provide action summaries after creating or updating records.

## Telegram Rules

The Telegram bot should support:
- /start
- /help
- /projects
- /tasks
- /payments
- /report

The bot should also understand natural language messages.

## Security Rules

- Only allow approved Telegram user IDs.
- Add an allowlist check before processing messages.
- Store secrets in .env.
- Validate user input.
- Log important actions.
- Never expose internal IDs unless needed for admin debugging.

## Testing Rules

After making changes:
- Run TypeScript check.
- Run Prisma generate.
- Run available tests.
- Verify the server starts.