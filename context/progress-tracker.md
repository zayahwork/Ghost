# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Phase 2 — Editor chrome: navbar, project sidebar, and the shared dialog shell

## Current Goal

- `02-editor` is complete. Next goal is the following feature unit, to be defined in `context/feature-specs/`.

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

- **02-editor** — Editor chrome components in `components/editor/`.
  - `editor-navbar.tsx` — fixed `h-14` top bar, three equal-flex sections (left / center / right). Left holds the sidebar toggle, swapping `PanelLeftOpen` ↔ `PanelLeftClose` on `isSidebarOpen`; center renders an optional `title`; right is an empty reserved region. `bg-surface` with a `border-b border-surface-border`.
  - `project-sidebar.tsx` — `fixed inset-y-0 left-0 z-40 w-72` overlay that never participates in layout, so opening it does not push content. Slides in with `translate-x-0` / `-translate-x-full` over `transition-transform duration-300`. Header is `Projects` + close button; shadcn `Tabs` for `My Projects` / `Shared`, both rendering an icon + copy empty state inside a `ScrollArea`; full-width `New Project` button with `Plus` pinned to the bottom.
  - `editor-dialog.tsx` — shared dialog shell supporting `title`, `description`, and `footer` actions. No feature dialogs built.
  - `components/ui/dialog.tsx` added via `npx shadcn@latest add dialog`, unmodified. `button.tsx` was reported as skipped by the CLI and is unchanged.
  - `editor-shell.tsx` — client boundary that owns `isSidebarOpen` and composes the navbar, the sidebar, and a `<main>` region for route content.
  - `app/editor/layout.tsx` wraps `{children}` in `EditorShell`; `app/editor/page.tsx` is a placeholder standing in for the canvas. `/editor` prerenders as static.

## In Progress

- None.

## Next Up

- The canvas surface, which replaces the `app/editor/page.tsx` placeholder.

## Open Questions

- The navbar center section has no defined content. It currently renders an optional `title` string; the real content (project name, breadcrumb, presence) is undefined in the context files.
- The navbar right section is intentionally empty — its actions are undefined.
- `New Project` has no defined behavior yet. `ProjectSidebar` exposes an optional `onNewProject` callback and does nothing by default, per "do not build actual dialogs yet".

## Architecture Decisions

- `components/ui/*` are protected foundation files per `ai-workflow-rules.md`. The Ghost palette reaches them entirely through the shadcn token contract (`--background`, `--foreground`, `--card`, `--primary`, ...) aliased to Ghost tokens in `globals.css` — no primitive is edited to restyle it.
- The theme is dark-only by construction rather than by default: tokens are declared once on `:root` with no light values and no `.dark` override. The `dark` class on `<html>` exists solely to activate `dark:` variants inside the generated primitives, not to switch themes.
- shadcn token mapping: `--background`→`--bg-base`, `--card`→`--bg-surface`, `--popover`→`--bg-elevated`, `--secondary`/`--muted`/`--accent`→`--bg-subtle`, `--primary`/`--ring`→`--accent-primary`, `--destructive`→`--state-error`, `--border`/`--input`→`--border-default`.
- The `shadcn` package is a runtime dependency because `globals.css` does `@import "shadcn/tailwind.css"` — required by the `radix-nova` style, not an accidental install.
- `components/editor/*` are app-level composition, not foundation. The Ghost look for dialogs is applied by `EditorDialog` passing `className` overrides (`rounded-3xl`, `bg-elevated/95`, `backdrop-blur`, and a matching `rounded-b-3xl` on the footer, which the primitive hard-codes as `rounded-b-xl`) — the `components/ui/dialog.tsx` primitive stays untouched.
- The sidebar is an overlay, not a layout column. This is the invariant the spec asks for ("opening it should not push page content"), and it is why it uses `fixed` positioning plus a transform rather than an animated width.
- The closed sidebar uses React 19's `inert` attribute rather than only translating off-screen, so its controls are removed from the tab order and the accessibility tree while hidden.
- Both chrome components are `"use client"`: they own click handlers and, in the sidebar's case, the Radix `Tabs` state. They take open/close state as props rather than owning it; `EditorShell` is the single source of truth for sidebar state.
- Sidebar state lives in `EditorShell`, not in `app/editor/layout.tsx`. A route layout is a server component and cannot hold `useState`, so the client boundary is pushed down into one shell component — satisfying invariant 4 (client components only where interactivity requires them) while keeping the layout server-rendered.
- `/editor` is a placeholder route with no project scoping. The real workspace path (likely project-scoped) is undefined in the context files and belongs to a later unit.

## Session Notes

- Stack baseline: Next.js 16.3.3 (Turbopack), React 19.2.8, Tailwind CSS v4.3.3 via `@tailwindcss/postcss`, TypeScript strict, `@/*` aliased to the project root.
- Tailwind v4 has no `tailwind.config.ts` — `components.json` correctly has `tailwind.config: ""`. Theme tokens live in CSS under `@theme inline`.
- Ghost utility names available: `bg-base`, `bg-surface`, `bg-elevated`, `bg-subtle`, `border-surface-border`, `border-surface-border-subtle`, `text-copy-primary`, `text-copy-secondary`, `text-copy-muted`, `text-copy-faint`, `text-brand`, `bg-accent-dim`, `text-ai` / `bg-ai`, `text-ai-text`, `text-error`, `text-success`, `text-warning`.
- Add future primitives with the CLI (`npx shadcn@latest add <component>`), never hand-written.
- `02-editor` verification: `tsc --noEmit` clean; `next build` prerenders `/editor` with the chrome mounted; `eslint .` reports 0 errors and 0 warnings (the pre-existing unused `Button` import in `app/page.tsx` was deleted).
- `01-design-system` verification: `tsc --noEmit` clean; `next build` prerendered a scratch route rendering all six primitives; built CSS contains zero `oklch(1 0 0)` (white) values and no `.dark` override block; the six documented utilities emit the correct `var(--*)` references; `cn()` asserted against conflict-resolution, conditional, object, and array cases.
