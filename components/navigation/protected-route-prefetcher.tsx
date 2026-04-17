"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import type { ProtectedRoute } from "@/types/navigation";

const WARM_PROTECTED_ROUTES: ProtectedRoute[] = [
  "/home",
  "/settings",
  "/memories",
  "/us",
  "/constellation",
];

export function ProtectedRoutePrefetcher() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const routesToWarm = WARM_PROTECTED_ROUTES.filter((route) => route !== pathname);
    const routeTimers: number[] = [];
    let cancelled = false;

    const warmRoutes = () => {
      routesToWarm.forEach((route, index) => {
        const timer = window.setTimeout(() => {
          if (!cancelled) {
            router.prefetch(route);
          }
        }, index * 140);

        routeTimers.push(timer);
      });
    };

    const idleId =
      "requestIdleCallback" in window
        ? window.requestIdleCallback(warmRoutes, { timeout: 1800 })
        : null;
    const fallbackTimer =
      idleId === null ? window.setTimeout(warmRoutes, 500) : null;

    return () => {
      cancelled = true;
      if (idleId !== null) {
        window.cancelIdleCallback(idleId);
      }
      if (fallbackTimer !== null) {
        window.clearTimeout(fallbackTimer);
      }
      routeTimers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [pathname, router]);

  return null;
}
