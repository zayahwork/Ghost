# Ghost

An architecture design planner.

Ghost is for the part of a project that happens before the code does: laying
out the pieces of a system, how they talk to each other, and what each one is
responsible for.

## Stack

- **Next.js 16** with React 19, App Router
- **Prisma 7** against Postgres, through the `@prisma/adapter-pg` driver adapter
- **Clerk** for authentication
- **Radix UI** primitives with Tailwind

## Running it

```bash
npm install
npm run dev
```

`postinstall` runs `prisma generate`, so the client is built for you on a fresh
install. The app comes up on http://localhost:3000.

You will need a Postgres connection string and Clerk keys in `.env` before the
app will start.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve a production build |
| `npm run lint` | ESLint |

## Repository layout

- `app/` - routes and pages
- `components/` - UI components
- `context/`, `hooks/`, `lib/` - state, hooks and shared helpers
- `prisma/` - schema and migrations
- `types/` - shared TypeScript types

## Agent instructions

`AGENTS.md` and `CLAUDE.md` hold the rules coding agents follow in this
repository. Read those before making changes with one.