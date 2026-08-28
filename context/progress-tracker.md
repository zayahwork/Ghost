# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Phase 1 — Foundation: design system and UI primitives

## Current Goal

- `01-design-system` is complete. Next goal is the following feature unit, to be defined in `context/feature-specs/`.

## Completed

- **01-design-system** — Design system and UI primitive components.
  - shadcn/ui initialized (`components.json`, style `radix-nova`, RSC on, `lucide` icon library, `@/*` aliases).
  - Primitives generated into `components/ui/`: `button`, `card`, `input`, `tabs`, `textarea`, `scroll-area`. Unmodified since generation.
  - `lucide-react` installed. Supporting deps: `radix-ui`, `class-variance-authority`, `clsx`, `tailwind-merge`, `tw-animate-css`, `shadcn`.
  - `lib/utils.ts` exports `cn()` (`twMerge(clsx(inputs))`).
  - `app/globals.css` rewritten: the full `ui-context.md` token table declared once on `:root`, exposed as Tailwind utilities via `@theme inline`.
  - Dark-only enforced — the generated light `:root` palette and the `.dark` override block were both removed, and `color-scheme: dark` is set.
  - `app/layout.tsx` carries `dark` on `<html>` so the `dark:` variants baked into the untouched primitives resolve.
  - Font tokens corrected: `--font-sans`/`--font-heading` → `--font-geist-sans`, `--font-mono` → `--font-geist-mono` (the generated file had a self-referential `--font-sans: var(--font-sans)`).

## In Progress

- None.

## Next Up

- Add the next planned feature unit here.

## Open Questions

- None outstanding for this unit.

## Architecture Decisions

- `components/ui/*` are protected foundation files per `ai-workflow-rules.md`. The Ghost palette reaches them entirely through the shadcn token contract (`--background`, `--foreground`, `--card`, `--primary`, ...) aliased to Ghost tokens in `globals.css` — no primitive is edited to restyle it.
- The theme is dark-only by construction rather than by default: tokens are declared once on `:root` with no light values and no `.dark` override. The `dark` class on `<html>` exists solely to activate `dark:` variants inside the generated primitives, not to switch themes.
- shadcn token mapping: `--background`→`--bg-base`, `--card`→`--bg-surface`, `--popover`→`--bg-elevated`, `--secondary`/`--muted`/`--accent`→`--bg-subtle`, `--primary`/`--ring`→`--accent-primary`, `--destructive`→`--state-error`, `--border`/`--input`→`--border-default`.
- The `shadcn` package is a runtime dependency because `globals.css` does `@import "shadcn/tailwind.css"` — required by the `radix-nova` style, not an accidental install.

## Session Notes

- Stack baseline: Next.js 16.3.3 (Turbopack), React 19.2.8, Tailwind CSS v4.3.3 via `@tailwindcss/postcss`, TypeScript strict, `@/*` aliased to the project root.
- Tailwind v4 has no `tailwind.config.ts` — `components.json` correctly has `tailwind.config: ""`. Theme tokens live in CSS under `@theme inline`.
- Ghost utility names available: `bg-base`, `bg-surface`, `bg-elevated`, `bg-subtle`, `border-surface-border`, `border-surface-border-subtle`, `text-copy-primary`, `text-copy-secondary`, `text-copy-muted`, `text-copy-faint`, `text-brand`, `bg-accent-dim`, `text-ai` / `bg-ai`, `text-ai-text`, `text-error`, `text-success`, `text-warning`.
- Add future primitives with the CLI (`npx shadcn@latest add <component>`), never hand-written.
- Verification performed: `tsc --noEmit` clean; `next build` prerendered a scratch route rendering all six primitives; built CSS contains zero `oklch(1 0 0)` (white) values and no `.dark` override block; the six documented utilities emit the correct `var(--*)` references; `cn()` asserted against conflict-resolution, conditional, object, and array cases.
