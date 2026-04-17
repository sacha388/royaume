import { isProfileId, type ProfileId } from "@/types/profile";

export const MEMORIES_STORAGE_KEY = "royaume:memories";
export const MEMORIES_UPDATED_EVENT = "royaume:memories-updated";

export type MemoryItem = {
  id: string;
  createdAt: number;
  imageDataUrl: string;
  profile: ProfileId;
  title: string;
};

type NewMemoryItem = Pick<MemoryItem, "imageDataUrl" | "profile" | "title">;

function notifyMemoriesUpdated(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new Event(MEMORIES_UPDATED_EVENT));
}

export function readMemories(): MemoryItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(MEMORIES_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    const memories: MemoryItem[] = [];
    for (const item of parsed) {
      if (
        item &&
        typeof item === "object" &&
        typeof (item as MemoryItem).id === "string" &&
        typeof (item as MemoryItem).createdAt === "number" &&
        typeof (item as MemoryItem).imageDataUrl === "string" &&
        isProfileId((item as MemoryItem).profile) &&
        typeof (item as MemoryItem).title === "string"
      ) {
        memories.push({
          ...item,
          title: (item as MemoryItem).title.trim().slice(0, 15),
        });
      }
    }

    return memories.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

function writeMemories(memories: MemoryItem[]): void {
  window.localStorage.setItem(MEMORIES_STORAGE_KEY, JSON.stringify(memories));
  notifyMemoriesUpdated();
}

export function addMemory({
  imageDataUrl,
  profile,
  title,
}: NewMemoryItem): MemoryItem | null {
  if (typeof window === "undefined") {
    return null;
  }

  const trimmedTitle = title.trim().slice(0, 15);
  const trimmedImage = imageDataUrl.trim();
  if (!trimmedTitle || !trimmedImage) {
    return null;
  }

  const next: MemoryItem = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: Date.now(),
    imageDataUrl: trimmedImage,
    profile,
    title: trimmedTitle,
  };

  const memories = readMemories();
  memories.unshift(next);
  writeMemories(memories);
  return next;
}
