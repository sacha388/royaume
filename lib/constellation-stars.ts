export const CONSTELLATION_STORAGE_KEY = "royaume:constellation-stars";
export const CONSTELLATION_UPDATED_EVENT = "royaume:constellation-updated";
export const MIN_CONSTELLATION_STAR_SIZE = 10;
export const MAX_CONSTELLATION_STAR_SIZE = 30;
export const DEFAULT_CONSTELLATION_STAR_SIZE = 14;

export type ConstellationStar = {
  id: string;
  createdAt: number;
  size: number;
  text: string;
  x: number;
  y: number;
};

type NewConstellationStar = Pick<
  ConstellationStar,
  "size" | "text" | "x" | "y"
>;

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

function notifyConstellationUpdated(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new Event(CONSTELLATION_UPDATED_EVENT));
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

function writeConstellationStars(stars: ConstellationStar[]): void {
  window.localStorage.setItem(CONSTELLATION_STORAGE_KEY, JSON.stringify(stars));
  notifyConstellationUpdated();
}

export function deleteConstellationStar(id: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const next = readConstellationStars().filter((star) => star.id !== id);
  writeConstellationStars(next);
}

export function addConstellationStar({
  size,
  text,
  x,
  y,
}: NewConstellationStar): ConstellationStar | null {
  if (typeof window === "undefined") {
    return null;
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }

  const next: ConstellationStar = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: Date.now(),
    size: clampStarSize(size),
    text: trimmed.slice(0, 20),
    x: clamp01(x),
    y: clamp01(y),
  };

  const stars = readConstellationStars();
  stars.push(next);
  writeConstellationStars(stars);
  return next;
}
