import { getSharedDataClient } from "@/lib/shared-data-client";
import { isProfileId, partnerProfileId, type ProfileId } from "@/types/profile";
import type { Database } from "@/types/supabase";

const STORAGE_KEY = "royaume:couple-messages";
const CELEBRATION_ACK_KEY = "royaume:heart-celebration-ack";
export const COUPLE_MESSAGES_UPDATED_EVENT = "royaume:inbox-updated";

type CelebrationAckMap = Partial<Record<ProfileId, string>>;
type CoupleMessageRow = Database["public"]["Tables"]["couple_messages"]["Row"];
type HeartAckRow = Database["public"]["Tables"]["heart_acknowledgements"]["Row"];

export type CoupleMessage = {
  id: string;
  from: ProfileId;
  text: string;
  createdAt: number;
};

function notifyInboxChanged(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new Event(COUPLE_MESSAGES_UPDATED_EVENT));
}

function toTimestamp(value: string): number {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Date.now() : parsed;
}

function fromRow(row: CoupleMessageRow): CoupleMessage | null {
  if (!isProfileId(row.from_profile)) {
    return null;
  }

  return {
    id: row.id,
    from: row.from_profile,
    text: row.body,
    createdAt: toTimestamp(row.created_at),
  };
}

function readAll(): CoupleMessage[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    const out: CoupleMessage[] = [];
    for (const item of parsed) {
      if (
        item &&
        typeof item === "object" &&
        typeof (item as CoupleMessage).id === "string" &&
        isProfileId((item as CoupleMessage).from) &&
        typeof (item as CoupleMessage).text === "string" &&
        typeof (item as CoupleMessage).createdAt === "number"
      ) {
        out.push(item as CoupleMessage);
      }
    }
    return out.sort((a, b) => a.createdAt - b.createdAt);
  } catch {
    return [];
  }
}

function writeAll(messages: CoupleMessage[], notify = true): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  if (notify) {
    notifyInboxChanged();
  }
}

function appendLocal(message: CoupleMessage): void {
  const all = readAll().filter((item) => item.id !== message.id);
  all.push(message);
  writeAll(all);
}

function readCelebrationAckMap(): CelebrationAckMap {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(CELEBRATION_ACK_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null) {
      return {};
    }
    return parsed as CelebrationAckMap;
  } catch {
    return {};
  }
}

function writeCelebrationAckMap(map: CelebrationAckMap, notify = true): void {
  window.localStorage.setItem(CELEBRATION_ACK_KEY, JSON.stringify(map));
  if (notify) {
    notifyInboxChanged();
  }
}

function cacheHeartAck(row: HeartAckRow): void {
  if (!isProfileId(row.profile)) {
    return;
  }

  const map = readCelebrationAckMap();
  map[row.profile] = row.message_id;
  writeCelebrationAckMap(map);
}

export async function hydrateCoupleMessages(): Promise<CoupleMessage[]> {
  if (typeof window === "undefined") {
    return [];
  }

  const supabase = getSharedDataClient();
  const [{ data: messages }, { data: acknowledgements }] = await Promise.all([
    supabase
      .from("couple_messages")
      .select("id, from_profile, body, created_at")
      .order("created_at", { ascending: true }),
    supabase
      .from("heart_acknowledgements")
      .select("profile, message_id, acknowledged_at"),
  ]);

  if (messages && (messages.length > 0 || readAll().length === 0)) {
    const next = messages
      .map((row) => fromRow(row))
      .filter((message): message is CoupleMessage => Boolean(message));
    writeAll(next);
  }

  if (
    acknowledgements &&
    (acknowledgements.length > 0 ||
      Object.keys(readCelebrationAckMap()).length === 0)
  ) {
    const nextMap: CelebrationAckMap = {};
    for (const item of acknowledgements) {
      if (isProfileId(item.profile)) {
        nextMap[item.profile] = item.message_id;
      }
    }
    writeCelebrationAckMap(nextMap);
  }

  return readAll();
}

