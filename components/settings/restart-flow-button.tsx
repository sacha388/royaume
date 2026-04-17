"use client";

import { markFlowRestart } from "@/lib/flow-restart";
import { clearStoredProfile } from "@/lib/local-profile";
import { cn } from "@/lib/utils";

export function RestartFlowButton() {
  function restartFlow() {
    markFlowRestart();
    clearStoredProfile();
    window.location.replace("/");
  }

  return (
    <button
      className={cn(
        "mt-auto min-h-12 w-full rounded-full border border-[#c44f5d]/20 bg-white px-5",
        "text-sm font-semibold text-[#c44f5d] transition-colors active:bg-[#c44f5d]/10",
      )}
      onClick={restartFlow}
      type="button"
    >
      Revenir au début de l’app
    </button>
  );
}
