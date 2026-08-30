"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Show } from "@clerk/nextjs";

function Redirect({ to }: { to: string }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(to);
  }, [router, to]);

  return null;
}

interface RedirectSignedInProps {
  /** Where an already-authenticated visitor belongs instead. */
  to: string;
}

/**
 * Keeps authenticated users off the auth screens.
 *
 * The server guard in `app/(auth)/layout.tsx` handles the ordinary case. This
 * covers the race the server cannot see: Clerk establishing the session in the
 * browser after the request that rendered this page was already answered. Left
 * alone, that strands the visitor on a sign-in page whose form renders nothing,
 * because Clerk suppresses `<SignIn />` while a session is active.
 */
export function RedirectSignedIn({ to }: RedirectSignedInProps) {
  return (
    <Show when="signed-in">
      <Redirect to={to} />
    </Show>
  );
}
