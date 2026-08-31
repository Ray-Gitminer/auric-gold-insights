import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

let browserClient: SupabaseClient<Database> | null | undefined;

export function getSupabaseBrowserClient(): SupabaseClient<Database> | null {
  if (browserClient !== undefined) return browserClient;
  if (typeof window === "undefined") return null;

  const url = import.meta.env["VITE_SUPABASE_URL"]?.trim();
  const publishableKey = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"]?.trim();

  if (!url || !publishableKey || publishableKey === "sb_publishable_replace_me") {
    browserClient = null;
    return browserClient;
  }

  browserClient = createClient<Database>(url, publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return browserClient;
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseBrowserClient() !== null;
}