export function subscribeCoupleMessages(): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const supabase = getSharedDataClient();
  const channel = supabase
    .channel("royaume:couple-messages")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "couple_messages" },
      () => {
        void hydrateCoupleMessages();
      },
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "heart_acknowledgements" },
      () => {
        void hydrateCoupleMessages();
      },
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

/**
 * Enregistre un cœur / message envoyé par le profil courant.
 * L’autre profil le verra dans « Dernier message reçu », même sur un autre téléphone.
 */
export async function appendCoupleMessage(
  from: ProfileId,
  text: string,
): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  const trimmed = text.trim();
  const body = trimmed || "Un cœur pour toi.";
  const createdAt = Date.now();
  const optimistic: CoupleMessage = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${createdAt}-${Math.random().toString(36).slice(2)}`,
    from,
    text: body,
    createdAt,
  };

  appendLocal(optimistic);

  const { data, error } = await getSharedDataClient()
    .from("couple_messages")
    .insert({
      body,
      from_profile: from,
    })
    .select("id, from_profile, body, created_at")
    .single();

  if (error || !data) {
    return;
  }

  const saved = fromRow(data);
  if (!saved) {
    return;
  }

  const all = readAll().filter((item) => item.id !== optimistic.id);
  all.push(saved);
  writeAll(all);
}

/** Dernier message dont l’expéditeur n’est pas le profil qui consulte. */
export function getLastReceivedForViewer(
  viewer: ProfileId,
): CoupleMessage | null {
  if (typeof window === "undefined") {
    return null;
  }

  const all = readAll();
  for (let i = all.length - 1; i >= 0; i--) {
    const m = all[i]!;
    if (m.from !== viewer) {
      return m;
    }
  }
  return null;
}

/**
 * Dernier envoi de `sender` pas encore « ouvert » par le partenaire
 * (écran de célébration non validé).
 */
export function getPendingOutboundHeart(sender: ProfileId): CoupleMessage | null {
  if (typeof window === "undefined") {
    return null;
  }

  const all = readAll();
  let latestFromSender: CoupleMessage | null = null;
  for (const m of all) {
    if (m.from !== sender) {
      continue;
    }
    if (!latestFromSender || m.createdAt > latestFromSender.createdAt) {
      latestFromSender = m;
    }
  }
  if (!latestFromSender) {
    return null;
  }

  const receiver = partnerProfileId(sender);
  const ack = readCelebrationAckMap()[receiver];
  if (ack === latestFromSender.id) {
    return null;
  }
  return latestFromSender;
}

/**
 * Dernier message reçu du partenaire qui n’a pas encore été « célébré »
 * (plein écran) pour ce profil.
 */
export function getPendingHeartCelebration(
  viewer: ProfileId,
): CoupleMessage | null {
  const last = getLastReceivedForViewer(viewer);
  if (!last) {
    return null;
  }
  const ack = readCelebrationAckMap()[viewer];
  if (ack === last.id) {
    return null;
  }
  return last;
}

export async function acknowledgeHeartCelebration(
  viewer: ProfileId,
  messageId: string,
): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  const map = readCelebrationAckMap();
  map[viewer] = messageId;
  writeCelebrationAckMap(map);

  const { data } = await getSharedDataClient()
    .from("heart_acknowledgements")
    .upsert({
      acknowledged_at: new Date().toISOString(),
      message_id: messageId,
      profile: viewer,
    })
    .select("profile, message_id, acknowledged_at")
    .single();

  if (data) {
    cacheHeartAck(data);
  }
}

export function formatTimeAgoFr(timestamp: number): string {
  const sec = Math.floor((Date.now() - timestamp) / 1000);
  if (sec < 10) {
    return "à l’instant";
  }
  if (sec < 60) {
    return "il y a moins d’une minute";
  }
  const min = Math.floor(sec / 60);
  if (min < 60) {
    return min === 1 ? "il y a 1 minute" : `il y a ${min} minutes`;
  }
  const h = Math.floor(min / 60);
  if (h < 24) {
    return h === 1 ? "il y a 1 heure" : `il y a ${h} heures`;
  }
  const d = Math.floor(h / 24);
  return d === 1 ? "il y a 1 jour" : `il y a ${d} jours`;
}
