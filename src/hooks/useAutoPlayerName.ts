// hooks/useAutoPlayerName.ts
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function useAutoPlayerName(user: any, userLoading: boolean) {
  const supabase = createSupabaseBrowserClient();
  const [playerName, setPlayerName] = useState("");
  const [nameLoading, setNameLoading] = useState(false);

  useEffect(() => {
    if (userLoading) return;

    if (!user) {
      setPlayerName("");
      return;
    }

    const run = async () => {
      setNameLoading(true);

      const { data } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .maybeSingle();

      const name =
        data?.username?.trim() ||
        user.email?.split("@")[0]?.slice(0, 10) ||
        "プレイヤー";

      setPlayerName(name.slice(0, 10));
      setNameLoading(false);
    };

    run();
  }, [user, userLoading, supabase]);

  return {
    playerName,
    setPlayerName,
    nameLoading,
    isLoggedIn: !!user,
  };
}