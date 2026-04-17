import { NextResponse, type NextRequest } from "next/server";
import { hasSupabaseConfig } from "@/lib/env";
import { DEFAULT_AUTHENTICATED_ROUTE } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

const EMAIL_OTP_TYPES = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
] as const;

type EmailOtpType = (typeof EMAIL_OTP_TYPES)[number];

function getSafeNextPath(nextPath: string | null) {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return DEFAULT_AUTHENTICATED_ROUTE;
  }

  return nextPath;
}

function getAuthErrorUrl(requestUrl: URL, message: string) {
  const authUrl = new URL("/auth", requestUrl);
  authUrl.searchParams.set("error", message);
  return authUrl;
}

function getEmailOtpType(type: string | null): EmailOtpType {
  if (type && EMAIL_OTP_TYPES.includes(type as EmailOtpType)) {
    return type as EmailOtpType;
  }

  return "email";
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = getEmailOtpType(requestUrl.searchParams.get("type"));
  const nextPath = getSafeNextPath(requestUrl.searchParams.get("next"));

  if (!hasSupabaseConfig() || (!code && !tokenHash)) {
    return NextResponse.redirect(
      getAuthErrorUrl(requestUrl, "Lien incomplet. Renvoie un nouveau lien."),
    );
  }

  const supabase = await createClient();
  const { error } = tokenHash
    ? await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type,
      })
    : await supabase.auth.exchangeCodeForSession(code!);

  if (error) {
    return NextResponse.redirect(getAuthErrorUrl(requestUrl, error.message));
  }

  return NextResponse.redirect(new URL(nextPath, requestUrl));
}
