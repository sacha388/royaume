"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { getSupabaseConfig } from "@/lib/env";
import { getSharedDataClient } from "@/lib/shared-data-client";
import { cn } from "@/lib/utils";

type SyncStatus = "checking" | "ok" | "error";

function projectRefFromUrl(url: string): string {
  try {
    return new URL(url).hostname.split(".")[0] ?? "inconnu";
  } catch {
    return "inconnu";
  }
}

export function SyncStatusCard() {
  const [status, setStatus] = useState<SyncStatus>("checking");
  const [projectRef, setProjectRef] = useState("...");

  useEffect(() => {
    let cancelled = false;

    async function checkSync() {
      try {
        const { url } = getSupabaseConfig();
        const supabase = getSharedDataClient();
        const { error } = await supabase
          .from("couple_messages")
          .select("id", { count: "exact", head: true });

        if (cancelled) {
          return;
        }

        setProjectRef(projectRefFromUrl(url));
        setStatus(error ? "error" : "ok");
      } catch {
        if (!cancelled) {
          setProjectRef("absent");
          setStatus("error");
        }
      }
    }

    void checkSync();

    return () => {
      cancelled = true;
    };
  }, []);

  const label =
    status === "checking"
      ? "Vérification..."
      : status === "ok"
        ? "Supabase connecté"
        : "Supabase non connecté";

  return (
    <Card className="rounded-[18px] px-5 py-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-zinc-950">Synchro</p>
          <p className="mt-1 text-xs text-zinc-500">Projet: {projectRef}</p>
        </div>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold",
            status === "ok"
              ? "bg-emerald-50 text-emerald-700"
              : status === "checking"
                ? "bg-zinc-100 text-zinc-500"
                : "bg-red-50 text-red-700",
          )}
        >
          {label}
        </span>
      </div>
    </Card>
  );
}
