import { NextResponse } from "next/server";
import type { PushDispatchKind } from "@/lib/push-types";
import { verifyPushGate } from "@/lib/push-gate";
import { sendPartnerPushNotification } from "@/lib/push-notify-server";
import { isProfileId, type ProfileId } from "@/types/profile";

type DispatchBody = {
  actor?: string;
  kind?: string;
  meta?: { title?: string };
};

function isDispatchKind(value: unknown): value is PushDispatchKind {
  return value === "heart" || value === "star" || value === "memory";
}

export async function POST(request: Request) {
  if (!verifyPushGate(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: DispatchBody;
  try {
    body = (await request.json()) as DispatchBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const actor = body.actor;
  if (!isProfileId(actor)) {
    return NextResponse.json({ error: "invalid_actor" }, { status: 400 });
  }
  if (!isDispatchKind(body.kind)) {
    return NextResponse.json({ error: "invalid_kind" }, { status: 400 });
  }

  const result = await sendPartnerPushNotification(
    body.kind,
    actor as ProfileId,
    body.meta,
  );

  if (!result.ok && result.error === "vapid_not_configured") {
    return NextResponse.json({ ok: false, skipped: "vapid" }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}
