import { createClient, SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_URL = "https://lpmqbuspnynvcrysadrf.supabase.co";
const DEFAULT_KEY = "sb_publishable_W1kZ8t0IuNRvSi4GqjsqUQ_OU81fsak";

function initSupabase(): SupabaseClient {
  try {
    const rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "")
      .replace(/["']/g, "")
      .trim();
    const url =
      rawUrl.startsWith("https://") && rawUrl.includes(".supabase.co")
        ? rawUrl
        : DEFAULT_URL;

    const rawKey = (
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      ""
    )
      .replace(/["']/g, "")
      .trim();
    const key = rawKey.length > 20 ? rawKey : DEFAULT_KEY;

    return createClient(url, key, {
      auth: {
        persistSession: false,
      },
    });
  } catch {
    return createClient(DEFAULT_URL, DEFAULT_KEY, {
      auth: {
        persistSession: false,
      },
    });
  }
}

export const supabase = initSupabase();
