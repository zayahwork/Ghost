Cleark is already installed and connected. Wire it into the Next.js app: provider, auth pages, redirects, route protection, and user menu.

## Design

Use Clerk's 'dark' theme from '@clerk/ui/themes' as the base.

Override Clerk appearance variables using the app's existing CSS variables. Do not hardcode colors.

Sign-in and sign-up pages:

- large screens: simple two-panel layout
- left: the `Blueprint` wordmark as large bold white text, tagline, and a three-item feature list of icon + title + description rows, layered over an ambient background animation of dark glass bubbles rising bottom to top and fusing into curved liquid shapes
- right: centered Clerk form
- small screens: form only
- no gradiants on the layout itself — the panel stays flat `bg-surface`. The gradients inside the bubble canvas are what make the glass and chrome read, and are scoped to that decorative layer
- no oversized hero section
- no feature cards — the feature rows are an icon tile plus copy, with no container, border, or surface of their own
- no scroll-heavy layout

Keep the layout minimal and professional

## Implemenation

Wrap the root layout with 'ClerkProvider' using Clerk's 'dark' theme.

Create sign-in and sing-up using Clerk components.

Use 'proxy.ts' at the project root, not 'middleware.ts'

Define public routes using the existing sign-in and sign-up env vars. Protect everything else by default.

Update '/':

- authenticated users redirect to '/editor'
- unathenticated users redirect to '/sign-in'

Add Clerk's built-in 'UserButton' to the editor navbar right section for profile settings and logout.

Keep Clear's deualt user menu and profile flows intact. Do not rebuild or heavily customize Clerk internals.

Use existing clerk env vars. Do not rename or invest new ones

## Dependencies

install: @clerk/ui

- 'proxy.ts' exists at the root
- all routes are protected except public auth paths
- auth pages use CSS variables with no hardcoded colors
- 'ClerkProvider' wraps the root layout
- 'npm run build' passes