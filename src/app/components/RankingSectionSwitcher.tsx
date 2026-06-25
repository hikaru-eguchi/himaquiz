"use client";

import { useEffect, useMemo, useState, ReactNode } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function RankingSectionSwitcher({
  loggedInSection,
  guestSection,
}: {
  loggedInSection: ReactNode;
  guestSection: ReactNode;
}) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getUser();
      setLoggedIn(!!data.user);
      setLoading(false);
    };

    run();
  }, [supabase]);

  if (loading) return null;

  return loggedIn ? <>{loggedInSection}</> : <>{guestSection}</>;
}