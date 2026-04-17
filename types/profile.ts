export type ProfileId = "reane" | "sacha";

export type ProfileOption = {
  id: ProfileId;
  label: string;
};

export const PROFILE_OPTIONS: ProfileOption[] = [
  { id: "reane", label: "Reane" },
  { id: "sacha", label: "Sacha" },
];

export function isProfileId(value: unknown): value is ProfileId {
  return value === "reane" || value === "sacha";
}

export function partnerOf(profile: ProfileId): "Reane" | "Sacha" {
  return profile === "reane" ? "Sacha" : "Reane";
}

/** L’autre profil (`ProfileId`), pour la logique métier (pas seulement le libellé). */
export function partnerProfileId(profile: ProfileId): ProfileId {
  return profile === "reane" ? "sacha" : "reane";
}

export function profileLabel(profile: ProfileId): "Reane" | "Sacha" {
  return profile === "reane" ? "Reane" : "Sacha";
}
