"use client";

import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import {
  addConstellationStar,
  CONSTELLATION_UPDATED_EVENT,
  DEFAULT_CONSTELLATION_STAR_SIZE,
  deleteConstellationStar,
  MAX_CONSTELLATION_STAR_SIZE,
  MIN_CONSTELLATION_STAR_SIZE,
  readConstellationStars,
  type ConstellationStar,
} from "@/lib/constellation-stars";
import { cn } from "@/lib/utils";

type DraftPoint = {
  x: number;
  y: number;
};

function BackArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M15 18 9 12l6-6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function StarGlyph({
  active,
  className,
  draft,
}: {
  active?: boolean;
  className?: string;
  draft?: boolean;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative block h-full w-full rounded-full",
        draft ? "bg-[#c8e0ff]" : active ? "bg-white" : "bg-white/95",
        className,
      )}
    >
      <span
        className={cn(
          "absolute inset-[-7px] rounded-full blur-[10px]",
          draft ? "bg-[#76a9ff]/70" : "bg-white/35",
        )}
      />
      <span
        className={cn(
          "absolute left-1/2 top-1/2 h-[180%] w-px -translate-x-1/2 -translate-y-1/2",
          draft ? "bg-[#dcebff]" : "bg-white/75",
        )}
      />
      <span
        className={cn(
          "absolute left-1/2 top-1/2 h-px w-[180%] -translate-x-1/2 -translate-y-1/2",
          draft ? "bg-[#dcebff]" : "bg-white/75",
        )}
      />
    </span>
  );
}

function starSize(index: number): number {
  return [10, 12, 14][index % 3] ?? 12;
}

