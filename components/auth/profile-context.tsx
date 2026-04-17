"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  clearStoredProfile,
  LOCAL_PROFILE_UPDATED_EVENT,
  readStoredProfile,
  writeStoredProfile,
} from "@/lib/local-profile";
import type { ProfileId } from "@/types/profile";

type ProfileContextValue = {
  /** `true` après lecture initiale du localStorage (côté client). */
  ready: boolean;
  profile: ProfileId | null;
  login: (id: ProfileId) => void;
  logout: () => void;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

const PROFILE_LOADING = "__loading";
const PROFILE_EMPTY = "__empty";

type ProfileSnapshot = ProfileId | typeof PROFILE_EMPTY | typeof PROFILE_LOADING;

function getStoredProfileSnapshot(): ProfileSnapshot {
  if (typeof window === "undefined") {
    return PROFILE_LOADING;
  }

  return readStoredProfile() ?? PROFILE_EMPTY;
}

function getServerProfileSnapshot(): ProfileSnapshot {
  return PROFILE_LOADING;
}

function subscribeToStoredProfile(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(LOCAL_PROFILE_UPDATED_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(LOCAL_PROFILE_UPDATED_EVENT, onStoreChange);
  };
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(
    subscribeToStoredProfile,
    getStoredProfileSnapshot,
    getServerProfileSnapshot,
  );
  const ready = snapshot !== PROFILE_LOADING;
  const profile: ProfileId | null =
    snapshot === PROFILE_EMPTY || snapshot === PROFILE_LOADING ? null : snapshot;

  const login = useCallback((id: ProfileId) => {
    writeStoredProfile(id);
  }, []);

  const logout = useCallback(() => {
    clearStoredProfile();
  }, []);

  const value = useMemo(
    () => ({ ready, profile, login, logout }),
    [ready, profile, login, logout],
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error("useProfile doit être utilisé sous ProfileProvider");
  }
  return ctx;
}
