"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import type { MouseEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { parseEntryStep } from "@/lib/entry-step";
import { lemonCake } from "@/lib/fonts";
import { INTRO_STEPS } from "@/lib/intro";
import { cn } from "@/lib/utils";

const cardShadow =
  "shadow-[0_14px_36px_rgba(48,36,32,0.18),0_4px_14px_rgba(48,36,32,0.08)]";

const ctaClassName =
  "relative inline-flex min-h-16 w-full cursor-pointer touch-manipulation select-none items-center justify-center rounded-full border-0 bg-[#c44f5d] px-7 text-[17px] font-bold tracking-normal text-[#FFFDF9] shadow-none no-underline transition-[background-color,opacity] active:bg-[#b94753] active:opacity-95";

const stepEase = [0.22, 1, 0.36, 1] as const;

const stepTransition = {
  duration: 0.42,
  ease: stepEase,
};

/** Gros emojis de fête sur le fond de l’étape anniversaire (zone « hold », sans cercle). */
const BIRTHDAY_HOLD_EMOJI_LAYOUT = [
  { emoji: "🎉", className: "left-[-4%] top-[6%] text-[2.85rem] sm:text-[3.15rem] -rotate-12" },
  { emoji: "🥳", className: "left-[8%] top-[42%] text-[3.35rem] sm:text-[3.75rem] rotate-[8deg]" },
  { emoji: "🎊", className: "right-[-2%] top-[2%] text-[2.6rem] sm:text-[2.95rem] rotate-[16deg]" },
  { emoji: "✨", className: "left-[38%] top-[-2%] text-[2.1rem] sm:text-[2.35rem] -rotate-[18deg]" },
  { emoji: "🎈", className: "right-[4%] top-[30%] text-[3.5rem] sm:text-[3.95rem] -rotate-10" },
  { emoji: "👑", className: "left-[2%] bottom-[8%] text-[3.1rem] sm:text-[3.45rem] rotate-11" },
  { emoji: "🪩", className: "right-[12%] bottom-[4%] text-[2.75rem] sm:text-[3.1rem] rotate-[14deg]" },
  { emoji: "🎆", className: "left-[24%] bottom-[2%] text-[2.4rem] sm:text-[2.7rem] -rotate-[9deg]" },
  { emoji: "🍰", className: "right-[28%] top-[22%] text-[3rem] sm:text-[3.35rem] rotate-4" },
  { emoji: "🎁", className: "left-[44%] top-[36%] text-[2.35rem] sm:text-[2.65rem] -rotate-[12deg]" },
  { emoji: "💖", className: "right-[-3%] bottom-[28%] text-[2.55rem] sm:text-[2.85rem] rotate-[10deg]" },
  { emoji: "🎈", className: "left-[28%] top-[18%] text-[2.2rem] sm:text-[2.45rem] opacity-95 -rotate-[14deg]" },
  { emoji: "🎉", className: "right-[40%] bottom-[18%] text-[2.15rem] sm:text-[2.4rem] rotate-7" },
] as const;

function IntroDots({ activeIndex }: { activeIndex: number }) {
  return (
    <div
      aria-label="Progression de l’introduction"
      className="flex justify-center gap-2"
      role="navigation"
    >
      {INTRO_STEPS.map((item, itemIndex) => (
        <span
          className={cn(
            itemIndex === activeIndex
              ? "h-1.5 w-6 rounded-full bg-[#c44f5d]"
              : "h-1.5 w-1.5 rounded-full bg-zinc-300",
          )}
          key={item.id}
        />
      ))}
    </div>
  );
}

type EntryFlowProps = {
  initialStep: number;
};

