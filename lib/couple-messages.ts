import { isProfileId, partnerProfileId, type ProfileId } from "@/types/profile";

const STORAGE_KEY = "royaume:couple-messages";
const CELEBRATION_ACK_KEY = "royaume:heart-celebration-ack";

type CelebrationAckMap = Partial<Record<ProfileId, string>>;

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
  window.dispatchEvent(new Event("royaume:inbox-updated"));
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
    return out;
  } catch {
    return [];
  }
}

function writeAll(messages: CoupleMessage[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  notifyInboxChanged();
}

/**
 * Enregistre un cœur / message envoyé par le profil courant.
 * L’autre profil le verra dans « Dernier message reçu » (même navigateur).
 */
export function appendCoupleMessage(from: ProfileId, text: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const trimmed = text.trim();
  const body = trimmed || "Un cœur pour toi.";

  const next: CoupleMessage = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    from,
    text: body,
    createdAt: Date.now(),
  };

  const all = readAll();
  all.push(next);
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

function writeCelebrationAckMap(map: CelebrationAckMap): void {
  window.localStorage.setItem(CELEBRATION_ACK_KEY, JSON.stringify(map));
  notifyInboxChanged();
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

export function acknowledgeHeartCelebration(
  viewer: ProfileId,
  messageId: string,
): void {
  if (typeof window === "undefined") {
    return;
  }
  const map = readCelebrationAckMap();
  map[viewer] = messageId;
  writeCelebrationAckMap(map);
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
