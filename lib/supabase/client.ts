"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "@/lib/env";
import type { Database } from "@/types/supabase";

export function createClient() {
  const { anonKey, url } = getSupabaseConfig();

  return createBrowserClient<Database>(url, anonKey);
}
