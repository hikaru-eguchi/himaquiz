"use client";

export default function EnemyDefeatEffect() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/70 animate-fade-in" />

      {/* テキスト */}
      <p className="mt-6 text-6xl font-extrabold text-yellow-300 drop-shadow-lg animate-pop">
        撃破！！
      </p>
    </div>
  );
}
