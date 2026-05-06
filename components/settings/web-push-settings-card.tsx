"use client";

import { useCallback, useState } from "react";
import { useProfile } from "@/components/auth/profile-context";
import { Card } from "@/components/ui/card";
import { urlBase64ToUint8Array } from "@/lib/vapid-base64";
import { cn } from "@/lib/utils";

export function WebPushSettingsCard() {
  const { profile } = useProfile();
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "done">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);

  const enableNotifications = useCallback(async () => {
    const gate = process.env.NEXT_PUBLIC_PUSH_GATE_KEY;
    const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!profile || !gate || !vapidPublic) {
      setMessage(
        "Notifications non configurées sur le serveur (clés VAPID / PUSH_GATE).",
      );
      setStatus("error");
      return;
    }

    setStatus("loading");
    setMessage(null);

    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      setMessage("Ce navigateur ne gère pas les notifications Web.");
      setStatus("error");
      return;
    }

    const perm = await Notification.requestPermission();
    if (perm !== "granted") {
      setMessage("Permission refusée. Tu peux la réactiver dans Réglages iOS.");
      setStatus("error");
      return;
    }

    try {
      const reg = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });
      await reg.update();

      const sub = await reg.pushManager.subscribe({
        applicationServerKey: urlBase64ToUint8Array(
          vapidPublic,
        ) as BufferSource,
        userVisibleOnly: true,
      });

      const res = await fetch("/api/push/subscribe", {
        body: JSON.stringify({
          profile,
          subscription: sub.toJSON(),
        }),
        headers: {
          Authorization: `Bearer ${gate}`,
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!res.ok) {
        setMessage("Enregistrement de l’abonnement impossible.");
        setStatus("error");
        return;
      }

      setMessage(
        "C’est bon. Sur iPhone : iOS 16.4+, ajoute Royaume à l’écran d’accueil et active les notifications pour ce site dans Réglages.",
      );
      setStatus("done");
    } catch {
      setMessage("Une erreur est survenue. Réessaie depuis l’app écran d’accueil.");
      setStatus("error");
    }
  }, [profile]);

  if (!profile) {
    return null;
  }

  return (
    <Card className="rounded-[24px]">
      <h2 className="mb-2 text-xl font-semibold tracking-normal text-zinc-950">
        Notifications
      </h2>
      <p className="mb-4 text-sm leading-6 text-zinc-600">
        Recevoir une alerte quand l’autre envoie un cœur, ajoute une étoile ou un
        souvenir. Sur iPhone : installer l’app via Safari (« Ajouter à l’écran
        d’accueil »), puis activer ici.
      </p>
      <button
        className={cn(
          "min-h-12 w-full rounded-full border border-zinc-200 bg-white px-6 text-[16px] font-semibold text-zinc-900",
          "transition-colors active:bg-zinc-100 disabled:opacity-50",
        )}
        disabled={status === "loading"}
        onClick={() => void enableNotifications()}
        type="button"
      >
        {status === "loading" ? "Activation…" : "Activer les notifications"}
      </button>
      {message ? (
        <p
          className={cn(
            "mt-3 text-sm leading-5",
            status === "error" ? "text-red-600" : "text-zinc-600",
          )}
        >
          {message}
        </p>
      ) : null}
    </Card>
  );
}
