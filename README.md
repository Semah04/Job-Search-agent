# Job Search Agent

Next.js app with an AI agent that searches remote jobs (Remotive), ranks them against your profile, drafts cover letters, and tracks applications.

## Stack

- Next.js App Router + TypeScript + Tailwind
- Vercel AI SDK (`ai` + `@ai-sdk/openai` + `@ai-sdk/react`)
- Prisma + SQLite
- Remotive public API (no key required)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy env and add your OpenAI key:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
DATABASE_URL="file:./dev.db"
OPENAI_API_KEY="sk-..."
```

Also keep `DATABASE_URL` in `.env` for Prisma CLI (created by `prisma init`).

3. Create the database:

```bash
npx prisma migrate dev --name init
```

4. Run the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How to use

1. Copy env and set at least the database URL:

```bash
cp .env.example .env.local
```

2. (Recommended, free) Add a Google Gemini key in `.env.local`:

Get a key: [Google AI Studio](https://aistudio.google.com/apikey)

```
GOOGLE_GENERATIVE_AI_API_KEY="AIza..."
```

OpenAI still works if you prefer (`OPENAI_API_KEY`). Without any key, the app runs in **offline agent mode** (Remotive search + keyword scoring).

3. Open **Profile** and fill target roles, skills, locations, and paste your resume text.
4. On **Agent**, try prompts like:
   - `Search remote TypeScript backend jobs and save the top 5`
   - `Draft a cover letter for the best saved job`
   - `Mark that job as APPLIED`
5. Or use **Jobs → Quick search** (no AI required).
6. Review **Tracker** for application status.

The agent never auto-applies. You stay in control of submissions.

Note: Remotive’s free public API returns a small delayed job sample; filters are refined client-side.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npx prisma studio` | Browse SQLite data |

## Repo

https://github.com/Semah04/Job-Search-agent
