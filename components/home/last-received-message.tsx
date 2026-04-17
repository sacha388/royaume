"use client";

import type { CoupleMessage } from "@/lib/couple-messages";
import { formatTimeAgoFr } from "@/lib/couple-messages";
import { lora } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { profileLabel } from "@/types/profile";

const ink = "#4A3F35";
const cardBg = "#F5F2ED";
const quoteMuted = "#E0DDD8";

type LastReceivedMessageProps = {
  /** Dernier message envoyé par l’autre profil, ou `null`. */
  last: CoupleMessage | null;
  /** Prénom du partenaire (texte vide quand aucun message). */
  partnerFirstName: string;
};

export function LastReceivedMessage({
  last,
  partnerFirstName,
}: LastReceivedMessageProps) {
  const hasMessage = Boolean(last?.text);

  return (
    <div className="min-w-0 w-full">
      <p
        className={cn(
          lora.className,
          "mb-3 px-0.5 text-[11px] font-normal uppercase leading-normal tracking-[0.12em]",
        )}
        style={{ color: ink }}
      >
        Dernier message reçu
      </p>

      <div
        className={cn(
          "relative overflow-hidden rounded-[30px] px-8 py-8 sm:px-10 sm:py-10",
          "shadow-[0_10px_36px_rgba(74,63,53,0.06)]",
        )}
        style={{ backgroundColor: cardBg }}
      >
        {hasMessage ? (
          <>
            <span
              aria-hidden
              className={cn(
                lora.className,
                "pointer-events-none absolute right-4 top-2 select-none text-[5.5rem] font-bold leading-none sm:right-6 sm:top-4 sm:text-[6.5rem]",
              )}
              style={{ color: quoteMuted }}
            >
              ”
            </span>

            <blockquote className="relative z-[1] m-0 min-w-0 w-full max-w-full">
              <p
                className={cn(
                  lora.className,
                  "text-[1.125rem] font-normal italic leading-[1.65] sm:text-[1.25rem] sm:leading-[1.7]",
                  "break-words [overflow-wrap:anywhere] hyphens-auto whitespace-pre-wrap",
                )}
                style={{ color: ink }}
              >
                {last!.text}
              </p>
              <footer className="mt-8">
                <p
                  className={cn(
                    lora.className,
                    "text-sm font-normal not-italic leading-6 sm:text-[15px]",
                  )}
                  style={{ color: ink }}
                >
                  — {profileLabel(last!.from)},{" "}
                  {formatTimeAgoFr(last!.createdAt)}
                </p>
              </footer>
            </blockquote>
          </>
        ) : (
          <p
            className={cn(
              lora.className,
              "relative z-[1] m-0 text-[1.05rem] font-normal leading-[1.65] sm:text-[1.125rem]",
            )}
            style={{ color: ink, opacity: 0.85 }}
          >
            Rien pour l’instant. Quand{" "}
            <span className="font-medium">{partnerFirstName}</span> enverra un
            cœur avec un message, il apparaîtra ici.
          </p>
        )}
      </div>
    </div>
  );
}
