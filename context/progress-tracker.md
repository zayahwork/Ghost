# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Phase 4 — Project dialogs: the `/editor` home screen, create / rename / delete dialogs, and sidebar project actions

## Current Goal

- `04-project-dialogs` is complete. Next goal is the canvas surface, which replaces the `EditorHome` empty state once a project is open.

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

- **03-auth** — Clerk wired into the app.
  - `@clerk/ui@1.31.0` installed for `@clerk/ui/themes`; `@clerk/nextjs@7.8.3` was already present.
  - `lib/clerk-appearance.ts` — Clerk's `dark` theme as the base, with 18 appearance variables overridden to `var(--*)` tokens from `globals.css`. No hardcoded colors.
  - `app/layout.tsx` wraps `<html>` in `ClerkProvider` with that appearance.
  - `proxy.ts` at the project root (not `middleware.ts`) — `clerkMiddleware` + `createRouteMatcher`. Public routes come from the sign-in / sign-up env vars; everything else calls `auth.protect()`.
  - `app/(auth)/layout.tsx` — two-panel auth shell: brand panel (the `Blueprint` wordmark at `text-6xl font-bold`, tagline, and three icon + title + description feature rows, layered over a `LiquidField` canvas) gated behind `lg:`, centered Clerk form on the right, form-only below `lg`. No CSS gradient backgrounds, hero, or cards.
  - `app/(auth)/sign-in/[[...sign-in]]/page.tsx` and `app/(auth)/sign-up/[[...sign-up]]/page.tsx` render Clerk's `<SignIn />` / `<SignUp />` unmodified.
  - `app/page.tsx` — server component that redirects to `/editor` when signed in and `/sign-in` when not.
  - `UserButton` added to the navbar right section, replacing the reserved empty region.
  - Post-sign-in destination: `<SignIn />` / `<SignUp />` take `forceRedirectUrl="/editor"`, so completing either flow lands on the editor directly instead of routing back through `/`.
  - Hardening added while chasing the blank-sign-in-screen bug (see Session Notes — the actual cause was environmental, not any of this). Kept because each is correct on its own merits:
    - `app/(auth)/layout.tsx` is `async` and calls `auth()`; an authenticated visitor is redirected to `/editor` before the panel renders.
    - `components/auth/redirect-signed-in.tsx` — `<Show when="signed-in">` wrapping a `router.replace()` effect, rendered by the auth layout. Bounces a signed-in visitor who navigates back to `/sign-in` instead of showing them the empty form area Clerk renders when a session is already active.
    - `<Show when="signed-in">` also wraps `UserButton` in the navbar so the right section stays empty until a session exists rather than flashing a placeholder.

