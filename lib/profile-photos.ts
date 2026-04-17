import type { ProfileId } from "@/types/profile";

/** Mêmes fichiers que sur l’écran de choix de profil (`/auth`). */
export const PROFILE_PHOTO_SRC: Record<ProfileId, string> = {
  reane: "/reane.PNG",
  sacha: "/sacha.PNG",
};

export function profilePhotoSrc(id: ProfileId): string {
  return PROFILE_PHOTO_SRC[id];
}
