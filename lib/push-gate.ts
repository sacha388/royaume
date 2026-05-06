/**
 * Clé partagée (même valeur que NEXT_PUBLIC_PUSH_GATE_KEY côté client).
 * Pour une app privée à deux ; durcir avec webhook Supabase si besoin.
 */
export function getPushGateSecret(): string | undefined {
  return process.env.PUSH_GATE_KEY ?? process.env.NEXT_PUBLIC_PUSH_GATE_KEY;
}

export function verifyPushGate(request: Request): boolean {
  const secret = getPushGateSecret();
  if (!secret) {
    return false;
  }
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}
