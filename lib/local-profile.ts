import { isProfileId, type ProfileId } from "@/types/profile";

/** Clé localStorage — préfixée pour éviter les collisions. */
export const LOCAL_PROFILE_STORAGE_KEY = "royaume:profile";
export const LOCAL_PROFILE_UPDATED_EVENT = "royaume:profile-updated";

function notifyStoredProfileChanged(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(LOCAL_PROFILE_UPDATED_EVENT));
}

export function readStoredProfile(): ProfileId | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(LOCAL_PROFILE_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  const normalized = raw.trim().toLowerCase();
  return isProfileId(normalized) ? normalized : null;
}

export function writeStoredProfile(id: ProfileId): void {
  window.localStorage.setItem(LOCAL_PROFILE_STORAGE_KEY, id);
  notifyStoredProfileChanged();
}

export function clearStoredProfile(): void {
  window.localStorage.removeItem(LOCAL_PROFILE_STORAGE_KEY);
  notifyStoredProfileChanged();
}
