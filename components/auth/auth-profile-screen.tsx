"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useProfile } from "@/components/auth/profile-context";
import { MobileShell } from "@/components/layout/mobile-shell";
import { hasFlowRestart } from "@/lib/flow-restart";
import { lemonCake } from "@/lib/fonts";
import { profilePhotoSrc } from "@/lib/profile-photos";
import { cn } from "@/lib/utils";
import type { ProfileId } from "@/types/profile";

const cardShadow =
  "shadow-[0_14px_36px_rgba(48,36,32,0.18),0_4px_14px_rgba(48,36,32,0.08)]";

/** Dimensions natives des PNG (3:2) — évite un crop arbitraire. */
const PROFILE_IMAGE_WIDTH = 1536;
const PROFILE_IMAGE_HEIGHT = 1024;

const profilePhotos: { id: ProfileId; alt: string }[] = [
  { id: "reane", alt: "Reane" },
  { id: "sacha", alt: "Sacha" },
];

export function AuthProfileScreen() {
  const router = useRouter();
  const { ready, profile, login } = useProfile();

  useEffect(() => {
    if (!ready || !hasFlowRestart()) {
      return;
    }

    router.replace("/");
  }, [ready, router]);

  useEffect(() => {
    if (!ready || !profile) {
      return;
    }
    router.replace("/home");
  }, [ready, profile, router]);

  useEffect(() => {
    if (!ready || profile) {
      return;
    }

    router.prefetch("/home");
  }, [ready, profile, router]);

  function handleChoose(id: ProfileId) {
    login(id);
    router.replace("/home");
  }

  if (!ready) {
    return (
      <div className="flex min-h-dvh justify-center bg-background">
        <div className="w-full max-w-[430px] px-5 pt-8">
          <div className="h-40 animate-pulse rounded-[24px] bg-zinc-200/60" />
        </div>
      </div>
    );
  }

  if (profile) {
    return null;
  }

  return (
    <MobileShell className="gap-4" fixedViewport>
      <header className="w-full shrink-0 pt-4">
        <h1
          className={`${lemonCake.className} m-0 w-full text-center text-4xl font-normal leading-[0.98] text-zinc-950 sm:text-5xl sm:leading-[1.02]`}
        >
          <span className="inline-block max-w-full px-2 tracking-tight">
            Qui utilise l&apos;app ?
          </span>
        </h1>
      </header>

      <div className="flex w-full max-w-full flex-col gap-4 pb-10 pt-2">
        {profilePhotos.map((item) => (
          <button
            aria-label={`Continuer en tant que ${item.alt}`}
            className={cn(
              "group w-full max-w-full shrink-0 touch-manipulation overflow-hidden rounded-[24px] border-[3px] border-white bg-white outline-none transition-[transform,opacity] focus-visible:ring-2 focus-visible:ring-[#c44f5d]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFDF9] active:scale-[0.98]",
              cardShadow,
            )}
            key={item.id}
            onClick={() => handleChoose(item.id)}
            type="button"
          >
            <Image
              alt=""
              className="h-auto w-full transition duration-200 group-active:opacity-95"
              draggable={false}
              height={PROFILE_IMAGE_HEIGHT}
              priority={item.id === "reane"}
              sizes="(max-width: 430px) calc(100vw - 2.5rem), min(390px, 100vw - 2.5rem)"
              src={profilePhotoSrc(item.id)}
              width={PROFILE_IMAGE_WIDTH}
            />
          </button>
        ))}
      </div>
    </MobileShell>
  );
}
