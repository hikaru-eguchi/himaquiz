// src/lib/supabase/public-server.ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export function createSupabasePublicServerClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false }, // セッション保持しない
    }
  );
}
