"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import type { User, Session, AuthChangeEvent } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function useSupabaseUser() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const syncingRef = useRef(false);

  const syncHard = async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;

    try {
      // 1) まず session を読む（速い）
      const { data: s1 } = await supabase.auth.getSession();
      const session = s1.session ?? null;

      // 2) session が無い or 期限が近い/切れてるなら refresh を試す
      const expiresAt = session?.expires_at ? session.expires_at * 1000 : null;
      const needRefresh =
        !session ||
        (expiresAt !== null && expiresAt - Date.now() < 5 * 60_000) || // 5分以内
        (expiresAt !== null && expiresAt <= Date.now()); // 期限切れ

      if (needRefresh) {
        try {
          await supabase.auth.refreshSession();
        } catch {}
      }

      // 3) 最後に getUser() で真正性を確定（重要）
      const { data: u } = await supabase.auth.getUser();
      setUser(u.user ?? null);
    } finally {
      setLoading(false);
      syncingRef.current = false;
    }
  };

  useEffect(() => {
    let alive = true;

    const run = async () => {
      await syncHard();
      if (!alive) return;
    };

    run();

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, _session: Session | null) => {
        if (!alive) return;
        await syncHard();
      }
    );

    const onFocus = () => syncHard();
    const onVisibility = () => {
      if (document.visibilityState === "visible") syncHard();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [supabase]);

  return { user, loading, supabase, syncHard };
}
