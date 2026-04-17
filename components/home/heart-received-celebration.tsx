"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import type { CoupleMessage } from "@/lib/couple-messages";
import { lora } from "@/lib/fonts";
import { cn } from "@/lib/utils";

type HeartReceivedCelebrationProps = {
  message: CoupleMessage;
  senderLabel: string;
  onContinue: () => void;
};

/** Cœur plein pour les formes de fond (SVG). */
function HeartShape({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill="currentColor"
      />
    </svg>
  );
}

const easeOutCine = [0.16, 1, 0.3, 1] as const;

/** Durée montée du panneau bas — même durée / easing que le bloc cœur + sous-titre. */
const PANEL_LIFT_DURATION_S = 2.35;
/** Le sous-titre « Un message pour toi » après la fin de la montée du panneau. */
const SUBTITLE_DELAY_AFTER_PANEL_S = PANEL_LIFT_DURATION_S + 0.35;
const PANEL_LIFT_EASE = [0.22, 0.9, 0.28, 1] as const;
/**
 * Même amplitude pour le panneau (y: 88 → 0) et le bloc cœur (y: 0 → -88) :
 * pas de « recadrage » dû à des distances différentes.
 */
const LIFT_TRAVEL_PX = 88;

/**
 * Étapes : 0 fond seul → 1 cœurs de fond → 2 rond central → 3 cadran texte.
 */
