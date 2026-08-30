import { dark } from "@clerk/ui/themes";

/**
 * Clerk appearance for the Ghost workspace.
 *
 * Clerk's `dark` theme is the base; every override below points at a token
 * declared in `app/globals.css` rather than a literal color. Clerk resolves
 * `var(...)` values natively wherever the browser supports modern color
 * functions, so the auth screens stay in sync with the rest of the palette.
 */
export const clerkAppearance = {
  theme: dark,
  variables: {
    colorBackground: "var(--bg-surface)",
    colorForeground: "var(--text-primary)",
    colorMuted: "var(--bg-subtle)",
    colorMutedForeground: "var(--text-muted)",
    colorPrimary: "var(--accent-primary)",
    colorPrimaryForeground: "var(--bg-base)",
    colorInput: "var(--bg-elevated)",
    colorInputForeground: "var(--text-primary)",
    colorNeutral: "var(--text-primary)",
    colorBorder: "var(--border-default)",
    colorRing: "var(--accent-primary)",
    colorDanger: "var(--state-error)",
    colorSuccess: "var(--state-success)",
    colorWarning: "var(--state-warning)",
    colorModalBackdrop: "var(--bg-base)",
    fontFamily: "var(--font-geist-sans)",
    fontFamilyMono: "var(--font-geist-mono)",
    borderRadius: "var(--radius)",
  },
};
