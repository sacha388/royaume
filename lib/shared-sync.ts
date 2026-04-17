export const SHARED_SYNC_POLL_MS = 4_000;

export function startSharedSyncPolling(
  sync: () => Promise<unknown>,
): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  let stopped = false;

  const run = () => {
    if (stopped) {
      return;
    }
    void sync().catch((error: unknown) => {
      console.error("[royaume:supabase-sync]", error);
    });
  };

  const onFocus = () => run();
  const onVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      run();
    }
  };

  const intervalId = window.setInterval(run, SHARED_SYNC_POLL_MS);
  window.addEventListener("focus", onFocus);
  document.addEventListener("visibilitychange", onVisibilityChange);

  return () => {
    stopped = true;
    window.clearInterval(intervalId);
    window.removeEventListener("focus", onFocus);
    document.removeEventListener("visibilitychange", onVisibilityChange);
  };
}