- **04-project-dialogs** — editor home screen, project dialogs, and sidebar project actions. Mock data only; no API calls or persistence.
  - `types/project.ts` — `Project` (`id`, `name`, `slug`, `role`) and `ProjectRole` (`owner` | `collaborator`). `role` is what gates the sidebar item actions.
  - `lib/mock-projects.ts` — `MOCK_PROJECTS`: three owned, two collaborator projects. The only project data in the app until the projects API exists.
  - `lib/slug.ts` — `slugify()`: NFKD-normalize, strip combining marks, lowercase, collapse every non-alphanumeric run to `-`, trim leading/trailing `-`. Drives the live slug preview.
  - `hooks/use-project-dialogs.ts` — the dedicated hook the spec asks for. Owns dialog state (`openDialog`, `targetProject`), form state (`name`), and loading state (`isSubmitting`), plus `openCreate` / `openRename` / `openDelete` / `close` / `submit`. Returns one `useMemo`'d object so it can be passed through context without re-rendering consumers on every shell render.
  - `components/editor/create-project-dialog.tsx` — name input plus a live `slugify(name)` preview that updates on every keystroke, falling back to `your-project` while the field is empty. Submit is disabled on a blank name.
  - `components/editor/rename-project-dialog.tsx` — input prefilled with the current name and `autoFocus`ed; the description carries the current name (`Currently named "…"`). Save is disabled while the name is blank or unchanged.
  - `components/editor/delete-project-dialog.tsx` — confirmation only, no fields; the confirm button is `variant="destructive"`.
  - `components/editor/project-dialogs-context.tsx` — `ProjectDialogsProvider` + `useProjectDialogsContext()`, so route content inside the shell can open a dialog.
  - `components/editor/editor-home.tsx` — heading, description, and a `Plus` + `New Project` button wired to `openCreate`. Centered, uncarded, rendered by `app/editor/page.tsx` (still a server component).
  - `project-sidebar.tsx` — now takes `projects` and renders them split by `role` across the existing `My Projects` / `Shared` tabs, each row showing name over slug. Owner rows carry `Pencil` / `Trash2` icon buttons; collaborator rows carry none. The empty states are kept for when a tab has no projects.
  - Mobile scrim: a full-screen `md:hidden` `<button>` behind the panel (`z-30` under the sidebar's `z-40`) that closes it on tap.
  - `editor-shell.tsx` — calls `useProjectDialogs()`, passes the three openers to the sidebar, provides the state to `children`, and renders the three dialogs.

## In Progress

- None.

## Next Up

- The canvas surface, which replaces the `app/editor/page.tsx` placeholder.

## Open Questions

- The navbar center section has no defined content. It currently renders an optional `title` string; the real content (project name, breadcrumb, presence) is undefined in the context files.
- Selecting a project has no defined behavior. Sidebar rows render name, slug, and owner actions but are not clickable — the spec defines only the create / rename / delete wiring, and the project workspace route does not exist yet.
- Dialog confirm actions have no effect beyond closing the dialog. `04-project.dialoges.md` scopes this unit to mock data with no persistence, so `MOCK_PROJECTS` is never mutated by a create, rename, or delete.

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
- Auth is deny-by-default: `proxy.ts` calls `auth.protect()` on every route that is not the sign-in or sign-up path, so new routes are protected the moment they are added rather than needing to opt in.
- Public routes are derived from `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `NEXT_PUBLIC_CLERK_SIGN_UP_URL` (with `/sign-in` and `/sign-up` fallbacks) so the proxy matcher and Clerk's own redirect targets cannot drift apart.
- `/` is a protected route rather than a public landing page. Unauthenticated visitors are bounced to sign-in by the proxy before the page runs; the page itself only handles the signed-in case, redirecting to `/editor`.
- Clerk appearance is configured once on `ClerkProvider` and inherited by every Clerk component, so `SignIn`, `SignUp`, and `UserButton` are themed without touching Clerk internals.
- Clerk appearance variables hold `var(--*)` references, not resolved colors. Clerk passes `var(...)` straight through on browsers with modern color support and falls back to its own defaults elsewhere — verified in `@clerk/ui`'s `removeInvalidValues`.
- The auth routes are guarded on both sides of the client boundary, because the two guards fail in different situations. The server check in `app/(auth)/layout.tsx` cannot see a session Clerk establishes in the browser after the request was answered; `<Show when="signed-in">` cannot run before hydration. Together they cover the gap that produced the blank sign-in screen.
- `<Show>` is presence-based rendering, not navigation — it decides what renders, never where the visitor goes. `RedirectSignedIn` therefore pairs it with an explicit `router.replace()`; `<Show>` alone would have hidden the form without moving anyone off the page.
- Sign-in always lands on `/editor` and never resumes the originally requested URL. `forceRedirectUrl` discards the `redirect_url` the proxy attaches, which is the intended behaviour while `/editor` is the only destination in the app. Revisit this when project-scoped routes exist: deep-linking into a specific project will need `fallbackRedirectUrl` (or a redirect target computed per request) so the captured URL is honoured again.

- The auth brand panel's background is a canvas, not CSS. `components/auth/liquid-field.tsx` draws dark glass bubbles rising bottom to top. CSS cannot express the part that matters — two bubbles fusing into one outline — because that needs a shape recomputed from the whole set every frame, not per-element animation.
- The fused shapes are a metaball field resolved with marching squares, not overlapping circles. Each bubble adds `(1 - d²/R²)³` to a 7px scalar grid; the frame draws the `0.42` iso-contour of that grid. Drawing circles with a blur/contrast "gooey" filter would fuse the fills but could not produce the single continuous chrome rim around a merged shape, which is the whole point of the effect. `INFLUENCE = 2` puts a lone bubble's surface exactly on its own radius and makes two bubbles fuse once their centers close to ~2.55 radii.
- Contour crossings are keyed by grid edge id, not by coordinate. Two cells sharing an edge interpolate the same two field values with the same expression, so they name the same integer id — the chain links up exactly, with no float comparison, string hashing, or per-frame allocation to link segments into loops.
- The sampling grid is padded by `3 × RADIUS_MAX` on every side and bubbles dissolve to zero radius before the top edge, so every contour closes inside the grid. This is what makes it safe to assume closed loops when tracing; without it a bubble spawned below the panel would trace an open chain that cannot be filled or stroked correctly.
- Marching squares runs only over the cells bubbles actually touched, tracked as a bounding box during field accumulation. That is what keeps the padded grid affordable: measured over 200 frames at the full 22-bubble population on a 560×900 panel, field build plus trace averages 0.42ms and peaks at 1.75ms, inside the 4.17ms budget of a 240Hz frame.
- `LiquidField` reads its colors from the theme at mount (`getComputedStyle` over `--bg-subtle`, `--bg-base`, `--bg-elevated`, and the four text tokens) rather than taking hex values. A canvas cannot consume Tailwind utilities, so this is how the "no hardcoded colors" rule is honoured on a `2d` context; `parseColor` handles `#rgb`, `#rrggbb`, and `rgb()/rgba()` forms and falls back to the palette baked into `FALLBACK_COLORS` if a token is missing. The silver chrome ramp is the four text tokens (`--text-primary` → `--text-faint`), which is why it reads as brushed metal without introducing a color outside the system.
- The chrome rim is a bright / dark / bright gradient along the shape, not a flat silver stroke. A single-color outline reads as a drawn line; the banding is what makes it read as a polished edge. The glass read is completed by two more passes inside a clip of the same path — a broad specular bloom in the upper left, and the outline again nudged 1.4px down so light catches the inside of the top edge.
- The field is decorative and yields to the visitor: `aria-hidden` plus `pointer-events-none`, the loop stops on `visibilitychange` when the tab is hidden, and `prefers-reduced-motion: reduce` renders one static frame instead of animating. The motion query is watched live, so toggling the OS setting takes effect without a reload.
- Nothing in the loop is frame-rate coupled: motion integrates against a delta clamped to 50ms and `requestAnimationFrame` is never throttled to 60, so the animation runs at whatever the display refreshes at.
- Bubble count is derived from panel area (one per ~34000 css px², clamped 6–22) and recomputed by a `ResizeObserver`, which also re-scales the backing store to `devicePixelRatio`. Density therefore stays constant across window sizes rather than thinning out on wide screens.
- The `Ghost` lucide icon was dropped from the auth panel and the wordmark reads `Blueprint`, set in plain `text-copy-primary` — the token that renders as the theme's white (`#f0f0f4`); `text-white` would have been a raw Tailwind color, which `code-standards.md` forbids.

- Project dialog state lives in one hook (`useProjectDialogs`) rather than in each dialog. Three dialogs act on the same two things — a target project and a name field — and only one can be open at a time, so a single `openDialog` discriminator plus a shared `name` is the honest model. It also means the dialogs are presentational: they receive `open`, values, and callbacks, and hold no state of their own.
- `EditorShell` owns that hook and hands it to route content through `ProjectDialogsProvider`, because `app/editor/layout.tsx` is a server component and cannot pass a callback down to `children`. Context is the only path from the shell's state to a page rendered inside it.
- `submit(action?)` takes an optional async action instead of being a bare close. There is nothing to await while the data is mocked, but this is the single place the projects API attaches later, and it is what makes `isSubmitting` a real flag rather than decoration.
- Dialog forms live in the `EditorDialog` body while their submit buttons live in the footer, associated by `form={FORM_ID}`. `EditorDialog` renders `children` and `footer` as siblings, so this is what gives both dialogs Enter-to-submit without restyling the shell or duplicating the footer per dialog.
- Sidebar item actions are inline `Pencil` / `Trash2` icon buttons revealed by `group-hover` / `group-focus-within`, not a dropdown menu. Two actions do not justify pulling in another primitive, and `opacity-0` (rather than conditional rendering) keeps them in the tab order so the keyboard path works while they are visually hidden.
- Owner actions are gated on `project.role === "owner"` inside `ProjectListItem`, not on which tab is rendering. The tab split is presentation; the role is the fact, and it is the same field the API will return.
- The mobile scrim is a `<button>`, not a `<div onClick>`. It needs to be dismissible by tap, and a button gets keyboard and screen-reader behavior for free instead of needing key handlers and an ARIA role bolted on.

## Session Notes

- Stack baseline: Next.js 16.3.3 (Turbopack), React 19.2.8, Tailwind CSS v4.3.3 via `@tailwindcss/postcss`, TypeScript strict, `@/*` aliased to the project root.
- **Clock skew broke auth, and looked exactly like a Clerk bug.** Symptom: sign-in succeeded, then the browser landed back on `/sign-in?redirect_url=...%2Feditor` showing the brand panel beside an empty form area. Cause: the machine clock was **353 seconds behind** Clerk's server. Clerk stamps the session JWT's `iat` / `nbf` at its own clock; server-side validation ran against the local clock, saw a token issued ~6 minutes in the future, and rejected it — `DEFAULT_CLOCK_SKEW_IN_MS` in `@clerk/backend` is **5 seconds**. So `auth.protect()` in `proxy.ts` treated an authenticated visitor as signed out and bounced them to `/sign-in`, where `<SignIn />` renders nothing because the browser session *is* active. Fixed by syncing the system clock (`w32tm /resync`, or Settings → Time & language → "Sync now").
  - Diagnostic that found it, worth reaching for first next time a session works in the browser but not on the server: compare the local clock to the Clerk instance's `Date` response header — `curl -sI https://<your-instance>.clerk.accounts.dev/` — and check the gap against the 5s tolerance.
  - Tell for this class of bug: the split between client and server. The form renders and sign-in succeeds (no JWT validation needed), but every server-side `auth()` / `auth.protect()` call disagrees. Check session *validation* before touching redirect configuration — two rounds of redirect changes were spent here before the clock was checked, and none of them could have fixed it.
- Tailwind v4 has no `tailwind.config.ts` — `components.json` correctly has `tailwind.config: ""`. Theme tokens live in CSS under `@theme inline`.
- Ghost utility names available: `bg-base`, `bg-surface`, `bg-elevated`, `bg-subtle`, `border-surface-border`, `border-surface-border-subtle`, `text-copy-primary`, `text-copy-secondary`, `text-copy-muted`, `text-copy-faint`, `text-brand`, `bg-accent-dim`, `text-ai` / `bg-ai`, `text-ai-text`, `text-error`, `text-success`, `text-warning`.
- Add future primitives with the CLI (`npx shadcn@latest add <component>`), never hand-written.
- `03-auth` verification: `next build` passes; the route table shows `�ƒ Proxy (Middleware)`, confirming Next picked up `proxy.ts`. Against `next start`, unauthenticated `GET /` and `GET /editor` both return 307 to `/sign-in`, while `/sign-in` and `/sign-up` return 200. The rendered sign-in HTML contains all 14 expected `var(--*)` references and no hex, `rgb()`, or raw Tailwind palette colors. `eslint .` reports 0 errors and 0 warnings.
- Post-sign-in destination is set in code (`forceRedirectUrl`), not via `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` / `..._FORCE_REDIRECT_URL`. Those env vars remain unset, so the props are the single source of truth and travel with the repo rather than living in a gitignored file.
- Signed-in-guard verification: `next build` passes; `eslint .` reports 0 errors and 0 warnings. Against `next start` while signed out, `/` and `/editor` still 307 to `/sign-in`, and `/sign-in` and `/sign-up` still return 200 with the brand panel intact. The signed-in path was confirmed manually in the browser once the clock skew below was corrected: sign-in now lands on `/editor`.
- `.env.local` gained `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in` and `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`. Only the two Clerk keys existed before; without these, `auth.protect()` redirects to Clerk's hosted Account Portal instead of the local auth pages. Standard Clerk names — nothing renamed or invented. `.env*` is gitignored, so this is local-only and must be set again in any other environment.
- `02-editor` verification: `tsc --noEmit` clean; `next build` prerenders `/editor` with the chrome mounted; `eslint .` reports 0 errors and 0 warnings (the pre-existing unused `Button` import in `app/page.tsx` was deleted).
- `01-design-system` verification: `tsc --noEmit` clean; `next build` prerendered a scratch route rendering all six primitives; built CSS contains zero `oklch(1 0 0)` (white) values and no `.dark` override block; the six documented utilities emit the correct `var(--*)` references; `cn()` asserted against conflict-resolution, conditional, object, and array cases.
- Auth brand panel verification: `tsc --noEmit` clean, `eslint .` reports 0 errors and 0 warnings, and `next build` compiles with `/sign-in` and `/sign-up` still server-rendered on demand and `�ƒ Proxy (Middleware)` intact. The rendered sign-in HTML carries the decorative `<canvas aria-hidden="true">` layer and no longer contains `lucide-ghost`.
- The contour tracer was verified with a standalone harness rather than by eye, since a wrong marching-squares case table shows up only as visual garbage. Copying the field build and trace body verbatim into Node asserted: a lone bubble traces exactly one closed loop whose points sit on its nominal radius (39.98-40.14 for a radius of 40); bubbles inside the fusion distance collapse to a single loop spanning both; bubbles beyond it stay two; and a bubble spawned below the panel still closes inside the padded grid. Zero open chains in every case. The harness was throwaway and is not in the repo — rebuild it the same way (copy the field build and trace body into a Node script, swap `paint` for a collector) before changing `CELL`, `THRESHOLD`, `INFLUENCE`, or the case table.
- `04-project-dialogs` verification: `tsc --noEmit` clean; `eslint .` reports 0 errors and 0 warnings; `next build` compiles and `/editor` still prerenders as static with `ƒ Proxy (Middleware)` intact. The prerendered `/editor` HTML carries the heading, the description, both `New Project` buttons (home + sidebar), the three owned projects with `Rename …` / `Delete …` labels, and no collaborator project — Radix `TabsContent` unmounts the inactive `Shared` tab, so those rows appear only once the tab is selected. `slugify` was checked against spaced, padded, accented, punctuation-heavy, underscored, all-separator, and single-character input.
- The dialogs themselves were verified by build and static output, not in a browser — there is no test runner in the repo and `/editor` sits behind Clerk. Open-and-type behavior (live slug preview, rename autofocus, Enter submit) is worth one manual pass in the browser before the next unit builds on it.
- The auth panel now says `Blueprint` while `app/layout.tsx` metadata, this repo, and every context file still say Ghost AI. That split is deliberate and unresolved: only the panel wordmark was asked for. If Blueprint is the real product name, the rename has to cover the `<title>`, `project-overview.md`, and the context docs together.
