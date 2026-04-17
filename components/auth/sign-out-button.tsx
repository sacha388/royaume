"use client";

import { useRouter } from "next/navigation";
import { useProfile } from "@/components/auth/profile-context";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
  const { logout } = useProfile();

  function handleLogout() {
    logout();
    router.replace("/auth");
  }

  return (
    <Button onClick={handleLogout} type="button" variant="secondary">
      Changer de profil
    </Button>
  );
}
