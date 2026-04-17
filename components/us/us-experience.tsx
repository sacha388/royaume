"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { ScreenHeader } from "@/components/layout/screen-header";
import { lora } from "@/lib/fonts";
import { cn } from "@/lib/utils";

const MEETING_DATE = new Date(2024, 9, 31);
const MEETING_DATE_LABEL = "31 octobre 2024";
const MEETING_LOCATION = "Marquee";
const DAY_MS = 24 * 60 * 60 * 1000;

function computeDaysTogether(now: Date): number {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(
    MEETING_DATE.getFullYear(),
    MEETING_DATE.getMonth(),
    MEETING_DATE.getDate(),
  );

  return Math.max(1, Math.floor((today.getTime() - start.getTime()) / DAY_MS) + 1);
}

function scheduleNextRefresh(update: () => void): () => void {
  const now = new Date();
  const nextMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0,
    0,
    2,
  );

  const timeoutId = window.setTimeout(update, nextMidnight.getTime() - now.getTime());
  return () => window.clearTimeout(timeoutId);
}

function HeartIcon() {
  return (
    <svg
      aria-hidden
      className="h-5 w-5 text-[#bb5865]"
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 21.35 10.55 20C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.93 0 3.68.89 4.5 2.29C12.82 3.89 14.57 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35Z" />
    </svg>
  );
}

export function UsExperience() {
  const [today, setToday] = useState(() => new Date());

  useEffect(() => {
    let clearTimer = () => {};

    const refresh = () => {
      setToday(new Date());
      clearTimer = scheduleNextRefresh(refresh);
    };

    clearTimer = scheduleNextRefresh(refresh);
    return () => clearTimer();
  }, []);

  const daysTogether = useMemo(() => computeDaysTogether(today), [today]);

  return (
    <MobileShell className="gap-6 pb-6">
      <ScreenHeader backHref="/settings" title="Nous" />

      <section className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#bb5865]">
          Depuis notre première rencontre
        </p>

        <div className="flex items-end gap-3 text-zinc-950">
          <p className="text-[3.35rem] font-semibold leading-none tracking-tight">
            {daysTogether}
          </p>
          <p className="pb-1 text-[1.9rem] font-semibold leading-none tracking-tight text-zinc-700">
            jours
          </p>
        </div>

        <p
          className={cn(
            lora.className,
            "max-w-[15rem] text-[1.65rem] leading-[1.06] text-zinc-600",
          )}
        >
          ensemble dans notre royaume.
        </p>

        <div className="flex flex-wrap gap-3 pt-1">
          <div className="rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-zinc-700 shadow-[0_8px_24px_rgba(48,32,28,0.05)]">
            {MEETING_DATE_LABEL}
          </div>
          <div className="rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-zinc-700 shadow-[0_8px_24px_rgba(48,32,28,0.05)]">
            {MEETING_LOCATION}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[34px] shadow-[0_18px_44px_rgba(48,32,28,0.14)]">
        <div className="relative aspect-[0.9] w-full">
          <Image
            alt="Sacha et Reane allongés ensemble"
            className="object-cover"
            fill
            priority
            sizes="(max-width: 430px) calc(100vw - 2.5rem), 390px"
            src="/sachareane.jpeg"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0)_44%,rgba(245,240,234,0.18)_62%,rgba(243,232,226,0.82)_100%)]" />
        </div>

        <div className="absolute inset-x-4 bottom-4 rounded-[24px] bg-[#fffaf6]/92 px-5 py-4 shadow-[0_10px_30px_rgba(46,32,26,0.08)] backdrop-blur-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#bb5865]">
                Le commencement
              </p>
              <p className="mt-1 text-[1.15rem] font-semibold leading-tight text-zinc-950">
                {MEETING_DATE_LABEL}
              </p>
              <p className="mt-1 text-sm font-medium text-zinc-600">
                {MEETING_LOCATION}
              </p>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fff0f2]">
              <HeartIcon />
            </div>
          </div>
        </div>
      </section>

      <p className="pb-2 text-center text-[1.35rem] font-semibold tracking-tight text-zinc-950">
        Je t&apos;aime ❤️
      </p>
    </MobileShell>
  );
}