export function HeartReceivedCelebration({
  message,
  senderLabel,
  onContinue,
}: HeartReceivedCelebrationProps) {
  const reduceMotion = useReducedMotion();
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timers: number[] = [];

    if (reduceMotion) {
      timers.push(window.setTimeout(() => setStage(3), 0));
    } else {
      timers.push(window.setTimeout(() => setStage(0), 0));
      timers.push(window.setTimeout(() => setStage(1), 450));
      timers.push(window.setTimeout(() => setStage(2), 1400));
      timers.push(window.setTimeout(() => setStage(3), 3000));
    }

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [reduceMotion, message.id]);

  const softTween = {
    type: "tween" as const,
    duration: 1.35,
    ease: easeOutCine,
  };

  /** Montée du panneau bas uniquement. */
  const panelLift =
    reduceMotion
      ? { duration: 0.2 }
      : ({
          type: "tween" as const,
          duration: PANEL_LIFT_DURATION_S,
          ease: PANEL_LIFT_EASE,
        });

  return (
    <motion.div
      animate={{ opacity: 1 }}
      aria-modal
      className="fixed inset-0 z-[200] flex flex-col"
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
      role="dialog"
      transition={{ duration: reduceMotion ? 0.15 : 1.15, ease: easeOutCine }}
    >
      {/* Fond plein rose */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-[#d46372] via-[#c44f5d] to-[#9e3d4a]"
      />

      {/* Formes cœur plus claires, arrière-plan — apparition étape 1 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden text-[#f5b8c4]/35"
      >
        <motion.div
          animate={
            stage >= 1
              ? { opacity: 1, scale: 1 }
              : { opacity: 0, scale: 0.96 }
          }
          className="absolute -left-[8%] top-[10%] aspect-square w-[min(72vmin,420px)]"
          initial={false}
          transition={{ ...softTween, delay: 0 }}
        >
          <HeartShape className="h-full w-full -rotate-[12deg]" />
        </motion.div>
        <motion.div
          animate={
            stage >= 1
              ? { opacity: 1, scale: 1 }
              : { opacity: 0, scale: 0.96 }
          }
          className="absolute -right-[5%] top-[22%] aspect-square w-[min(48vmin,280px)]"
          initial={false}
          transition={{ ...softTween, delay: 0.12 }}
        >
          <HeartShape className="h-full w-full rotate-[8deg]" />
        </motion.div>
        <motion.div
          animate={
            stage >= 1
              ? { opacity: 1, scale: 1 }
              : { opacity: 0, scale: 0.96 }
          }
          className="absolute bottom-[38%] left-[5%] aspect-square w-[min(36vmin,200px)]"
          initial={false}
          transition={{ ...softTween, delay: 0.24 }}
        >
          <HeartShape className="h-full w-full -rotate-[6deg]" />
        </motion.div>
        <motion.div
          animate={
            stage >= 1
              ? { opacity: 1, y: 0 }
              : { opacity: 0, y: 16 }
          }
          className="absolute bottom-[12%] right-[-4%] aspect-square w-[min(56vmin,320px)] text-[#f5b8c4]/28"
          initial={false}
          transition={{ ...softTween, delay: 0.35 }}
        >
          <HeartShape className="h-full w-full rotate-[14deg]" />
        </motion.div>
      </div>

      {/* Rond central : étape 2 ; montée lente avec le cadran à l’étape 3 */}
      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center px-6 pt-[max(1rem,env(safe-area-inset-top))] pb-6">
        <motion.div
          animate={{
            y:
              stage >= 3
                ? reduceMotion
                  ? -Math.round(LIFT_TRAVEL_PX * 0.55)
                  : -LIFT_TRAVEL_PX
                : 0,
          }}
          className="flex flex-col items-center"
          transition={
            stage >= 3
              ? reduceMotion
                ? { type: "tween", duration: 0.2 }
                : {
                    type: "tween",
                    duration: PANEL_LIFT_DURATION_S,
                    ease: PANEL_LIFT_EASE,
                  }
              : { type: "tween", duration: 0 }
          }
        >
          <AnimatePresence>
            {stage >= 2 ? (
              <motion.div
                animate={{ opacity: 1, scale: 1 }}
                className="relative flex aspect-square h-[min(44vw,200px)] w-[min(44vw,200px)] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#ffb3c1] via-[#e87082] to-[#c43d52] shadow-[0_0_0_1px_rgba(255,255,255,0.22),0_28px_80px_rgba(80,20,30,0.35),0_0_100px_rgba(255,180,195,0.35)]"
                exit={{ opacity: 0, scale: 0.94 }}
                initial={{ opacity: 0, scale: 0.88 }}
                key="roundel"
                transition={
                  reduceMotion
                    ? { duration: 0.2 }
                    : {
                        type: "tween",
                        duration: 1.25,
                        ease: easeOutCine,
                      }
                }
              >
                <motion.span
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative z-[1] text-[min(22vw,5.5rem)] leading-none text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.12)]"
                  initial={{ opacity: 0, scale: 0.85 }}
                  transition={
                    reduceMotion
                      ? { duration: 0.15 }
                      : {
                          type: "tween",
                          delay: 0.35,
                          duration: 0.95,
                          ease: easeOutCine,
                        }
                  }
                >
                  ♥
                </motion.span>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* Dès l’étape 2 : place réservée pour éviter un saut de mise en page à l’étape 3. */}
          {stage >= 2 ? (
            <motion.p
              animate={
                reduceMotion
                  ? { opacity: stage >= 3 ? 1 : 0, filter: "blur(0px)" }
                  : {
                      opacity: stage >= 3 ? 1 : 0,
                      filter: stage >= 3 ? "blur(0px)" : "blur(10px)",
                    }
              }
              aria-hidden={stage < 3}
              className="mt-8 max-w-[18rem] text-center text-[13px] font-medium leading-relaxed tracking-[0.2em] text-white/80"
              initial={false}
              transition={
                reduceMotion
                  ? { duration: 0.15 }
                  : stage >= 3
                    ? {
                        delay: SUBTITLE_DELAY_AFTER_PANEL_S,
                        duration: 1.05,
                        ease: [0.18, 0.88, 0.28, 1],
                      }
                    : { duration: 0.25 }
              }
            >
              Un message pour toi
            </motion.p>
          ) : null}
        </motion.div>
      </div>

      {/* Cadran : fixed pour ne pas réduire le flex-1 du centre (évite le saut du cœur). */}
      <AnimatePresence>
        {stage >= 3 ? (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="pointer-events-none fixed inset-x-0 bottom-0 z-[210] flex justify-center px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-6"
            exit={{ opacity: 0, y: 24 }}
            initial={{ opacity: 0, y: LIFT_TRAVEL_PX }}
            key="dialogue"
            transition={panelLift}
          >
            <div
              className={cn(
                "pointer-events-auto w-full max-w-[430px]",
                "rounded-[26px] border border-white/25 bg-white/[0.12] px-5 py-5 sm:px-6 sm:py-6",
                "backdrop-blur-xl",
                "shadow-[0_20px_50px_rgba(40,10,20,0.2)]",
              )}
            >
              <p
                className={cn(
                  lora.className,
                  "mb-2 text-center text-[13px] font-medium tracking-wide text-white/65",
                )}
              >
                {senderLabel}
              </p>
              <p
                className={cn(
                  lora.className,
                  "mx-auto w-full max-w-full text-center text-[15px] font-normal italic leading-snug sm:text-[16px] sm:leading-relaxed",
                  "text-white",
                  "break-words [overflow-wrap:anywhere] hyphens-auto",
                  "whitespace-pre-wrap",
                )}
              >
                « {message.text} »
              </p>

              <button
                className={cn(
                  "mt-2 w-full rounded-full border border-white/35 bg-white/95 py-3.5",
                  "text-[16px] font-medium tracking-wide text-[#9e3d4a]",
                  "transition-[opacity,transform] active:opacity-90 active:scale-[0.99]",
                )}
                onClick={onContinue}
                type="button"
              >
                Continuer
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
