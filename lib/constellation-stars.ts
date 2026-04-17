import { getSharedDataClient } from "@/lib/shared-data-client";
import { startSharedSyncPolling } from "@/lib/shared-sync";
import { isProfileId, type ProfileId } from "@/types/profile";
import type { Database } from "@/types/supabase";

export const CONSTELLATION_STORAGE_KEY = "royaume:constellation-stars";
export const CONSTELLATION_UPDATED_EVENT = "royaume:constellation-updated";
export const MIN_CONSTELLATION_STAR_SIZE = 10;
export const MAX_CONSTELLATION_STAR_SIZE = 30;
export const DEFAULT_CONSTELLATION_STAR_SIZE = 14;

type ConstellationStarRow =
  Database["public"]["Tables"]["constellation_stars"]["Row"];

export type ConstellationStar = {
  id: string;
  createdAt: number;
  createdBy?: ProfileId;
  size: number;
  text: string;
  x: number;
  y: number;
};

type NewConstellationStar = Pick<
  ConstellationStar,
  "size" | "text" | "x" | "y"
> & {
  createdBy?: ProfileId | null;
};

function clamp01(value: number): number {
  if (Number.isNaN(value)) {
    return 0.5;
  }
  return Math.min(1, Math.max(0, value));
}

function clampStarSize(value: number): number {
  if (Number.isNaN(value)) {
    return DEFAULT_CONSTELLATION_STAR_SIZE;
  }
  return Math.min(MAX_CONSTELLATION_STAR_SIZE, Math.max(MIN_CONSTELLATION_STAR_SIZE, value));
}

function toTimestamp(value: string): number {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Date.now() : parsed;
}

function notifyConstellationUpdated(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new Event(CONSTELLATION_UPDATED_EVENT));
}

function fromRow(row: ConstellationStarRow): ConstellationStar {
  return {
    id: row.id,
    createdAt: toTimestamp(row.created_at),
    createdBy: isProfileId(row.created_by_profile) ? row.created_by_profile : undefined,
    size: clampStarSize(row.size),
    text: row.body.trim().slice(0, 20),
    x: clamp01(row.x),
    y: clamp01(row.y),
  };
}

export function readConstellationStars(): ConstellationStar[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(CONSTELLATION_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    const stars: ConstellationStar[] = [];
    for (const item of parsed) {
      if (
        item &&
        typeof item === "object" &&
        typeof (item as ConstellationStar).id === "string" &&
        typeof (item as ConstellationStar).createdAt === "number" &&
        typeof (item as ConstellationStar).text === "string" &&
        typeof (item as ConstellationStar).x === "number" &&
        typeof (item as ConstellationStar).y === "number"
      ) {
        stars.push({
          ...item,
          createdBy: isProfileId((item as ConstellationStar).createdBy)
            ? (item as ConstellationStar).createdBy
            : undefined,
          size:
            typeof (item as Partial<ConstellationStar>).size === "number"
              ? clampStarSize((item as Partial<ConstellationStar>).size ?? DEFAULT_CONSTELLATION_STAR_SIZE)
              : DEFAULT_CONSTELLATION_STAR_SIZE,
          x: clamp01((item as ConstellationStar).x),
          y: clamp01((item as ConstellationStar).y),
        });
      }
    }

    return stars.sort((a, b) => a.createdAt - b.createdAt);
  } catch {
    return [];
  }
}

function writeConstellationStars(stars: ConstellationStar[], notify = true): void {
  window.localStorage.setItem(CONSTELLATION_STORAGE_KEY, JSON.stringify(stars));
  if (notify) {
    notifyConstellationUpdated();
  }
}

export async function hydrateConstellationStars(): Promise<ConstellationStar[]> {
  if (typeof window === "undefined") {
    return [];
  }

  const { data, error } = await getSharedDataClient()
    .from("constellation_stars")
    .select("id, created_by_profile, body, size, x, y, created_at")
    .order("created_at", { ascending: true });

  void error;

  if (data && (data.length > 0 || readConstellationStars().length === 0)) {
    writeConstellationStars(data.map((row) => fromRow(row)));
  }

  return readConstellationStars();
}

export function subscribeConstellationStars(): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const supabase = getSharedDataClient();
  const stopPolling = startSharedSyncPolling(hydrateConstellationStars);
  const channel = supabase
    .channel("royaume:constellation-stars")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "constellation_stars" },
      () => {
        void hydrateConstellationStars();
      },
    )
    .subscribe();

  return () => {
    stopPolling();
    void supabase.removeChannel(channel);
  };
}

export async function deleteConstellationStar(id: string): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  const next = readConstellationStars().filter((star) => star.id !== id);
  writeConstellationStars(next);

  const { error } = await getSharedDataClient()
    .from("constellation_stars")
    .delete()
    .eq("id", id);

  void error;
}

export async function addConstellationStar({
  createdBy,
  size,
  text,
  x,
  y,
}: NewConstellationStar): Promise<ConstellationStar | null> {
  if (typeof window === "undefined") {
    return null;
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }

  const createdAt = Date.now();
  const optimistic: ConstellationStar = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${createdAt}-${Math.random().toString(36).slice(2)}`,
    createdAt,
    createdBy: createdBy ?? undefined,
    size: clampStarSize(size),
    text: trimmed.slice(0, 20),
    x: clamp01(x),
    y: clamp01(y),
  };

  const stars = readConstellationStars().filter((star) => star.id !== optimistic.id);
  stars.push(optimistic);
  writeConstellationStars(stars);

  const { data, error } = await getSharedDataClient()
    .from("constellation_stars")
    .insert({
      body: optimistic.text,
      created_by_profile: createdBy ?? null,
      size: optimistic.size,
      x: optimistic.x,
      y: optimistic.y,
    })
    .select("id, created_by_profile, body, size, x, y, created_at")
    .single();

  if (error || !data) {
    void error;
    return optimistic;
  }

  const saved = fromRow(data);
  const next = readConstellationStars().filter((star) => star.id !== optimistic.id);
  next.push(saved);
  writeConstellationStars(next);
  return saved;
}
