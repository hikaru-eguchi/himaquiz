"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import QuizMDXWrapper from "@/app/components/QuizMDXWrapper";

export default function TodayChallengeQuizCard({ quiz }: { quiz?: any }) {
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
  if (loggedIn) return null;
  if (!quiz) return null;

  return (
    <div className="max-w-[700px] mx-auto border-2 border-black rounded-xl m-5 mt-2 p-5 bg-gradient-to-b from-red-0 via-red-100 to-red-200">
      <h2 className="
        text-2xl md:text-4xl 
        font-extrabold 
        mb-3 
        text-center 
        bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 
        text-transparent 
        bg-clip-text 
        drop-shadow-2xl
        animate-bounce
        animate-pulse
      ">
        🔥今日のチャレンジクイズ！
      </h2>

      <p className="text-lg md:text-xl text-center leading-tight mb-4 underline">
        まずはこの問題！あなたは解けるかな？
      </p>

      <QuizMDXWrapper quiz={quiz} />
    </div>
  );
}