import { NextResponse } from "next/server";
import { verifyPushGate } from "@/lib/push-gate";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isProfileId } from "@/types/profile";

type SubscribeBody = {
  profile?: string;
  subscription?: {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };
};

export async function POST(request: Request) {
  if (!verifyPushGate(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: SubscribeBody;
  try {
    body = (await request.json()) as SubscribeBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const profile = body.profile;
  const sub = body.subscription;
  if (!isProfileId(profile) || !sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("web_push_subscriptions").upsert(
    {
      auth: sub.keys.auth,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      profile,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "endpoint" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
