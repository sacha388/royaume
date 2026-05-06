import type { ProfileId } from "@/types/profile";
import type { PushDispatchKind } from "@/lib/push-types";

export type { PushDispatchKind } from "@/lib/push-types";

/** Déclenche une notification chez le partenaire (non bloquant). */
export async function requestPushDispatch(
  kind: PushDispatchKind,
  actor: ProfileId,
  meta?: { title?: string },
): Promise<void> {
  const gate = process.env.NEXT_PUBLIC_PUSH_GATE_KEY;
  if (!gate || typeof window === "undefined") {
    return;
  }
  try {
    await fetch("/api/push/dispatch", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${gate}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ actor, kind, meta }),
    });
  } catch {
    /* ignorer */
  }
}
