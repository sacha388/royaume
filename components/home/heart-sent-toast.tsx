"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

type HeartSentToastProps = {
  open: boolean;
  message: string;
  onDismiss: () => void;
  /** Durée avant fermeture auto (ms). */
  autoHideMs?: number;
};

export function HeartSentToast({
  open,
  message,
  onDismiss,
  autoHideMs = 4800,
}: HeartSentToastProps) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) {
      return;
    }
    const id = window.setTimeout(onDismiss, autoHideMs);
    return () => window.clearTimeout(id);
  }, [open, autoHideMs, onDismiss]);

  const transition = reduceMotion
    ? { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] as const }
    : { type: "spring" as const, stiffness: 420, damping: 34, mass: 0.85 };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          aria-atomic
          aria-live="polite"
          className="pointer-events-none fixed inset-x-0 top-0 z-[130] flex justify-center px-3 pt-[max(10px,env(safe-area-inset-top))]"
          exit={
            reduceMotion
              ? { opacity: 0, y: -24 }
              : { y: -28, opacity: 0, transition: { duration: 0.22, ease: [0.4, 0, 1, 1] } }
          }
          initial={
            reduceMotion
              ? { opacity: 0, y: -8 }
              : { y: -120, opacity: 0 }
          }
          key="heart-sent-toast"
          animate={{ y: 0, opacity: 1 }}
          transition={transition}
        >
          <button
            className={cn(
              "pointer-events-auto w-full max-w-[400px] text-left",
              "rounded-[22px] border border-white/30",
              "bg-[#d46372]",
              "px-4 py-3.5 outline-none",
              "focus-visible:ring-2 focus-visible:ring-white/40",
            )}
            onClick={onDismiss}
            type="button"
          >
            <div className="flex items-center gap-3">
              <div
                aria-hidden
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-white/25 text-xl text-white"
              >
                ♥
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[17px] font-semibold leading-snug text-white sm:text-[18px]">
                  {message}
                </p>
              </div>
            </div>
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
