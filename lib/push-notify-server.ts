import webpush from "web-push";
import { isProfileId, partnerProfileId, type ProfileId } from "@/types/profile";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { PushDispatchKind } from "@/lib/push-types";

function labelForActor(actor: ProfileId): string {
  return actor === "reane" ? "Réane" : "Sacha";
}

function notificationForKind(
  kind: PushDispatchKind,
  actor: ProfileId,
  meta?: { title?: string },
): { title: string; body: string; url: string } {
  const name = labelForActor(actor);
  switch (kind) {
    case "heart":
      return {
        title: "Royaume",
        body: `Un cœur de ${name}`,
        url: "/home",
      };
    case "star":
      return {
        title: "Royaume",
        body: `${name} a ajouté une étoile`,
        url: "/constellation",
      };
    case "memory": {
      const t = meta?.title?.trim();
      return {
        title: "Royaume",
        body: t ? `Nouveau souvenir : ${t}` : `Nouveau souvenir de ${name}`,
        url: "/memories",
      };
    }
    default:
      return { title: "Royaume", body: "Nouveau message", url: "/home" };
  }
}

let vapidConfigured = false;

function ensureWebPushConfigured(): boolean {
  if (vapidConfigured) {
    return true;
  }
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:couple@localhost";
  if (!publicKey || !privateKey) {
    return false;
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
  return true;
}

export async function sendPartnerPushNotification(
  kind: PushDispatchKind,
  actor: ProfileId,
  meta?: { title?: string },
): Promise<{ ok: boolean; error?: string }> {
  if (!isProfileId(actor)) {
    return { ok: false, error: "invalid_actor" };
  }
  if (!ensureWebPushConfigured()) {
    return { ok: false, error: "vapid_not_configured" };
  }

  const recipient = partnerProfileId(actor);
  const supabase = createServerSupabaseClient();
  const { data: rows, error } = await supabase
    .from("web_push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("profile", recipient);

  if (error || !rows?.length) {
    return { ok: true };
  }

  const payload = notificationForKind(kind, actor, meta);
  const body = JSON.stringify(payload);

  for (const row of rows) {
    const subscription = {
      endpoint: row.endpoint,
      keys: {
        p256dh: row.p256dh,
        auth: row.auth,
      },
    };

    try {
      await webpush.sendNotification(subscription, body, {
        TTL: 60 * 60,
      });
    } catch (err: unknown) {
      const statusCode =
        err && typeof err === "object" && "statusCode" in err
          ? (err as { statusCode?: number }).statusCode
          : undefined;
      if (statusCode === 404 || statusCode === 410) {
        await supabase
          .from("web_push_subscriptions")
          .delete()
          .eq("id", row.id);
      }
    }
  }

  return { ok: true };
}
