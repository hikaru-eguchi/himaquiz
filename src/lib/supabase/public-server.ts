// src/lib/supabase/public-server.ts
import { createClient } from "@supabase/supabase-js";

export function createSupabasePublicServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false }, // セッション保持しない
    }
  );
}
