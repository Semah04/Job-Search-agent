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

1. Open **Profile** and fill target roles, skills, locations, and paste your resume text.
2. On **Agent**, try prompts like:
   - `Load my profile and search remote TypeScript backend jobs`
   - `Score the results, persist the top matches, and save the best 3`
   - `Draft a cover letter for the highest scoring saved job`
   - `Mark that job as APPLIED`
3. Review saved roles under **Jobs** and status columns under **Tracker**.

The agent never auto-applies. You stay in control of submissions.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npx prisma studio` | Browse SQLite data |

## Repo

https://github.com/Semah04/Job-Search-agent
