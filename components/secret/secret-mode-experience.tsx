"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  SECRET_ACTIONS,
  SECRET_TRUTHS,
  type SecretCard,
  type SecretCardKind,
} from "@/lib/secret-mode-content";
import { hasSecretModeAccess } from "@/lib/secret-mode-access";
import { cn } from "@/lib/utils";

const ROLL_DELAYS_MS = [70, 85, 100, 120, 145, 175, 210, 255, 315, 390, 480, 590] as const;

function BackArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M15 18 9 12l6-6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function triggerHaptic(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

function pickRandomPrompt(list: readonly string[], exclude?: string): string {
  const pool = exclude ? list.filter((item) => item !== exclude) : [...list];
  const source = pool.length > 0 ? pool : [...list];
  return source[Math.floor(Math.random() * source.length)] ?? list[0] ?? "";
}

function buildNextCard(previous: SecretCard | null): SecretCard {
  const kind: SecretCardKind = Math.random() < 0.5 ? "action" : "truth";
  if (kind === "action") {
    return {
      kind,
      prompt: pickRandomPrompt(
        SECRET_ACTIONS,
        previous?.kind === "action" ? previous.prompt : undefined,
      ),
    };
  }
  return {
    kind,
    prompt: pickRandomPrompt(
      SECRET_TRUTHS,
      previous?.kind === "truth" ? previous.prompt : undefined,
    ),
  };
}

export function SecretModeExperience() {
  const router = useRouter();
  const [currentCard, setCurrentCard] = useState<SecretCard | null>(null);
  const [previewKind, setPreviewKind] = useState<SecretCardKind>("action");
  const [isRolling, setIsRolling] = useState(false);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const timeoutsRef = useRef<number[]>([]);

  useEffect(() => {
    const allowed = hasSecretModeAccess();
    if (!allowed) {
      router.replace("/home");
      const timeoutId = window.setTimeout(() => setAuthorized(false), 0);
      return () => window.clearTimeout(timeoutId);
    }
    const timeoutId = window.setTimeout(() => setAuthorized(true), 0);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [router]);

  useEffect(() => {
    return () => {
      for (const timeoutId of timeoutsRef.current) {
        window.clearTimeout(timeoutId);
      }
      timeoutsRef.current = [];
    };
  }, []);

  function scheduleTimeout(callback: () => void, delay: number) {
    const timeoutId = window.setTimeout(callback, delay);
    timeoutsRef.current.push(timeoutId);
  }

  function launchDraw() {
    if (isRolling) {
      return;
    }

    for (const timeoutId of timeoutsRef.current) {
      window.clearTimeout(timeoutId);
    }
    timeoutsRef.current = [];

    setCurrentCard(null);
    setIsRolling(true);

    let totalDelay = 0;
    let localPreview: SecretCardKind = previewKind;

    for (const stepDelay of ROLL_DELAYS_MS) {
      totalDelay += stepDelay;
      scheduleTimeout(() => {
        localPreview = localPreview === "action" ? "truth" : "action";
        setPreviewKind(localPreview);
        triggerHaptic(8);
      }, totalDelay);
    }

    scheduleTimeout(() => {
      const nextCard = buildNextCard(currentCard);
      setPreviewKind(nextCard.kind);
      setCurrentCard(nextCard);
      setIsRolling(false);
      triggerHaptic([24, 40, 18]);
    }, totalDelay + 120);
  }

  const isActionPreview = previewKind === "action";
  const activeCard = currentCard;

  if (authorized !== true) {
    return <main className="min-h-dvh w-full bg-[#050505]" />;
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#050505] text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(168,19,54,0.42),_transparent_32%),radial-gradient(circle_at_18%_74%,_rgba(103,8,29,0.34),_transparent_28%),linear-gradient(180deg,_#130204_0%,_#050505_46%,_#090204_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundPosition: "center center",
          backgroundSize: "26px 26px",
          maskImage:
            "radial-gradient(circle at center, black 48%, transparent 100%)",
        }}
      />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-[max(20px,env(safe-area-inset-top))]">
        <header className="flex items-start justify-between gap-4">
          <Link
            className={cn(
              "inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 px-4",
              "bg-white/6 text-sm font-medium text-white/86 backdrop-blur-md transition-colors active:bg-white/12",
            )}
            href="/settings"
          >
            <BackArrowIcon className="h-4 w-4" />
            Retour
          </Link>
        </header>

        <section className="mt-7 space-y-3 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#ff8da1]">
            Mode secret 😈
          </p>
        </section>

        <div className="relative mt-8 flex flex-1 flex-col justify-center">
          <motion.div
            animate={
              isRolling
                ? {
                    rotateZ: [0, -2.8, 2.6, -1.8, 1.2, 0],
                    scale: [1, 1.02, 0.985, 1.015, 0.995, 1],
                    y: [0, -8, 5, -4, 2, 0],
                  }
                : { rotateZ: 0, scale: 1, y: 0 }
            }
            className="relative"
            transition={{
              duration: isRolling ? 2.5 : 0.45,
              ease: isRolling ? [0.12, 0.92, 0.18, 1] : [0.2, 0, 0, 1],
            }}
          >
            <div
              className={cn(
                "relative overflow-hidden rounded-[36px] border p-6 shadow-[0_26px_80px_rgba(0,0,0,0.35)]",
                isActionPreview
                  ? "border-[#ff7f96]/28 bg-[linear-gradient(180deg,_rgba(121,12,33,0.98)_0%,_rgba(73,8,22,0.98)_100%)]"
                  : "border-[#ffbfd0]/18 bg-[linear-gradient(180deg,_rgba(58,9,37,0.98)_0%,_rgba(32,4,21,0.98)_100%)]",
              )}
            >
              <div
                aria-hidden
                className={cn(
                  "pointer-events-none absolute inset-0",
                  isActionPreview
                    ? "bg-[radial-gradient(circle_at_top,_rgba(255,136,160,0.38),_transparent_36%)]"
                    : "bg-[radial-gradient(circle_at_top,_rgba(255,194,218,0.22),_transparent_38%)]",
                )}
              />
              <div className="relative min-h-[440px]">
                <AnimatePresence mode="wait">
                  {activeCard ? (
                    <motion.div
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="flex min-h-[440px] flex-col items-center justify-center text-center"
                      exit={{ opacity: 0, scale: 0.94, y: 18 }}
                      initial={{ opacity: 0, scale: 0.9, y: 22 }}
                      key={`${activeCard.kind}:${activeCard.prompt}`}
                      transition={{
                        type: "spring",
                        stiffness: 290,
                        damping: 24,
                      }}
                    >
                      <h2 className="text-center text-[3rem] font-semibold leading-none tracking-tight text-white">
                        {activeCard.kind === "action" ? "ACTION 🔥" : "VÉRITÉ 😈"}
                      </h2>

                      <p className="mt-8 max-w-[15rem] text-center text-[1.55rem] leading-[1.28] tracking-tight text-white/95">
                        {activeCard.prompt}
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex min-h-[440px] flex-col items-center justify-center text-center"
                      exit={{ opacity: 0, scale: 0.97 }}
                      initial={{ opacity: 0, scale: 0.98 }}
                      key={previewKind}
                      transition={{ duration: isRolling ? 0.18 : 0.35 }}
                    >
                      <div className="flex flex-1 flex-col items-center justify-center text-center">
                        <motion.h1
                          animate={
                            isRolling
                              ? { scale: [1, 1.07, 0.98, 1.04, 1] }
                              : { scale: 1 }
                          }
                          className="text-[3.35rem] font-semibold leading-[0.9] tracking-tight text-white"
                          transition={{
                            duration: isRolling ? 0.7 : 0.25,
                            repeat: isRolling ? Number.POSITIVE_INFINITY : 0,
                          }}
                        >
                          ACTION 🔥
                          <br />
                          <span className="text-white/62">ou</span>
                          <br />
                          VÉRITÉ 😈
                        </motion.h1>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="mt-8 flex justify-center pb-2">
          <button
            className={cn(
              "min-h-13 min-w-[170px] rounded-full px-7 text-[1rem] font-semibold text-[#fff7f8]",
              "bg-[linear-gradient(135deg,_#c44f5d_0%,_#df7a88_100%)] shadow-[0_18px_44px_rgba(196,79,93,0.34)]",
              "transition-transform active:scale-[0.99] disabled:opacity-45",
            )}
            disabled={isRolling}
            onClick={launchDraw}
            type="button"
          >
            {currentCard ? "Suivant" : "Lancer"}
          </button>
        </div>
      </div>
    </main>
  );
}
