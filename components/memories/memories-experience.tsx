"use client";

import Image from "next/image";
import { useEffect, useState, type ChangeEvent } from "react";
import { useProfile } from "@/components/auth/profile-context";
import { MobileShell } from "@/components/layout/mobile-shell";
import { BackLink } from "@/components/ui/back-link";
import { profileLabel } from "@/types/profile";
import {
  addMemory,
  MEMORIES_UPDATED_EVENT,
  hydrateMemories,
  readMemories,
  resetMemories,
  subscribeMemories,
  type MemoryItem,
} from "@/lib/memories";
import { cn } from "@/lib/utils";

const MAX_MEMORY_IMAGE_EDGE = 1400;
const MEMORY_IMAGE_QUALITY = 0.82;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Lecture image impossible"));
    };
    reader.onerror = () => reject(new Error("Lecture image impossible"));
    reader.readAsDataURL(file);
  });
}

function loadImageFromObjectUrl(objectUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Décodage image impossible"));
    image.src = objectUrl;
  });
}

async function optimizeMemoryImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    return readFileAsDataUrl(file);
  }

  const objectUrl = window.URL.createObjectURL(file);

  try {
    const image = await loadImageFromObjectUrl(objectUrl);
    const largestEdge = Math.max(image.naturalWidth, image.naturalHeight);
    const scale = largestEdge > 0 ? Math.min(1, MAX_MEMORY_IMAGE_EDGE / largestEdge) : 1;
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      return readFileAsDataUrl(file);
    }

    canvas.width = width;
    canvas.height = height;
    context.drawImage(image, 0, 0, width, height);

    return canvas.toDataURL("image/jpeg", MEMORY_IMAGE_QUALITY);
  } catch {
    return readFileAsDataUrl(file);
  } finally {
    window.URL.revokeObjectURL(objectUrl);
  }
}

