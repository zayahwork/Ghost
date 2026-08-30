import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { BrainCircuit, ScrollText, Share2 } from "lucide-react";
import { auth } from "@clerk/nextjs/server";

import { LiquidField } from "@/components/auth/liquid-field";
import { RedirectSignedIn } from "@/components/auth/redirect-signed-in";

const FEATURES = [
  {
    icon: BrainCircuit,
    title: "AI Architecture Generation",
    description:
      "Describe your system, AI maps it to nodes and edges on a live canvas.",
  },
  {
    icon: Share2,
    title: "Real-time Collaboration",
    description:
      "Live cursors, presence indicators, and shared node editing across your team.",
  },
  {
    icon: ScrollText,
    title: "Instant Spec Generation",
    description:
      "Export a complete Markdown technical spec directly from the canvas graph.",
  },
];

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated } = await auth();

  if (isAuthenticated) {
    redirect("/editor");
  }

  return (
    <div className="flex flex-1">
      {/* Catches a session that becomes active client-side after this render. */}
      <RedirectSignedIn to="/editor" />

      {/*
        Brand panel — large screens only. `@container` makes the panel itself the
        query container, so the title scales against the panel's own width rather
        than the viewport and cannot outgrow the column at any breakpoint.
      */}
      <section className="@container relative hidden w-1/2 max-w-xl flex-col justify-center overflow-hidden border-r border-surface-border bg-surface px-12 py-16 lg:flex">
        {/* Decorative background layer; the copy below sits above it. */}
        <LiquidField className="pointer-events-none absolute inset-0 h-full w-full" />

        <div className="relative">
          <h1 className="text-[clamp(3.25rem,16cqw,6rem)] font-bold leading-[0.9] tracking-tight text-copy-primary">
            Blueprint
          </h1>

          <p className="mt-5 text-base text-copy-secondary">
            A collaborative workspace for designing systems.
          </p>

          <ul className="mt-14 space-y-8">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-dim ring-1 ring-inset ring-brand/20">
                  <Icon className="h-5 w-5 text-brand" />
                </span>

                <div className="pt-0.5">
                  <p className="font-semibold leading-tight text-copy-primary">
                    {title}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-copy-secondary">
                    {description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="flex flex-1 items-center justify-center px-6 py-12">
        {children}
      </section>
    </div>
  );
}
