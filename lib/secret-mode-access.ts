export const SECRET_MODE_ACCESS_KEY = "royaume:secret-mode-access";

const SECRET_MODE_ACCESS_TTL_MS = 45_000;

type SecretModeAccessPayload = {
  expiresAt: number;
};

export function grantSecretModeAccess(): void {
  if (typeof window === "undefined") {
    return;
  }

  const payload: SecretModeAccessPayload = {
    expiresAt: Date.now() + SECRET_MODE_ACCESS_TTL_MS,
  };

  window.sessionStorage.setItem(SECRET_MODE_ACCESS_KEY, JSON.stringify(payload));
}

function readSecretModeAccess(): SecretModeAccessPayload | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(SECRET_MODE_ACCESS_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as SecretModeAccessPayload;
  } catch {
    return null;
  }
}

export function hasSecretModeAccess(): boolean {
  const payload = readSecretModeAccess();
  if (!payload || typeof payload.expiresAt !== "number") {
    return false;
  }

  if (payload.expiresAt <= Date.now()) {
    window.sessionStorage.removeItem(SECRET_MODE_ACCESS_KEY);
    return false;
  }

  return true;
}