export function MemoriesExperience() {
  const { profile } = useProfile();
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [composeOpen, setComposeOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [isReadingImage, setIsReadingImage] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    const syncMemories = () => setMemories(readMemories());

    syncMemories();
    void hydrateMemories();
    const unsubscribe = subscribeMemories();

    window.addEventListener("storage", syncMemories);
    window.addEventListener(MEMORIES_UPDATED_EVENT, syncMemories as EventListener);

    return () => {
      unsubscribe();
      window.removeEventListener("storage", syncMemories);
      window.removeEventListener(
        MEMORIES_UPDATED_EVENT,
        syncMemories as EventListener,
      );
    };
  }, []);

  function closeComposer() {
    setComposeOpen(false);
    setTitle("");
    setImageDataUrl("");
    setIsReadingImage(false);
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsReadingImage(true);
    try {
      const dataUrl = await optimizeMemoryImage(file);
      setImageDataUrl(dataUrl);
    } finally {
      setIsReadingImage(false);
      event.target.value = "";
    }
  }

  async function handleAddMemory() {
    if (!profile) {
      return;
    }

    const added = await addMemory({
      imageDataUrl,
      profile,
      title,
    });

    if (!added) {
      return;
    }

    setMemories(readMemories());
    closeComposer();
  }

  async function handleResetMemories() {
    setIsResetting(true);
    try {
      await resetMemories();
      setMemories([]);
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <MobileShell className="gap-6 pb-6">
      <header className="flex items-start justify-between gap-4">
        <BackLink href="/settings" />
      </header>

      <div className="flex justify-center">
        <button
          className={cn(
            "min-h-11 rounded-full px-5 text-sm font-semibold text-[#fff7f8]",
            "bg-[#c44f5d] transition-colors active:bg-[#b94753]",
          )}
          onClick={() => setComposeOpen(true)}
          type="button"
        >
          + Ajouter un souvenir
        </button>
      </div>

      <section className="grid gap-4 pb-2">
        {memories.length > 0 ? (
          memories.map((memory) => (
            <article
              className="overflow-hidden rounded-[28px] bg-white p-3 shadow-[0_14px_36px_rgba(48,32,28,0.08)]"
              key={memory.id}
            >
              <div className="relative aspect-[0.92] overflow-hidden rounded-[22px] bg-zinc-100">
                <Image
                  alt={memory.title}
                  className="object-cover"
                  fill
                  sizes="(max-width: 430px) calc(100vw - 4rem), 360px"
                  src={memory.imageDataUrl}
                  unoptimized
                />
              </div>
              <div className="px-2 pb-1 pt-3">
                <p className="text-[1.02rem] font-semibold leading-tight text-zinc-950">
                  {memory.title}
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  Par {profileLabel(memory.profile)}
                </p>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-[28px] bg-white/75 px-5 py-7 text-center shadow-[0_10px_28px_rgba(48,32,28,0.05)]">
            <p className="text-sm font-medium text-zinc-500">
              Vos souvenirs importés apparaîtront ici.
            </p>
          </div>
        )}
      </section>

      {memories.length > 0 ? (
        <div className="flex justify-center pb-3">
          <button
            className={cn(
              "min-h-11 rounded-full border border-[#c44f5d]/20 bg-white px-5",
              "text-sm font-semibold text-[#c44f5d] transition-colors active:bg-[#c44f5d]/10",
              "disabled:opacity-45",
            )}
            disabled={isResetting}
            onClick={handleResetMemories}
            type="button"
          >
            {isResetting ? "Réinitialisation..." : "Réinitialisé souvenirs"}
          </button>
        </div>
      ) : null}

      {composeOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-5 backdrop-blur-[2px]"
          onClick={closeComposer}
          role="presentation"
        >
          <div
            className="w-full max-w-[390px] rounded-[30px] bg-[#fffaf6] px-5 py-5 shadow-[0_24px_80px_rgba(0,0,0,0.24)]"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <p className="text-[1.1rem] font-semibold tracking-tight text-zinc-950">
              Ajouter un souvenir
            </p>

            <label className="mt-4 block text-sm font-medium text-zinc-600" htmlFor="memory-title">
              Texte libre
            </label>
            <input
              className={cn(
                "mt-2 min-h-12 w-full rounded-[18px] border border-zinc-200 bg-white px-4 text-[15px] text-zinc-950 outline-none",
                "placeholder:text-zinc-400 focus:border-zinc-300",
              )}
              id="memory-title"
              maxLength={15}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ton titre"
              value={title}
            />

            <div className="mt-4">
              <p className="text-sm font-medium text-zinc-600">Importer une photo</p>
              <label
                className={cn(
                  "mt-2 flex min-h-12 items-center justify-center rounded-[18px] border border-dashed border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700",
                  "transition-colors active:bg-zinc-50",
                )}
              >
                <input
                  accept="image/*"
                  className="sr-only"
                  onChange={handleFileChange}
                  type="file"
                />
                {isReadingImage ? "Import en cours..." : imageDataUrl ? "Photo importée" : "Choisir une photo"}
              </label>
            </div>

            {imageDataUrl ? (
              <div className="relative mt-4 aspect-[1.1] overflow-hidden rounded-[22px] bg-zinc-100">
                <Image
                  alt="Aperçu du souvenir"
                  className="object-cover"
                  fill
                  sizes="(max-width: 430px) calc(100vw - 5rem), 320px"
                  src={imageDataUrl}
                  unoptimized
                />
              </div>
            ) : null}

            <div className="mt-5 flex gap-3">
              <button
                className="min-h-12 flex-1 rounded-full border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-700 transition-colors active:bg-zinc-100"
                onClick={closeComposer}
                type="button"
              >
                Annuler
              </button>
              <button
                className={cn(
                  "min-h-12 flex-1 rounded-full px-5 text-sm font-semibold text-[#fff7f8]",
                  "bg-[#c44f5d] transition-colors active:bg-[#b94753] disabled:opacity-35",
                )}
                disabled={!title.trim() || !imageDataUrl || isReadingImage}
                onClick={handleAddMemory}
                type="button"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </MobileShell>
  );
}