export function EntryFlow({ initialStep }: EntryFlowProps) {
  const [step, setStep] = useState(initialStep);
  const [birthdayHold, setBirthdayHold] = useState(false);
  const startBirthdayHold = useCallback(() => {
    setBirthdayHold(true);
  }, []);

  const stopBirthdayHold = useCallback(() => {
    setBirthdayHold(false);
  }, []);

  /**
   * Ne PAS resynchroniser `setStep(initialStep)` dans un effet : Next peut re-rendre
   * la page avec le même `initialStep` (souvent 0) après navigation client et
   * annuler `setStep(1)` du clic « Entrer » → la pluie ne montait jamais.
   * L’étape initiale vient uniquement de `useState(initialStep)` + effet URL ci-dessous.
   */
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const raw = q.get("s");
    if (raw === null || raw === "") {
      return;
    }

    const syncStepTimer = window.setTimeout(() => {
      setStep(parseEntryStep(raw));
    }, 0);

    return () => window.clearTimeout(syncStepTimer);
  }, []);

  useEffect(() => {
    if (step === 1) {
      return;
    }

    const clearHoldTimer = window.setTimeout(() => {
      setBirthdayHold(false);
    }, 0);

    return () => window.clearTimeout(clearHoldTimer);
  }, [step]);

  useEffect(() => {
    if (!birthdayHold) {
      return;
    }

    const clearHold = () => setBirthdayHold(false);

    window.addEventListener("pointerup", clearHold);
    window.addEventListener("pointercancel", clearHold);
    window.addEventListener("mouseup", clearHold);
    window.addEventListener("touchend", clearHold);
    window.addEventListener("touchcancel", clearHold);
    window.addEventListener("blur", clearHold);

    return () => {
      window.removeEventListener("pointerup", clearHold);
      window.removeEventListener("pointercancel", clearHold);
      window.removeEventListener("mouseup", clearHold);
      window.removeEventListener("touchend", clearHold);
      window.removeEventListener("touchcancel", clearHold);
      window.removeEventListener("blur", clearHold);
    };
  }, [birthdayHold]);

  useEffect(() => {
    const onPopState = () => {
      const q = new URLSearchParams(window.location.search);
      const raw = q.get("s");
      if (raw !== null && raw !== "") {
        setStep(parseEntryStep(raw));
      } else {
        setStep(0);
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    const { body } = document;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, []);

  const buttonLabel = useMemo(() => {
    if (step === 0) return "Entrer";
    if (step < 3) return "Suivant";
    return "Continuer";
  }, [step]);

  const nextHref = useMemo(
    () => (step >= 3 ? "/auth" : `/?s=${step + 1}`),
    [step],
  );

  /**
   * Lien réel : sans JS, le navigateur charge la bonne URL.
   * Avec JS : on annule le rechargement et on anime en client (même rendu qu’une SPA).
   */
  const handleCtaClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (step >= 3) {
      return;
    }
    e.preventDefault();
    const next = step + 1;
    setStep(next);
    const path = next <= 0 ? "/" : `/?s=${next}`;
    window.history.pushState({ entryStep: next }, "", path);
  };

  return (
    <>
      <div className="fixed inset-0 z-0 flex justify-center overflow-hidden bg-background">
        <MobileShell className="relative z-10 gap-6 pb-[max(9rem,calc(9rem+env(safe-area-inset-bottom)))]" fixedViewport>
          <div className="relative z-0 flex h-full min-h-0 w-full min-w-0 flex-1 flex-col">
            <AnimatePresence initial={false} mode="wait">
              <motion.div
                animate={{ opacity: 1, scale: 1, x: 0 }}
                className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-hidden will-change-[transform,opacity]"
              exit={{ opacity: 0, scale: 0.98, x: -20 }}
              initial={{ opacity: 0, scale: 0.98, x: 24 }}
              key={step}
              transition={stepTransition}
            >
              {step === 0 ? (
                <>
                  <header className="w-full shrink-0 pt-4">
                    <h1
                      className={`${lemonCake.className} m-0 flex w-full min-w-0 flex-col items-center gap-0.5 text-center text-4xl font-normal leading-[0.98] text-zinc-950 sm:text-5xl sm:leading-[1.02]`}
                    >
                      <span className="inline-block max-w-full px-2 text-center">
                        Bienvenue
                      </span>
                      <span className="inline-block whitespace-nowrap">
                        my love
                      </span>
                    </h1>
                  </header>

                  <div className="flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center overflow-x-visible overflow-y-hidden py-6">
                    <figure className="relative mx-auto h-[min(410px,calc(100dvh-15.5rem))] w-full max-w-[308px] overflow-visible">
                      <div
                        className="absolute left-[8%] top-[5%] z-0 w-[60%] -rotate-[7deg] [transform-origin:52%_78%]"
                      >
                        <div
                          className={`relative aspect-[2/3] w-full overflow-hidden rounded-[28px] border-2 border-white ${cardShadow}`}
                        >
                          <Image
                            alt="Nous"
                            className="object-cover"
                            draggable={false}
                            fill
                            priority
                            sizes="190px"
                            src="/accueil.jpeg"
                          />
                        </div>
                      </div>
                      <div
                        className="absolute bottom-[6%] right-[8%] z-10 w-[50%] rotate-[7deg] [transform-origin:48%_72%]"
                      >
                        <div
                          className={`relative aspect-[4/5] w-full overflow-hidden rounded-[28px] border-2 border-white bg-white ${cardShadow}`}
                        >
                          <Image
                            alt="Un moment ensemble"
                            className="object-cover"
                            draggable={false}
                            fill
                            sizes="165px"
                            src="/accueil2.jpeg"
                          />
                        </div>
                      </div>
                    </figure>
                  </div>
                </>
              ) : step === 1 ? (
                <>
                  <header className="w-full shrink-0 pt-4">
                    <h1
                      className={`${lemonCake.className} m-0 flex w-full min-w-0 flex-col items-center gap-0.5 text-center text-4xl font-normal leading-[0.98] text-zinc-950 sm:text-5xl sm:leading-[1.02]`}
                    >
                      <span className="inline-block max-w-full px-2 text-center tracking-tight">
                        QUEEN&apos;S BIRTHDAY
                      </span>
                    </h1>
                  </header>

                  <div className="flex min-h-0 min-w-0 flex-1 flex-col items-stretch justify-stretch overflow-visible py-2">
                    <button
                      aria-label="Maintenir appuyé sur la zone des emojis pour continuer"
                      className={cn(
                        "entry-hold-see relative z-10 mx-auto flex min-h-[min(48dvh,300px)] w-full max-w-md flex-1 touch-manipulation select-none border-0 bg-transparent px-2 shadow-none outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[#c44f5d]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFDF9] active:scale-[0.99]",
                        birthdayHold && "scale-[0.98]",
                      )}
                      onContextMenu={(event) => event.preventDefault()}
                      onMouseDown={startBirthdayHold}
                      onMouseUp={stopBirthdayHold}
                      onMouseLeave={stopBirthdayHold}
                      onPointerCancel={stopBirthdayHold}
                      onPointerDown={startBirthdayHold}
                      onPointerUp={stopBirthdayHold}
                      onTouchEnd={stopBirthdayHold}
                      onTouchStart={startBirthdayHold}
                      type="button"
                    >
                      {BIRTHDAY_HOLD_EMOJI_LAYOUT.map((item, index) => (
                        <span
                          aria-hidden
                          className={cn(
                            "pointer-events-none absolute leading-none select-none",
                            item.className,
                          )}
                          key={`birthday-emoji-${index}`}
                        >
                          {item.emoji}
                        </span>
                      ))}
                    </button>
                  </div>
                </>
              ) : step === 2 ? (
                <div className="flex h-full min-h-0 w-full flex-1 flex-col">
                  <header className="w-full shrink-0 pt-4">
                    <h1
                      className={`${lemonCake.className} m-0 flex w-full min-w-0 flex-col items-center gap-0.5 text-center text-[1.65rem] font-normal leading-[1.05] text-zinc-950 sm:text-4xl sm:leading-[1.08]`}
                    >
                      <span className="inline-block max-w-full px-2 text-center tracking-tight">
                        43 ans ça se fête en même temps BAHAHAH
                      </span>
                    </h1>
                  </header>

                  <div className="relative min-h-0 w-full flex-1 basis-0">
                    <div className="absolute inset-0 flex items-center justify-center px-2 py-3">
                      <div
                        className={`relative aspect-[3/4] h-auto w-full max-h-full max-w-[min(100%,308px)] overflow-hidden rounded-[28px] border-[3px] border-white bg-white ${cardShadow}`}
                      >
                        <Image
                          alt=""
                          className="object-cover"
                          draggable={false}
                          fill
                          sizes="(max-width: 430px) 85vw, 308px"
                          src="/accueil3.jpeg"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : step === 3 ? (
                <div className="flex h-full min-h-0 w-full flex-1 flex-col items-center justify-center px-5">
                  <h1
                    className={`${lemonCake.className} m-0 max-w-[min(100%,22rem)] text-center text-[1.45rem] font-normal leading-snug text-zinc-950 sm:max-w-lg sm:text-3xl sm:leading-tight`}
                  >
                    C&apos;est pas grand chose mais j&apos;ai fait un petit truc{" "}
                    <span aria-hidden>🩷</span>
                  </h1>
                </div>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>
      </MobileShell>
      </div>

      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[99999] flex flex-col items-center px-5"
        style={{
          paddingBottom: "max(12px, env(safe-area-inset-bottom, 0px))",
        }}
      >
        <div className="pointer-events-auto flex w-full max-w-[430px] flex-col gap-4">
          <div className="flex h-9 w-full items-center justify-center">
            {step >= 1 ? <IntroDots activeIndex={step - 1} /> : null}
          </div>
          <Link
            className={`${ctaClassName} w-full`}
            href={nextHref}
            onClick={handleCtaClick}
          >
            {buttonLabel}
          </Link>
        </div>
      </div>
    </>
  );
}