export function ConstellationExperience() {
  const skyRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const dragPointerIdRef = useRef<number | null>(null);
  const [composeInsets, setComposeInsets] = useState({ top: 24, bottom: 24 });
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeText, setComposeText] = useState("");
  const [stars, setStars] = useState<ConstellationStar[]>([]);
  const [draftPoint, setDraftPoint] = useState<DraftPoint | null>(null);
  const [draftSize, setDraftSize] = useState(DEFAULT_CONSTELLATION_STAR_SIZE);
  const [draftText, setDraftText] = useState("");
  const [selectedStar, setSelectedStar] = useState<ConstellationStar | null>(
    null,
  );

  useEffect(() => {
    const syncStars = () => setStars(readConstellationStars());

    syncStars();
    window.addEventListener("storage", syncStars);
    window.addEventListener(
      CONSTELLATION_UPDATED_EVENT,
      syncStars as EventListener,
    );

    return () => {
      window.removeEventListener("storage", syncStars);
      window.removeEventListener(
        CONSTELLATION_UPDATED_EVENT,
        syncStars as EventListener,
      );
    };
  }, []);

  useEffect(() => {
    const updateComposeInsets = () => {
      const viewport = window.visualViewport;
      if (!viewport) {
        setComposeInsets({ top: 24, bottom: 24 });
        return;
      }

      const top = Math.max(24, Math.round(viewport.offsetTop) + 24);
      const keyboardInset = Math.max(
        0,
        Math.round(window.innerHeight - (viewport.offsetTop + viewport.height)),
      );

      setComposeInsets({
        top,
        bottom: Math.max(24, keyboardInset + 24),
      });
    };

    updateComposeInsets();
    window.addEventListener("resize", updateComposeInsets);
    window.visualViewport?.addEventListener("resize", updateComposeInsets);
    window.visualViewport?.addEventListener("scroll", updateComposeInsets);

    return () => {
      window.removeEventListener("resize", updateComposeInsets);
      window.visualViewport?.removeEventListener("resize", updateComposeInsets);
      window.visualViewport?.removeEventListener("scroll", updateComposeInsets);
    };
  }, []);

  function closeComposer() {
    setComposeOpen(false);
    setComposeText("");
  }

  function closeDraft() {
    setDraftPoint(null);
    setDraftSize(DEFAULT_CONSTELLATION_STAR_SIZE);
    setDraftText("");
    dragPointerIdRef.current = null;
  }

  function openComposerAt(x: number, y: number) {
    setSelectedStar(null);
    setDraftPoint({ x, y });
    setDraftSize(DEFAULT_CONSTELLATION_STAR_SIZE);
  }

  function updateDraftPointFromClient(clientX: number, clientY: number) {
    const bounds = skyRef.current?.getBoundingClientRect();
    if (!bounds) {
      return;
    }

    const radiusX = draftSize / 2 / bounds.width;
    const radiusY = draftSize / 2 / bounds.height;
    const x = (clientX - bounds.left) / bounds.width;
    const y = (clientY - bounds.top) / bounds.height;

    setDraftPoint({
      x: Math.min(1 - radiusX, Math.max(radiusX, x)),
      y: Math.min(1 - radiusY, Math.max(radiusY, y)),
    });
  }

  function startNewDraft() {
    setSelectedStar(null);
    setComposeText("");
    setComposeOpen(true);
  }

  function handleDraftPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!draftPoint) {
      return;
    }
    const target = event.target as HTMLElement;
    if (target.closest("[data-sky-ignore='true']")) {
      return;
    }
    dragPointerIdRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    updateDraftPointFromClient(event.clientX, event.clientY);
  }

  function handleDraftPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!draftPoint || dragPointerIdRef.current !== event.pointerId) {
      return;
    }
    updateDraftPointFromClient(event.clientX, event.clientY);
  }

  function handleDraftPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (dragPointerIdRef.current !== event.pointerId) {
      return;
    }
    dragPointerIdRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleCreateDraft() {
    const trimmed = composeText.trim();
    if (!trimmed) {
      return;
    }

    setComposeOpen(false);
    setComposeText("");
    setDraftText(trimmed);
    openComposerAt(0.5, 0.28);
  }

  function handleAddStar() {
    if (!draftPoint) {
      return;
    }

    const added = addConstellationStar({
      size: draftSize,
      text: draftText,
      x: draftPoint.x,
      y: draftPoint.y,
    });

    if (!added) {
      return;
    }

    setStars(readConstellationStars());
    setSelectedStar(added);
    closeDraft();
  }

  function handleSkyPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (draftPoint) {
      return;
    }
    const target = event.target as HTMLElement;
    if (target.closest("[data-sky-ignore='true']")) {
      return;
    }
    setSelectedStar(null);
  }

  return (
    <main className="relative h-dvh w-screen overflow-hidden bg-[#03081f] text-white">
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0",
          "bg-[radial-gradient(circle_at_top,_rgba(67,117,255,0.32),_transparent_34%),radial-gradient(circle_at_20%_18%,_rgba(143,197,255,0.14),_transparent_18%),radial-gradient(circle_at_80%_30%,_rgba(112,150,255,0.18),_transparent_24%),linear-gradient(180deg,_#06133c_0%,_#020617_100%)]",
        )}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(circle at center, rgba(255,255,255,0.18) 1px, transparent 1.5px)",
          backgroundPosition: "center center",
          backgroundSize: "30px 30px",
          maskImage:
            "linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,1) 20%, rgba(0,0,0,1) 100%)",
        }}
      />

      <header className="absolute inset-x-0 top-0 z-20 flex flex-col items-start gap-4 px-5 pt-[max(12px,env(safe-area-inset-top))]">
        <Link
          className={cn(
            "inline-flex min-h-11 items-center gap-2 rounded-full border border-white/12 px-4",
            "bg-white/6 text-sm font-medium text-white/88 backdrop-blur-md transition-colors active:bg-white/12",
          )}
          href="/settings"
        >
          <BackArrowIcon className="h-4 w-4" />
          Retour
        </Link>

        <div className="space-y-2">
          <h1 className="text-[2rem] font-semibold leading-none tracking-tight text-white sm:text-[2.3rem]">
            Constellation
          </h1>
        </div>
      </header>

      <div
        className="absolute inset-0 z-10 overflow-hidden"
        onPointerDown={handleSkyPointerDown}
        ref={skyRef}
      >
        {draftPoint ? (
          <div
            className="absolute inset-0 z-30 touch-none"
            onPointerDown={handleDraftPointerDown}
            onPointerMove={handleDraftPointerMove}
            onPointerUp={handleDraftPointerUp}
            onPointerCancel={handleDraftPointerUp}
            style={{ touchAction: "none" }}
          />
        ) : null}

        {stars.map((star, index) => {
          const size = star.size ?? starSize(index);
          const isActive = selectedStar?.id === star.id;
          return (
            <motion.button
              animate={
                reduceMotion
                  ? { opacity: 1, scale: 1 }
                  : {
                      opacity: draftPoint ? 0.4 : [0.75, 1, 0.82],
                      scale: [1, 1.08, 1],
                    }
              }
              className="absolute z-20 rounded-full"
              data-sky-ignore="true"
              key={star.id}
              onClick={(event) => {
                event.stopPropagation();
                setSelectedStar((current) =>
                  current?.id === star.id ? null : star,
                );
              }}
              style={{
                left: `${star.x * 100}%`,
                top: `${star.y * 100}%`,
                width: `${size}px`,
                height: `${size}px`,
                transform: "translate(-50%, -50%)",
              }}
              transition={{
                duration: 3.4 + (index % 4) * 0.35,
                ease: "easeInOut",
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "mirror",
              }}
              type="button"
            >
              <span className="sr-only">{star.text}</span>
              <StarGlyph active={isActive} />
            </motion.button>
          );
        })}

        {draftPoint ? (
          <div
            className="absolute right-4 top-1/2 z-40 -translate-y-1/2"
            data-sky-ignore="true"
          >
            <label className="sr-only" htmlFor="draft-star-size">
              Taille de l&apos;étoile
            </label>
            <div className="flex h-36 items-center justify-center">
              <input
                className="h-3 w-28 -rotate-90 accent-white drop-shadow-[0_0_12px_rgba(255,255,255,0.2)]"
                data-sky-ignore="true"
                id="draft-star-size"
                max={MAX_CONSTELLATION_STAR_SIZE}
                min={MIN_CONSTELLATION_STAR_SIZE}
                onChange={(event) => setDraftSize(Number(event.target.value))}
                type="range"
                value={draftSize}
              />
            </div>
          </div>
        ) : null}

        {draftPoint ? (
          <button
            aria-label="Déplacer l’étoile en cours"
            className="pointer-events-none absolute z-40 rounded-full"
            style={{
              left: `${draftPoint.x * 100}%`,
              top: `${draftPoint.y * 100}%`,
              width: `${draftSize}px`,
              height: `${draftSize}px`,
              transform: "translate(-50%, -50%)",
            }}
            type="button"
          >
            <span className="sr-only">Étoile en cours de placement</span>
            <StarGlyph active draft />
            <span
              aria-hidden
              className="absolute inset-[-12px] rounded-full border border-dashed border-[#8fb7ff]/55"
            />
          </button>
        ) : null}

        <AnimatePresence>
          {selectedStar && !draftPoint ? (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "absolute inset-x-4 bottom-24 z-30 rounded-[28px] border border-white/12 px-5 py-4",
                "bg-[#09173f]/86 text-white shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl",
              )}
              data-sky-ignore="true"
              exit={{ opacity: 0, y: 16 }}
              initial={{ opacity: 0, y: 16 }}
              onClick={(event) => event.stopPropagation()}
              transition={{ duration: 0.18 }}
            >
              <div className="flex items-start justify-between gap-4">
                <p className="min-w-0 flex-1 text-[15px] leading-6 text-white/92">
                  {selectedStar.text}
                </p>
                <button
                  className="shrink-0 text-sm font-semibold text-[#8fb7ff] transition-opacity active:opacity-70"
                  onClick={(event) => {
                    event.stopPropagation();
                    deleteConstellationStar(selectedStar.id);
                    setStars(readConstellationStars());
                    setSelectedStar(null);
                  }}
                  type="button"
                >
                  Supprimer
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-20 px-5 pb-[max(12px,env(safe-area-inset-bottom))]">
        {draftPoint ? (
          <div className="flex justify-center">
            <button
              className={cn(
                "min-h-12 rounded-full px-8 text-sm font-semibold text-[#04102f]",
                "bg-[linear-gradient(135deg,_#ffffff_0%,_#cddcff_100%)] shadow-[0_16px_40px_rgba(0,0,0,0.28)] transition-transform active:scale-[0.99]",
              )}
              onClick={handleAddStar}
              type="button"
            >
              Valider
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              className={cn(
                "min-h-12 rounded-full px-6 text-sm font-semibold text-[#04102f]",
                "bg-[linear-gradient(135deg,_#ffffff_0%,_#cddcff_100%)] shadow-[0_16px_40px_rgba(0,0,0,0.28)] transition-transform active:scale-[0.99]",
              )}
              data-sky-ignore="true"
              onClick={startNewDraft}
              type="button"
            >
              + add new star
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {composeOpen ? (
          <motion.div
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-[#020617]/38 px-5 backdrop-blur-[2px]"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={closeComposer}
            role="presentation"
            style={{
              paddingTop: `${composeInsets.top}px`,
              paddingBottom: `${composeInsets.bottom}px`,
            }}
            transition={{ duration: 0.18 }}
          >
            <motion.div
              animate={{ opacity: 1, scale: 1, y: 0 }}
              aria-labelledby="constellation-create-title"
              className={cn(
                "w-full overflow-y-auto rounded-[30px] border border-white/12 px-5 py-5 shadow-[0_24px_80px_rgba(0,0,0,0.38)]",
                "bg-[#081331]/95 text-white backdrop-blur-xl",
              )}
              data-sky-ignore="true"
              exit={{ opacity: 0, scale: 0.98, y: 14 }}
              initial={{ opacity: 0, scale: 0.98, y: 14 }}
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              style={{
                maxHeight: `calc(100dvh - ${composeInsets.top + composeInsets.bottom}px)`,
              }}
              transition={{ type: "spring", stiffness: 360, damping: 32 }}
            >
              <p
                className="text-[1.1rem] font-semibold tracking-tight text-white"
                id="constellation-create-title"
              >
                Créer une étoile
              </p>
              <label className="sr-only" htmlFor="constellation-create-text">
                Mini texte de l&apos;étoile
              </label>
              <textarea
                className={cn(
                  "mt-4 min-h-28 w-full resize-none rounded-[24px] border border-white/10 bg-white/6 px-4 py-3.5",
                  "text-[15px] leading-6 text-white outline-none placeholder:text-white/34 focus:border-white/18 focus:bg-white/8",
                )}
                id="constellation-create-text"
                maxLength={20}
                onChange={(event) => setComposeText(event.target.value)}
                placeholder="Un mot doux, un souvenir, une promesse..."
                value={composeText}
              />
              <div className="mt-5 flex gap-3">
                <button
                  className={cn(
                    "min-h-12 flex-1 rounded-full border border-white/12 bg-white/6 px-5",
                    "text-sm font-semibold text-white/80 transition-colors active:bg-white/12",
                  )}
                  onClick={closeComposer}
                  type="button"
                >
                  Annuler
                </button>
                <button
                  className={cn(
                    "min-h-12 flex-1 rounded-full px-5 text-sm font-semibold text-[#04102f]",
                    "bg-[linear-gradient(135deg,_#ffffff_0%,_#cddcff_100%)] transition-transform active:scale-[0.99] disabled:opacity-35",
                  )}
                  disabled={!composeText.trim()}
                  onClick={handleCreateDraft}
                  type="button"
                >
                  Continuer
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
