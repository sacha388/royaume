"use client";

import Lottie from "lottie-react";
import { useEffect, useState } from "react";
import type { Json } from "@/types/supabase";

type IncomingHeartOverlayProps = {
  isVisible: boolean;
};

const animationPath = "/animations/incoming-heart.json";

export function IncomingHeartOverlay({ isVisible }: IncomingHeartOverlayProps) {
  const [animationData, setAnimationData] = useState<Json | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadAnimation() {
      try {
        const response = await fetch(animationPath);

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as Json;

        if (isMounted) {
          setAnimationData(data);
        }
      } catch {
        if (isMounted) {
          setAnimationData(null);
        }
      }
    }

    loadAnimation();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-white/65 px-8 backdrop-blur-sm">
      <div className="flex aspect-square w-full max-w-[300px] items-center justify-center">
        {animationData ? (
          <Lottie animationData={animationData} loop={false} />
        ) : (
          <div className="flex h-36 w-36 items-center justify-center rounded-full bg-white text-7xl shadow-[0_16px_60px_rgba(196,79,93,0.22)]">
            ♥
          </div>
        )}
      </div>
    </div>
  );
}
