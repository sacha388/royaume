"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useProfile } from "@/components/auth/profile-context";
import { HeartSentToast } from "@/components/home/heart-sent-toast";
import { LastReceivedMessage } from "@/components/home/last-received-message";
import { MobileShell } from "@/components/layout/mobile-shell";
import {
  acknowledgeHeartCelebration,
  appendCoupleMessage,
  getLastReceivedForViewer,
  getPendingHeartCelebration,
  getPendingOutboundHeart,
} from "@/lib/couple-messages";
import { lemonCake } from "@/lib/fonts";
import {
  MEMORIES_UPDATED_EVENT,
  readMemories,
  type MemoryItem,
} from "@/lib/memories";
import { profilePhotoSrc } from "@/lib/profile-photos";
import { grantSecretModeAccess } from "@/lib/secret-mode-access";
import { cn } from "@/lib/utils";
import { partnerOf, profileLabel } from "@/types/profile";

const SECRET_MODE_HOLD_MS = 5000;
const SECRET_MODE_HAPTIC_STEPS = [0.18, 0.36, 0.54, 0.72, 0.9] as const;

const HeartReceivedCelebration = dynamic(
  () =>
    import("@/components/home/heart-received-celebration").then(
      (mod) => mod.HeartReceivedCelebration,
    ),
  { ssr: false },
);

function SettingsGearIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export function HomeExperience() {
  const router = useRouter();
  const { profile } = useProfile();
  const heartPortalRef = useRef<HTMLButtonElement>(null);
  const holdFrameRef = useRef<number | null>(null);
  const holdStartRef = useRef<number | null>(null);
  const holdPointerIdRef = useRef<number | null>(null);
  const holdThresholdIndexRef = useRef(0);
  const [heartMessage, setHeartMessage] = useState("");
  const [sendToast, setSendToast] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [inboxTick, setInboxTick] = useState(0);
  const [memoriesTick, setMemoriesTick] = useState(0);
  const [dismissedCelebrationId, setDismissedCelebrationId] = useState<string | null>(null);
  const [harassModalOpen, setHarassModalOpen] = useState(false);
  const [secretHoldProgress, setSecretHoldProgress] = useState(0);
  const [secretMorphRect, setSecretMorphRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const [secretMorphTarget, setSecretMorphTarget] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [secretMorphing, setSecretMorphing] = useState(false);

  const you = profile ? profileLabel(profile) : "";
  const them = profile ? partnerOf(profile) : "";

  const secretHoldScale = 1 + secretHoldProgress * 3.6;

  const clearHoldLoop = useCallback(() => {
    if (holdFrameRef.current !== null) {
      window.cancelAnimationFrame(holdFrameRef.current);
      holdFrameRef.current = null;
    }
    holdStartRef.current = null;
    holdPointerIdRef.current = null;
    holdThresholdIndexRef.current = 0;
  }, []);

  const releaseSecretHoldCapture = useCallback((pointerId: number) => {
    const portal = heartPortalRef.current;
    if (!portal?.hasPointerCapture(pointerId)) {
      return;
    }
    portal.releasePointerCapture(pointerId);
  }, []);

  useEffect(() => {
    const bump = () => setInboxTick((n) => n + 1);
    window.addEventListener("royaume:inbox-updated", bump);
    window.addEventListener("storage", bump);
    return () => {
      window.removeEventListener("royaume:inbox-updated", bump);
      window.removeEventListener("storage", bump);
    };
  }, []);

  useEffect(() => {
    const bump = () => setMemoriesTick((n) => n + 1);
    window.addEventListener(MEMORIES_UPDATED_EVENT, bump);
    window.addEventListener("storage", bump);
    return () => {
      window.removeEventListener(MEMORIES_UPDATED_EVENT, bump);
      window.removeEventListener("storage", bump);
    };
  }, []);

  useEffect(() => {
    const cancelActiveHold = () => {
      if (holdPointerIdRef.current !== null) {
        releaseSecretHoldCapture(holdPointerIdRef.current);
      }
      if (!secretMorphing) {
        setSecretHoldProgress(0);
      }
      clearHoldLoop();
    };

    window.addEventListener("blur", cancelActiveHold);
    document.addEventListener("visibilitychange", cancelActiveHold);

    return () => {
      window.removeEventListener("blur", cancelActiveHold);
      document.removeEventListener("visibilitychange", cancelActiveHold);
      clearHoldLoop();
    };
  }, [clearHoldLoop, releaseSecretHoldCapture, secretMorphing]);

  const lastReceived = useMemo(
    () => {
      void inboxTick;
      return profile ? getLastReceivedForViewer(profile) : null;
    },
    [inboxTick, profile],
  );
  const latestMemory: MemoryItem | null = useMemo(
    () => {
      void memoriesTick;
      return readMemories()[0] ?? null;
    },
    [memoriesTick],
  );

  const celebration = useMemo(() => {
    void inboxTick;
    if (!profile) {
      return null;
    }
    const pending = getPendingHeartCelebration(profile);
    if (!pending) {
      return null;
    }
    return dismissedCelebrationId === pending.id ? null : pending;
  }, [dismissedCelebrationId, inboxTick, profile]);

  function handleCelebrationContinue() {
    if (celebration && profile) {
      acknowledgeHeartCelebration(profile, celebration.id);
      setDismissedCelebrationId(celebration.id);
    }
  }

  const dismissSendToast = useCallback(() => setSendToast(null), []);

  async function sendHeart() {
    if (!profile) {
      return;
    }
    if (getPendingOutboundHeart(profile) !== null) {
      setHarassModalOpen(true);
      return;
    }
    setSendToast(null);
    setIsSending(true);
    await new Promise((r) => setTimeout(r, 450));
    appendCoupleMessage(profile, heartMessage);
    setIsSending(false);
    setSendToast(
      profile === "reane"
        ? "Cœur envoyé au boss ultime"
        : "Cœur envoyé à la plus belle",
    );
    setHeartMessage("");
  }

  function triggerSecretHaptic(pattern: number | number[]) {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  }

  function resetSecretHold() {
    clearHoldLoop();
    setSecretHoldProgress(0);
  }

  function finishSecretHold() {
    if (secretMorphing) {
      return;
    }

    const rect = heartPortalRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    clearHoldLoop();
    setSecretHoldProgress(1);
    setSecretMorphRect({
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    });
    setSecretMorphTarget({
      width: window.innerWidth,
      height: window.innerHeight,
    });
    setSecretMorphing(true);
    grantSecretModeAccess();
    triggerSecretHaptic([18, 32, 18, 46, 24]);
    window.setTimeout(() => {
      router.push("/secret-mode");
    }, 430);
  }

  function advanceSecretHold() {
    if (holdStartRef.current === null) {
      return;
    }

    const elapsed = performance.now() - holdStartRef.current;
    const progress = Math.min(1, elapsed / SECRET_MODE_HOLD_MS);
    setSecretHoldProgress(progress);

    const threshold = SECRET_MODE_HAPTIC_STEPS[holdThresholdIndexRef.current];
    if (threshold !== undefined && progress >= threshold) {
      holdThresholdIndexRef.current += 1;
      triggerSecretHaptic(10);
    }

    if (progress >= 1) {
      finishSecretHold();
      return;
    }

    holdFrameRef.current = window.requestAnimationFrame(advanceSecretHold);
  }

  function handleSecretHoldStart(event: ReactPointerEvent<HTMLButtonElement>) {
    if (secretMorphing) {
      return;
    }

    clearHoldLoop();
    router.prefetch("/secret-mode");
    holdPointerIdRef.current = event.pointerId;
    holdStartRef.current = performance.now();
    holdThresholdIndexRef.current = 0;
    event.currentTarget.setPointerCapture(event.pointerId);
    setSecretHoldProgress(0.001);
    triggerSecretHaptic(12);
    holdFrameRef.current = window.requestAnimationFrame(advanceSecretHold);
  }

  function handleSecretHoldEnd(event: ReactPointerEvent<HTMLButtonElement>) {
    if (holdPointerIdRef.current !== event.pointerId) {
      return;
    }

    releaseSecretHoldCapture(event.pointerId);

    if (secretMorphing) {
      return;
    }

    resetSecretHold();
  }

  return (
    <>
      <AnimatePresence>
        {celebration ? (
          <HeartReceivedCelebration
            key={celebration.id}
            message={celebration}
            senderLabel={profileLabel(celebration.from)}
            onContinue={handleCelebrationContinue}
          />
        ) : null}
      </AnimatePresence>

      <HeartSentToast
        message={sendToast ?? ""}
        onDismiss={dismissSendToast}
        open={Boolean(sendToast)}
      />

      <AnimatePresence>
        {harassModalOpen ? (
          <motion.div
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[140] flex items-center justify-center bg-black/45 px-5 backdrop-blur-[2px]"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            key="harass-modal"
            onClick={() => setHarassModalOpen(false)}
            role="presentation"
            transition={{ duration: 0.2 }}
          >
            <motion.div
              animate={{ opacity: 1, scale: 1 }}
              aria-modal
              aria-labelledby="harass-dialog-title"
              className="w-full max-w-[340px] rounded-[24px] bg-[#f3f1ed] px-6 py-6 shadow-lg ring-1 ring-zinc-200/80"
              exit={{ opacity: 0, scale: 0.96 }}
              initial={{ opacity: 0, scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
              role="alertdialog"
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
            >
              <div className="mb-4 w-full overflow-hidden rounded-2xl">
                <Image
                  alt=""
                  className="h-auto w-full max-w-full"
                  draggable={false}
                  height={1024}
                  sizes="(max-width: 380px) calc(100vw - 5rem), 292px"
                  src="/sacha2.PNG"
                  width={1536}
                />
              </div>
              <p
                className="text-center text-[17px] font-semibold leading-snug text-zinc-900"
                id="harass-dialog-title"
              >
                Tu vas pas m&apos;harceler non plus !
              </p>
              <button
                className={cn(
                  "mt-6 w-full rounded-full border-0 py-3.5 text-[16px] font-bold text-[#FFFDF9]",
                  "bg-gradient-to-br from-[#c44f5d] to-[#d96f7a]",
                  "transition-[opacity,transform] active:scale-[0.99] active:opacity-95",
                )}
                onClick={() => setHarassModalOpen(false)}
                type="button"
              >
                OK
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {secretMorphing && secretMorphRect && secretMorphTarget ? (
          <motion.div
            animate={{
              borderRadius: 0,
              height: secretMorphTarget.height,
              left: 0,
              top: 0,
              width: secretMorphTarget.width,
            }}
            className="fixed z-[260] bg-[#4f020f] shadow-[0_0_120px_rgba(196,79,93,0.55)]"
            initial={secretMorphRect}
            transition={{
              duration: 0.48,
              ease: [0.08, 0.86, 0.18, 1],
            }}
          />
        ) : null}
      </AnimatePresence>

      <MobileShell className="gap-6 pb-2">
      {/* Barre type maquette : avatar | Royaume | réglages */}
      <header className="grid w-full grid-cols-3 items-center gap-2 pt-2">
        <div className="relative h-11 w-11 shrink-0 justify-self-start overflow-hidden rounded-full ring-2 ring-white ring-offset-2 ring-offset-[var(--app-bg)]">
          <Image
            alt={profile ? `${you}` : ""}
            className="object-cover"
            draggable={false}
            fill
            sizes="44px"
            src={profile ? profilePhotoSrc(profile) : "/accueil.jpeg"}
          />
        </div>
        <p
          className={cn(
            lemonCake.className,
            "justify-self-center text-center text-[1.50rem] font-normal leading-none tracking-tight text-[#c44f5d] sm:text-2xl",
          )}
        >
          Royaume
        </p>
        <Link
          aria-label="Ouvrir les paramètres"
          className="inline-flex h-11 w-11 touch-manipulation items-center justify-center justify-self-end rounded-full text-[#c44f5d] transition-colors active:bg-[#c44f5d]/10"
          href="/settings"
        >
          <SettingsGearIcon className="h-6 w-6" />
        </Link>
      </header>

      <section className="space-y-3">
        {profile ? (
          <p className="font-serif text-[15px] leading-6 text-zinc-600">
            Bonjour,{" "}
            <span className="font-medium text-zinc-800">{you}</span>
          </p>
        ) : null}
        <h1 className="text-[1.65rem] font-bold leading-[1.15] tracking-tight text-zinc-950 sm:text-3xl sm:leading-tight">
          C&apos;est une belle journée pour s&apos;aimer.
        </h1>
      </section>

      {/* Carte « Envoyer un cœur » */}
      <div
        className={cn(
          "min-w-0 w-full overflow-hidden rounded-[30px] px-8 py-8 sm:px-10 sm:py-10",
          "shadow-[0_10px_36px_rgba(74,63,53,0.06)]",
        )}
        style={{ backgroundColor: "#F5F2ED" }}
      >
        <div className="relative z-[1] flex w-full flex-col items-center gap-5">
          <motion.button
            aria-label="Maintenir pour ouvrir le mode secret"
            className={cn(
              "entry-hold-see relative flex h-14 w-14 items-center justify-center rounded-full border-0 text-xl text-white",
              "bg-[#c44f5d] shadow-[0_8px_20px_rgba(196,79,93,0.35)]",
            )}
            onPointerCancel={handleSecretHoldEnd}
            onPointerDown={handleSecretHoldStart}
            onPointerUp={handleSecretHoldEnd}
            onContextMenu={(event) => event.preventDefault()}
            ref={heartPortalRef}
            style={{ scale: secretHoldScale }}
            type="button"
          >
            <span
              aria-hidden
              className="absolute inset-[-7px] rounded-full border border-[#c44f5d]/20"
              style={{ opacity: 0.24 + secretHoldProgress * 0.52 }}
            />
            <span
              aria-hidden
              className="absolute inset-0 rounded-full bg-[#d96f7a]/30 blur-[10px]"
              style={{
                opacity: secretHoldProgress,
                transform: `scale(${1 + secretHoldProgress * 0.3})`,
              }}
            />
            <span
              aria-hidden
              className="absolute inset-0 rounded-full"
              style={{
                background: `conic-gradient(from -90deg, rgba(255,255,255,0.78) ${secretHoldProgress * 360}deg, rgba(255,255,255,0.08) 0deg)`,
                maskImage:
                  "radial-gradient(circle at center, transparent 60%, black 62%)",
                opacity: 0.65,
              }}
            />
            <span className="relative z-[1]">♥</span>
          </motion.button>
          <div className="w-full space-y-1 text-center">
            <h2 className="text-xl font-bold tracking-tight text-zinc-950 sm:text-2xl">
              Envoyer un cœur
            </h2>
            <p className="text-[15px] leading-6 text-zinc-600">
              {profile ? (
                <>
                  Laissez une petite pensée pour{" "}
                  <span className="font-semibold text-zinc-800">{them}</span>
                </>
              ) : (
                "Choisis un profil pour continuer."
              )}
            </p>
          </div>

          <label className="sr-only" htmlFor="heart-message">
            Message pour {them}
          </label>
          <textarea
            className="min-h-[100px] w-full resize-none rounded-[22px] border-0 bg-white px-4 py-3.5 text-base leading-6 text-zinc-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] outline-none ring-1 ring-zinc-200/80 placeholder:text-zinc-400 placeholder:italic focus:ring-2 focus:ring-[#c44f5d]/30"
            disabled={!profile}
            id="heart-message"
            onChange={(e) => setHeartMessage(e.target.value)}
            placeholder="Écris quelque chose de doux…"
            value={heartMessage}
          />

          <button
            className={cn(
              "min-h-14 w-full rounded-full border-0 px-7 text-[17px] font-bold tracking-normal text-[#FFFDF9] shadow-none transition-[opacity,transform] active:scale-[0.99] active:opacity-95 disabled:pointer-events-none disabled:opacity-45",
              "bg-gradient-to-br from-[#c44f5d] to-[#d96f7a]",
            )}
            disabled={isSending || !profile}
            onClick={sendHeart}
            type="button"
          >
            {isSending ? "Envoi…" : "Envoyer"}
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {profile ? (
          <LastReceivedMessage
            last={lastReceived}
            partnerFirstName={them}
          />
        ) : null}

        <section
          className={cn(
            "overflow-hidden rounded-[22px] px-5 py-5",
            "bg-[#f3f1ed]/90 shadow-[0_8px_28px_rgba(48,36,32,0.06)]",
          )}
        >
          {latestMemory ? (
            <>
              <p className="mb-3 text-sm font-medium text-zinc-500">
                Dernier souvenir
              </p>
              <div className="relative aspect-[1.25] overflow-hidden rounded-[18px] bg-zinc-100">
                <Image
                  alt={latestMemory.title}
                  className="object-cover"
                  fill
                  sizes="(max-width: 430px) calc(100vw - 4rem), 360px"
                  src={latestMemory.imageDataUrl}
                  unoptimized
                />
              </div>
              <p className="mt-3 text-base font-semibold leading-7 text-zinc-950">
                {latestMemory.title}
              </p>
            </>
          ) : (
            <>
              <p className="mb-2 text-sm font-medium text-zinc-500">Souvenir</p>
              <p className="text-base font-semibold leading-7 text-zinc-950">
                Un souvenir partagé s’affichera ici bientôt.
              </p>
            </>
          )}
        </section>
      </div>
    </MobileShell>
    </>
  );
}
