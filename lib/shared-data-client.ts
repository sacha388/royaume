import { createClient } from "@/lib/supabase/client";

let browserClient: ReturnType<typeof createClient> | null = null;

export function getSharedDataClient(): ReturnType<typeof createClient> {
  if (!browserClient) {
    browserClient = createClient();
  }

  return browserClient;
}
