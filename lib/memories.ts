import { getSharedDataClient } from "@/lib/shared-data-client";
import { startSharedSyncPolling } from "@/lib/shared-sync";
import { isProfileId, type ProfileId } from "@/types/profile";
import type { Database } from "@/types/supabase";

export const MEMORIES_STORAGE_KEY = "royaume:memories";
export const MEMORIES_UPDATED_EVENT = "royaume:memories-updated";

type MemoryRow = Database["public"]["Tables"]["memories"]["Row"];

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

function toTimestamp(value: string): number {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Date.now() : parsed;
}

function fromRow(row: MemoryRow): MemoryItem | null {
  if (!isProfileId(row.profile)) {
    return null;
  }

  return {
    id: row.id,
    createdAt: toTimestamp(row.created_at),
    imageDataUrl: row.image_data_url,
    profile: row.profile,
    title: row.title.trim().slice(0, 15),
  };
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

function writeMemories(memories: MemoryItem[], notify = true): void {
  window.localStorage.setItem(MEMORIES_STORAGE_KEY, JSON.stringify(memories));
  if (notify) {
    notifyMemoriesUpdated();
  }
}

export async function hydrateMemories(): Promise<MemoryItem[]> {
  if (typeof window === "undefined") {
    return [];
  }

  const { data, error } = await getSharedDataClient()
    .from("memories")
    .select("id, profile, title, image_data_url, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[royaume:supabase] memories select failed", error);
  }

  if (data && (data.length > 0 || readMemories().length === 0)) {
    const next = data
      .map((row) => fromRow(row))
      .filter((memory): memory is MemoryItem => Boolean(memory));
    writeMemories(next);
  }

  return readMemories();
}

export function subscribeMemories(): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const supabase = getSharedDataClient();
  const stopPolling = startSharedSyncPolling(hydrateMemories);
  const channel = supabase
    .channel("royaume:memories")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "memories" },
      () => {
        void hydrateMemories();
      },
    )
    .subscribe();

  return () => {
    stopPolling();
    void supabase.removeChannel(channel);
  };
}

export async function addMemory({
  imageDataUrl,
  profile,
  title,
}: NewMemoryItem): Promise<MemoryItem | null> {
  if (typeof window === "undefined") {
    return null;
  }

  const trimmedTitle = title.trim().slice(0, 15);
  const trimmedImage = imageDataUrl.trim();
  if (!trimmedTitle || !trimmedImage) {
    return null;
  }

  const createdAt = Date.now();
  const optimistic: MemoryItem = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${createdAt}-${Math.random().toString(36).slice(2)}`,
    createdAt,
    imageDataUrl: trimmedImage,
    profile,
    title: trimmedTitle,
  };

  const memories = readMemories().filter((memory) => memory.id !== optimistic.id);
  memories.unshift(optimistic);
  writeMemories(memories);

  const { data, error } = await getSharedDataClient()
    .from("memories")
    .insert({
      image_data_url: trimmedImage,
      profile,
      title: trimmedTitle,
    })
    .select("id, profile, title, image_data_url, created_at")
    .single();

  if (error || !data) {
    console.error("[royaume:supabase] memories insert failed", error);
    return optimistic;
  }

  const saved = fromRow(data);
  if (!saved) {
    return optimistic;
  }

  const next = readMemories().filter((memory) => memory.id !== optimistic.id);
  next.unshift(saved);
  writeMemories(next);
  return saved;
}
