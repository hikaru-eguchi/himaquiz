"use client";

import { useEffect, useState } from "react";

export default function OnlineGameNotice() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const onOffline = () => setOffline(true);
    const onOnline = () => setOffline(false);

    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);

    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  return (
    <>
      <div className="mb-4 rounded-2xl border-2 border-amber-300 bg-amber-50 px-1 md:px-3 py-1 md:py-3 text-center text-sm md:text-base font-bold text-amber-900">
        <p>通信プレイ中は、この画面を開いたまま遊んでください。</p>
        <p>画面を閉じたり、別アプリに移動すると通信が切れる場合があります。</p>
        <p>うまく動かないときは、ページを再読み込みして入り直してください。</p>
      </div>

      {offline && (
        <div className="mb-4 rounded-2xl border-4 border-red-500 bg-red-100 px-4 py-4 text-center text-xl font-black text-red-700 animate-pulse">
          通信が切れました。再読み込みしてください。
        </div>
      )}
    </>
  );
}