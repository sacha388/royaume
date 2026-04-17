"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useProfile } from "@/components/auth/profile-context";
import { consumeFlowRestart } from "@/lib/flow-restart";

type ProfileLandingRedirectProps = {
  children: ReactNode;
};

/**
 * Si un profil est déjà stocké localement, on évite de repasser par l’intro.
 */
export function ProfileLandingRedirect({ children }: ProfileLandingRedirectProps) {
  const router = useRouter();
  const { ready, profile } = useProfile();

  useEffect(() => {
    if (ready && consumeFlowRestart()) {
      return;
    }
    if (!ready || !profile) {
      return;
    }
    router.replace("/home");
  }, [ready, profile, router]);

  if (!ready) {
    return <div className="min-h-dvh w-full bg-background" />;
  }

  if (profile) {
    return null;
  }

  return children;
}
