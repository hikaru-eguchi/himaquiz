"use client";

import { useEffect, useState } from "react";

export default function ConnectionNotice() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const handleOffline = () => setOffline(true);
    const handleOnline = () => setOffline(false);

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    setOffline(!navigator.onLine);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return (
    <div className="mx-auto mt-1 md:mt-3 max-w-5xl px-3">
      <div className="rounded-2xl border-2 border-orange-300 bg-orange-50 px-3 py-3 text-center text-xs md:text-sm font-bold text-orange-900 shadow-sm">
        <p>
          通信プレイ中は、この画面を開いたまま遊んでください。
        </p>
        <p>
          画面を閉じたり、別アプリに移動すると通信が切れる場合があります。
        </p>
        <p>
          うまく動かないときは、ページを再読み込みして入り直してください。
        </p>
      </div>

      {offline && (
        <div className="mt-3 rounded-2xl border-4 border-red-500 bg-red-100 px-4 py-4 text-center text-base md:text-xl font-black text-red-700 shadow-lg">
          通信が切れました。再読み込みしてください。
        </div>
      )}
    </div>
  );
}