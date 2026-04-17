"use client";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { useProfile } from "@/components/auth/profile-context";
import { Card } from "@/components/ui/card";
export function ProfileSessionCard() {
  const { profile } = useProfile();

  if (!profile) {
    return null;
  }

  const profileTitle =
    profile === "reane" ? "Profil : Réane" : "Profil : Sacha";

  return (
    <Card className="rounded-[24px]">
      <h2 className="mb-5 text-xl font-semibold tracking-normal text-zinc-950">
        {profileTitle}
      </h2>
      <SignOutButton />
    </Card>
  );
}
