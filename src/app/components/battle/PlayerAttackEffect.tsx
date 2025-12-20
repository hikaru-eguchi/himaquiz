"use client";

import React from "react";

type Character = {
  id: string;
  name: string;
  image: string;
};

export default function PlayerAttackEffect({
  character,
}: {
  character: Character | null;
}) {
  if (!character) return null;

  const isWarrior = character.id === "warrior";
  const isFighter = character.id === "fighter";
  const isWizard = character.id === "wizard";

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden pointer-events-none">

      {/* ===== 背景 ===== */}
      {isWarrior && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-800 via-blue-500 to-cyan-400 animate-bg-fade" />
      )}
      {isFighter && (
        <div className="absolute inset-0 bg-gradient-to-r from-red-700 via-orange-600 to-yellow-400 animate-bg-fade" />
      )}
      {isWizard && (
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900 via-indigo-700 to-pink-500 animate-bg-fade" />
      )}

      {/* ===== 技エフェクト ===== */}
      {isWarrior && (
        <>
          <div className="absolute slash-line rotate-45 animate-slash-1" />
          <div className="absolute slash-line rotate-135 animate-slash-2" />
          <div className="absolute slash-line rotate-90 animate-slash-3" />
          <div className="absolute slash-line rotate-0 animate-slash-4" />
        </>
      )}

      {isFighter && (
        <>
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className={`absolute w-40 h-40 bg-orange-100 rounded-full opacity-0 animate-fist-${n}`}
            />
          ))}
        </>
      )}

      {isWizard && (
        <div className="absolute w-56 h-56 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="absolute w-full h-full border-4 border-purple-400 rounded-full animate-rotate-clockwise" />
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <div
              key={deg}
              className="absolute w-30 h-30 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-t-2 border-r-2 border-purple-300 animate-rotate-counterclockwise"
              style={{ transform: `translate(-50%, -50%) rotate(${deg}deg)` }}
            />
          ))}
          <div className="absolute w-56 h-56 border-2 border-purple-200 rounded-full opacity-50 animate-expand-circle" />
        </div>
      )}

      {/* ===== キャラ画像 ===== */}
      <img
        src={character.image}
        alt={character.name}
        className="w-40 h-40 md:w-60 md:h-60 animate-slide-in"
      />

      {/* ===== テキスト ===== */}
      <p
        className={`mt-4 text-5xl md:text-7xl font-extrabold drop-shadow-2xl animate-swing
          ${isWarrior && "text-blue-100"}
          ${isFighter && "text-orange-100"}
          ${isWizard && "text-purple-100"}
        `}
      >
        {character.name}の攻撃！
      </p>
    </div>
  );
}
