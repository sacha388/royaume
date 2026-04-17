"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useProfile } from "@/components/auth/profile-context";
import { hasFlowRestart } from "@/lib/flow-restart";

type RequireProfileProps = {
  children: ReactNode;
};

/**
 * Garde les routes du groupe (protected) : sans profil en localStorage, redirection /auth.
 */
export function RequireProfile({ children }: RequireProfileProps) {
  const router = useRouter();
  const { ready, profile } = useProfile();

  useEffect(() => {
    if (!ready) {
      return;
    }
    if (!profile) {
      router.replace(hasFlowRestart() ? "/" : "/auth");
    }
  }, [ready, profile, router]);

  if (!ready) {
    return (
      <div
        aria-hidden
        className="min-h-dvh w-full bg-background"
      />
    );
  }

  if (!profile) {
    return null;
  }

  return children;
}
