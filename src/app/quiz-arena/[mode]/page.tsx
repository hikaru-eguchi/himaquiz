"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import QuizQuestion from "../../components/QuizQuestion";
import { QuizData } from "@/lib/articles";
import { motion, AnimatePresence } from "framer-motion";
import { useBattle } from "../../../hooks/useBattle";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "../../../hooks/useSupabaseUser";
import { openXShare, buildTopUrl } from "@/lib/shareX";
import RecommendedMultiplayerGames from "@/app/components/RecommendedMultiplayerGames";
import OnlineGameNotice from "@/app/components/OnlineGameNotice";
import Image from "next/image";
import ArenaRankingTop10 from "@/app/components/ArenaRankingTop10";

type AwardStatus = "idle" | "awarding" | "awarded" | "need_login" | "error";

type ArenaRankRow = {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  arena_wins: number;
};

interface ArticleData {
  id: string;
  title: string;
  genre: string;
  quiz?: {
    title: string;
    question: string;
    answer: string | number;
    displayAnswer?: string;
    choices?: (string | number)[];
    genre: string;
    level: string;
    answerExplanation?: string;
    trivia?: string;
    hint?: string;
  };
}

interface Player {
  socketId: string;
  name: string;
  score: number; // クイズアリーナでは「与えた総ダメージ」として使う
  characterId?: string | null;
  characterName?: string | null;
  characterImage?: string | null;
  characterRarity?: string | null;
}

type ArenaCharacter = {
  id: string;
  no?: number | null;
  name: string;
  image: string;
  rarity: string;
  attack: number;
  cost: number;
  specialCost: number;
};

type BattleMessage = {
  fromId: string;
  message: string;
  createdAt: number;
};

const DEFAULT_CHARACTER: ArenaCharacter = {
  id: "kimagure_white",
  name: "ひまもん【白】",
  image: "/images/きまぐれモンスター【白】.png",
  rarity: "ノーマル",
  attack: 80,
  cost: 1,
  specialCost: 4,
};

const MAX_HP = 1000;

const MESSAGE_BUTTONS = [
  "よろしく！",
  "ナイス！",
  "くらえ！",
  "やばい！",
  "もう少し！",
  "ありがとう！",
];

const getArenaStatsByRarity = (
  rarity: string | null
): Pick<ArenaCharacter, "attack" | "cost" | "specialCost"> => {
  switch (rarity) {
    case "シークレット":
      return { attack: 250, cost: 3, specialCost: 6 };
    case "神レア":
      return { attack: 240, cost: 3, specialCost: 6 };
    case "超激レア":
      return { attack: 180, cost: 2, specialCost: 5 };
    case "激レア":
      return { attack: 165, cost: 2, specialCost: 5 };
    case "超レア":
      return { attack: 150, cost: 2, specialCost: 4 };
    case "レア":
      return { attack: 95, cost: 1, specialCost: 4 };
    case "ノーマル":
    default:
      return { attack: 80, cost: 1, specialCost: 4 };
  }
};

const getHpPercent = (current: number, max: number) => {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(100, (current / max) * 100));
};

const getHpBarColor = (current: number, max: number) => {
  const percent = getHpPercent(current, max);
  if (percent >= 60) return "bg-green-500";
  if (percent >= 30) return "bg-yellow-400";
  return "bg-red-500";
};

const getComboMultiplier = (combo: number) => {
  if (combo >= 5) return 1.5;
  if (combo >= 4) return 1.35;
  if (combo >= 3) return 1.2;
  if (combo >= 2) return 1.1;
  return 1;
};

const calcEarnedPoints = ({
  isWin,
  damage,
  correctCount,
}: {
  isWin: boolean;
  damage: number;
  correctCount: number;
}) => {
  // 仮仕様：サーバー側レート導入前のクライアント表示用
  // return Math.max(0, Math.floor(damage / 10) + correctCount * 10 + (isWin ? 200 : 0));
  return (
    (isWin ? 300 : 100) +
    Math.floor(damage / 20) +
    correctCount * 5
  );
};

const calcEarnedExp = (correctCount: number) => {
  return correctCount * 20;
};

const HpGauge = ({
  label,
  current,
  max,
}: {
  label: string;
  current: number;
  max: number;
}) => {
  const percent = getHpPercent(current, max);
  const color = getHpBarColor(current, max);

  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-xs font-black text-stone-900 md:text-sm">
        <span>{label}</span>
        <span>
          {current} / {max}
        </span>
      </div>

      <div className="h-5 w-full overflow-hidden rounded-full border-2 border-black bg-stone-300 shadow-inner md:h-6">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

const Gauge = ({
  label,
  current,
  max,
  colorClass,
}: {
  label: string;
  current: number;
  max: number;
  colorClass: string;
}) => {
  const percent = getHpPercent(current, max);

  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-xs font-black text-stone-900">
        <span>{label}</span>
        <span>
          {current} / {max}
        </span>
      </div>

      <div className="h-3 overflow-hidden rounded-full border border-black bg-stone-300 md:h-4">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

const AttackEffect = ({
  character,
  type,
}: {
  character: ArenaCharacter;
  type: "attack" | "special" | "critical";
}) => {
  const bg =
    type === "special"
      ? "bg-gradient-to-r from-violet-950 via-fuchsia-800 to-yellow-400"
      : type === "critical"
      ? "bg-gradient-to-r from-red-700 via-orange-500 to-yellow-300"
      : "bg-gradient-to-r from-stone-900 via-red-800 to-orange-400";

  const label =
    type === "special"
      ? `${character.name}の必殺技！`
      : type === "critical"
      ? "会心の一撃！！"
      : `${character.name}の攻撃！`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden">
      <div className={`absolute inset-0 ${bg} animate-bg-fade`} />

      {/* {type === "special" && (
        <>
          <div className="absolute h-72 w-72 rounded-full bg-yellow-300 opacity-40 animate-enemy-ultimate" />
          <div className="absolute h-[8px] w-[150%] rotate-45 bg-white animate-slash-1" />
          <div className="absolute h-[8px] w-[150%] rotate-135 bg-white animate-slash-2" />
        </>
      )} */}
      {type === "special" && (
        <>
          <div className="absolute inset-x-0 top-[12%] z-30 flex justify-center text-center border-y-4 border-yellow-300 bg-black/80 py-5 shadow-[0_0_35px_rgba(250,204,21,0.9)]">
            <p className="mt-1 mx-auto w-full px-4 text-center text-xl font-black text-white md:text-4xl">
              {character.name}の必殺技！
            </p>
          </div>

          <div className="absolute h-72 w-72 rounded-full bg-yellow-300 opacity-40 animate-enemy-ultimate" />
          <div className="absolute h-[8px] w-[150%] rotate-45 bg-white animate-slash-1" />
          <div className="absolute h-[8px] w-[150%] rotate-135 bg-white animate-slash-2" />
        </>
      )}

      {/* {type === "critical" && (
        <>
          <div className="absolute h-64 w-64 rounded-full bg-red-400 opacity-50 animate-fire-front" />
          <div className="absolute h-96 w-96 rounded-full bg-yellow-300 opacity-40 animate-fire-back" />
        </>
      )} */}
      {type === "critical" && (
        <>
          <div className="absolute h-64 w-64 rounded-full bg-red-400 opacity-50 animate-fire-front" />
          <div className="absolute h-96 w-96 rounded-full bg-yellow-300 opacity-40 animate-fire-back" />

          <div className="absolute top-[18%] z-30 rotate-[-8deg] rounded-3xl border-4 border-yellow-300 bg-red-600 px-8 py-3 text-5xl font-black text-white shadow-[0_0_35px_rgba(250,204,21,0.95)] md:text-8xl animate-bounce">
            CRITICAL!!
          </div>
        </>
      )}

      {type === "attack" && (
        <>
          <div className="absolute h-[5px] w-[130%] rotate-45 bg-white animate-slashb-1" />
          <div className="absolute h-[5px] w-[130%] rotate-135 bg-white animate-slashb-2" />
        </>
      )}

      {/* <img
        src={character.image}
        alt={character.name}
        className="relative z-20 h-40 w-40 object-contain drop-shadow-2xl md:h-64 md:w-64 animate-enemy-slide-in"
      /> */}
      <Image
        src={character.image}
        alt={character.name}
        width={256}
        height={256}
        className="relative z-20 h-40 w-40 object-contain drop-shadow-2xl md:h-64 md:w-64 animate-enemy-slide-in"
        priority
      />

      <p className="relative z-20 mt-4 px-4 text-center text-4xl font-extrabold text-white drop-shadow-2xl md:text-7xl animate-enemy-swing">
        {label}
      </p>
    </div>
  );
};

const CharacterHitEffect = ({
  type,
}: {
  type: "attack" | "critical";
}) => {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center overflow-hidden rounded-full">
      {type === "attack" && (
        <>
          <div className="absolute h-[5px] w-[150%] rotate-45 bg-white shadow-[0_0_18px_rgba(255,255,255,0.95)] animate-slashb-1" />
          <div className="absolute h-[5px] w-[150%] rotate-135 bg-yellow-300 shadow-[0_0_18px_rgba(250,204,21,0.95)] animate-slashb-2" />
        </>
      )}

      {type === "critical" && (
        <>
          <div className="absolute h-24 w-24 rounded-full bg-red-500/60 animate-fire-front" />
          <div className="absolute h-32 w-32 rounded-full bg-yellow-300/60 animate-fire-back" />
          <p className="relative z-30 rotate-[-10deg] rounded-2xl border-2 border-yellow-300 bg-red-600 px-3 py-1 text-lg font-black text-white shadow-[0_0_20px_rgba(250,204,21,0.95)] md:text-2xl">
            クリティカル！
          </p>
        </>
      )}
    </div>
  );
};

const CharacterSelect = ({
  loading,
  characters,
  selected,
  onSelect,
  onStart,
  isLoggedIn,
  playerDisplayName,
  setPlayerDisplayName,
}: {
  loading: boolean;
  characters: ArenaCharacter[];
  selected: ArenaCharacter | null;
  onSelect: (character: ArenaCharacter) => void;
  onStart: () => void;
  isLoggedIn: boolean;
  playerDisplayName: string;
  setPlayerDisplayName: (name: string) => void;
}) => {
  const canStart =
    playerDisplayName.trim().length > 0 &&
    (!isLoggedIn || selected);

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#fde68a_0%,#fb7185_28%,#7c3aed_62%,#111827_100%)] px-4 py-6 text-center">
      <div className="mx-auto flex max-w-5xl flex-col">
        <p className="mx-auto mb-3 inline-flex rounded-full border-2 border-white/60 bg-white/20 px-4 py-1 text-sm font-black text-white shadow-lg backdrop-blur">
          ⚔️ ARENA ENTRY
        </p>

        <h1 className="text-4xl font-black text-white drop-shadow-[0_3px_0_rgba(0,0,0,0.9)] md:text-6xl">
          キャラを選んでアリーナへ！
        </h1>

        <p className="mt-3 font-bold text-white/90 drop-shadow md:text-xl">
          レア度によって、攻撃力・攻撃コスト・必殺ゲージが変わります。
        </p>

        {!isLoggedIn ? (
          <div className="mx-auto mt-6 max-w-xl rounded-[2rem] border-3 border-stone-900 bg-white/90 p-5 shadow-[0_6px_0_rgba(28,25,23,1)]">
            <p className="text-lg font-black text-stone-900">
              未ログインのため、固定キャラで参加します
            </p>

            <div className="mt-4 grid place-items-center rounded-3xl bg-gradient-to-b from-stone-100 to-amber-100 p-5">
              <img
                src="/images/きまぐれモンスター【白】.png"
                alt="ひまもん【白】"
                className="h-40 object-contain drop-shadow-xl md:h-52"
              />
            </div>

            <p className="mt-4 text-2xl font-black text-stone-900">
              ひまもん【白】
            </p>

            <p className="mt-1 text-sm font-black text-violet-700">
              ノーマル / 攻撃80 / コスト1 / 必殺6
            </p>

            <p className="mt-3 text-sm font-bold text-stone-600">
              ログインすると、ガチャで手に入れたキャラを選べます。
            </p>
          </div>
        ) : loading ? (
          <div className="mx-auto mt-8 h-48 max-w-xl rounded-3xl bg-white/70" />
        ) : (
          <div className="mt-2 md:mt-6 rounded-[2rem] border-3 border-white/40 bg-white/15 p-3 shadow-[0_8px_0_rgba(17,24,39,1)] backdrop-blur">
            <div className="mb-2 flex items-center justify-between px-2">
              <p className="text-sm font-black text-white md:text-base">
                所持キャラ一覧
              </p>
              <p className="text-xs font-bold text-white/80 md:text-sm">
                {characters.length}体
              </p>
            </div>
            <div className="max-h-[50vh] md:max-h-[60vh] overflow-y-auto overscroll-contain px-1 md:px-2 py-1 md:py-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                {characters.map((chara) => {
                  const active = selected?.id === chara.id;

                  return (
                    <button
                      key={chara.id}
                      onClick={() => onSelect(chara)}
                      className={`
                        flex items-center gap-3 rounded-3xl border-3 p-3 text-left shadow-xl transition
                        md:block md:text-left
                        ${
                          active
                            ? "border-yellow-300 bg-gradient-to-br from-yellow-200 via-white to-pink-100 ring-4 ring-yellow-300/70 shadow-[0_0_28px_rgba(250,204,21,0.9)]"
                            : "border-white/40 bg-white/90 hover:scale-[1.02] md:hover:scale-105"
                        }
                      `}
                    >
                      <div className="grid h-24 w-24 shrink-0 place-items-center rounded-2xl bg-gradient-to-b from-stone-100 to-amber-100 p-2 md:h-auto md:w-full">
                        {/* <img
                          src={chara.image}
                          alt={chara.name}
                          className="h-20 w-full object-contain md:h-36"
                        /> */}
                        <Image
                          src={chara.image}
                          alt={chara.name}
                          width={160}
                          height={160}
                          className="h-20 w-full object-contain md:h-36"
                          loading="lazy"
                        />
                      </div>

                      <div className="min-w-0 flex-1 md:mt-2">
                        {/* <p className="truncate text-base font-black text-stone-900 md:text-center md:text-base"> */}
                        <p className="break-words text-base font-black leading-tight text-stone-900 md:text-center md:text-base">
                          {chara.name}
                        </p>

                        <p className="mt-1 text-xs font-black text-violet-700 md:text-center">
                          {chara.rarity}
                        </p>

                        <div className="mt-2 rounded-2xl bg-stone-900 p-2 text-xs font-black text-white md:text-sm">
                          <p className="text-red-300">
                            ⚔️ 攻撃力：{chara.attack}
                          </p>
                          <p className="text-purple-300">
                            ⚡ 攻撃コスト：{chara.cost}問
                          </p>
                          <p className="text-yellow-300">
                            🌟 必殺：{chara.specialCost}正解
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        <div className="mx-auto mt-5 w-full max-w-xl rounded-[2rem] border-3 border-white/40 bg-black/35 p-4 text-white shadow-[0_8px_0_rgba(17,24,39,1)] backdrop-blur">
          {isLoggedIn && (
            <>
              <p className="text-xs font-black text-white/70">選択中のキャラ</p>
              {/* <p className="truncate text-lg font-black text-white md:text-xl"> */}
              <p className="break-words text-lg font-black leading-tight text-white md:text-xl">
                {selected?.name ?? "未選択"}
              </p>

              {selected && (
                <p className="mt-1 text-sm font-black text-violet-200">
                  {selected.rarity} / 攻撃{selected.attack} / コスト{selected.cost} / 必殺{selected.specialCost}
                </p>
              )}
            </>
          )}

          <div className="mb-4 text-left">
            <p className="mb-1 text-sm font-black text-white/80">
              プレイヤー名
            </p>

            <input
              value={playerDisplayName}
              onChange={(e) => setPlayerDisplayName(e.target.value)}
              maxLength={12}
              placeholder="名前を入力"
              className="
                w-full rounded-2xl border-2 border-white/60
                bg-white px-4 py-3
                text-center text-lg font-black text-stone-900
                outline-none focus:border-yellow-300
              "
            />
          </div>
          {playerDisplayName.trim() === "" && (
            <p className="mt-2 text-sm font-black text-red-300">
              プレイヤー名を入力してください
            </p>
          )}

          <button
            onClick={onStart}
            disabled={!canStart}
            className={`
              mt-3 w-full rounded-full border-3 border-white/60 px-6 py-4 text-xl font-black
              shadow-[0_6px_0_rgba(17,24,39,1)]
              transition
              md:text-2xl
              ${
                canStart
                  ? "bg-gradient-to-r from-pink-500 via-fuchsia-500 to-yellow-300 text-white hover:scale-105"
                  : "bg-gray-400 text-gray-200 cursor-not-allowed"
              }
            `}
          >
            ⚔️ このキャラで参戦
          </button>
        </div>
      </div>
    </div>
  );
};

const MessageButtons = ({
  disabled,
  onSend,
}: {
  disabled?: boolean;
  onSend: (message: string) => void;
}) => {
  return (
    <div className="mx-auto mt-3 max-w-3xl rounded-3xl border-2 border-stone-900 bg-white/85 p-2 shadow">
      <p className="mb-2 text-xs font-black text-stone-700 md:text-sm">
        メッセージ
      </p>
      <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
        {MESSAGE_BUTTONS.map((msg) => (
          <button
            key={msg}
            disabled={disabled}
            onClick={() => onSend(msg)}
            className="rounded-full border-2 border-stone-800 bg-gradient-to-b from-white to-amber-100 px-2 py-2 text-xs font-black text-stone-900 shadow transition hover:scale-105 active:scale-95 disabled:opacity-40 md:text-sm"
          >
            {msg}
          </button>
        ))}
      </div>
    </div>
  );
};

const FloatingMessages = ({
  messages,
  mySocketId,
}: {
  messages: BattleMessage[];
  mySocketId: string;
}) => {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-24 z-40 flex flex-col items-center gap-2 px-3">
      <AnimatePresence>
        {messages.map((m) => {
          const isMe = m.fromId === mySocketId;

          return (
            <motion.div
              key={`${m.fromId}-${m.createdAt}-${m.message}`}
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.8 }}
              className={`rounded-full border-2 border-black px-5 py-2 text-lg font-black shadow-xl md:text-2xl ${
                isMe
                  ? "bg-emerald-400 text-white"
                  : "bg-pink-500 text-white"
              }`}
            >
              {isMe ? "あなた" : "相手"}：{m.message}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

const QuizResult = ({
  correctCount,
  myDamage,
  opponentDamage,
  myHp,
  opponentHp,
  isWin,
  isDraw,
  earnedPoints,
  earnedExp,
  isLoggedIn,
  awardStatus,
  onGoLogin,
  isCodeMatch,
  rematchRequested,
  rematchAvailable,
  matchEnded,
  onShareX,
  onNewMatch,
  onRematch,
  arenaTop10,
  rankLoading,
}: {
  correctCount: number;
  myDamage: number;
  opponentDamage: number;
  myHp: number;
  opponentHp: number;
  isWin: boolean;
  isDraw: boolean;
  earnedPoints: number;
  earnedExp: number;
  isLoggedIn: boolean;
  awardStatus: AwardStatus;
  onGoLogin: () => void;
  isCodeMatch: boolean;
  rematchRequested: boolean;
  rematchAvailable: boolean;
  matchEnded: boolean;
  onShareX: () => void;
  onNewMatch: () => void;
  onRematch: () => void;
  arenaTop10: ArenaRankRow[];
  rankLoading: boolean;
}) => {
  const [showScore, setShowScore] = useState(false);
  const [showText, setShowText] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    timers.push(setTimeout(() => setShowScore(true), 400));
    timers.push(setTimeout(() => setShowText(true), 900));
    timers.push(setTimeout(() => setShowButton(true), 1400));
    return () => timers.forEach(clearTimeout);
  }, []);

  const isLose = !isWin && !isDraw;

  return (
    <div
      className={`
        px-4 py-8 text-center
        ${
          isWin
            ? "bg-[radial-gradient(circle_at_top,#fef08a_0%,#fdba74_35%,#7c2d12_100%)]"
            : isLose
            ? "bg-[radial-gradient(circle_at_top,#64748b_0%,#1f2937_45%,#020617_100%)]"
            : "bg-[radial-gradient(circle_at_top,#e5e7eb_0%,#fef3c7_45%,#78716c_100%)]"
        }
      `}
    >
      <motion.div
        initial={{ scale: 0.86, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className={`
          relative mx-auto max-w-3xl overflow-hidden rounded-[2rem] border-3 p-1
          shadow-[0_10px_0_rgba(28,25,23,1)]
          ${isLose ? "border-gray-500 bg-gray-950" : "border-stone-950 bg-stone-950"}
        `}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#facc15_0%,transparent_35%)] opacity-40" />

        <div
          className={`
            relative rounded-[1.8rem] p-5 md:p-8
            ${
              isWin
                ? "bg-gradient-to-b from-yellow-200 via-white to-orange-50"
                : isLose
                ? "bg-gradient-to-b from-stone-950 via-stone-900 to-stone-800 text-white"
                : "bg-gradient-to-b from-white via-stone-100 to-amber-100"
            }
          `}
        >
          {showText && (
            <>
              <motion.p
                initial={{ scale: 0.5, opacity: 0, rotate: -8 }}
                animate={{ scale: [1.22, 1], opacity: 1, rotate: 0 }}
                transition={{ duration: 0.7 }}
                className={`
                  text-6xl font-black drop-shadow md:text-8xl
                  ${
                    isDraw
                      ? "text-stone-700"
                      : isWin
                      ? "text-yellow-500"
                      : "text-gray-200"
                  }
                `}
              >
                {isDraw ? "DRAW" : isWin ? "WIN!" : "LOSE"}
              </motion.p>

              <p className="mt-3 text-2xl font-black md:text-4xl">
                {isDraw
                  ? "引き分け！いい勝負！🤝"
                  : isWin
                  ? "あなたの勝ち！やったね！🎉"
                  : "あなたの負け…次は勝とう！💪"}
              </p>
            </>
          )}

          {showScore && (
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <div className="rounded-3xl border-2 border-emerald-700 bg-emerald-50 p-4 text-stone-900 shadow">
                <p className="text-sm font-black text-emerald-700">あなた</p>
                <p className="text-3xl font-black text-emerald-600 md:text-5xl">
                  HP {myHp}
                </p>
                <p className="mt-1 font-black">与えたダメージ：{myDamage}</p>
              </div>

              <div className="rounded-3xl border-2 border-red-700 bg-red-50 p-4 text-stone-900 shadow">
                <p className="text-sm font-black text-red-700">相手</p>
                <p className="text-3xl font-black text-red-600 md:text-5xl">
                  HP {opponentHp}
                </p>
                <p className="mt-1 font-black">受けたダメージ：{opponentDamage}</p>
              </div>
            </div>
          )}

          {showScore && (
            <div className="mx-auto mt-5 max-w-xl rounded-3xl border-2 border-stone-950 bg-white p-4 text-stone-900 shadow">
              <p className="text-2xl font-black">正解数：{correctCount}問</p>

              {isCodeMatch ? (
                <div className="mt-3 rounded-2xl border-2 border-yellow-300 bg-yellow-50 px-4 py-3">
                  <p className="font-black text-yellow-700">
                    🔑 あいことばマッチのため、ポイント・経験値・ランキングには反映されません。
                  </p>
                </div>
              ) : (
                <>

                  {/* <div className="mt-3 grid grid-cols-2 gap-2"> */}
                  <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                    {/* <div className="rounded-2xl bg-green-100 p-3">
                      <p className="text-xs font-black text-green-700">獲得ポイント</p>
                      <p className="text-2xl font-black text-green-600">
                        {earnedPoints}P
                      </p>
                    </div> */}
                    <div className="rounded-2xl bg-green-100 p-3">
                      <p className="text-sm font-black text-green-700">
                        💰 獲得ポイント
                      </p>

                      <div className="mt-3 space-y-1 text-left text-sm font-black">
                        <div className="flex justify-between">
                          <span>{isWin ? "🏆 勝利ボーナス" : "💪 健闘ボーナス"}</span>
                          <span>{isWin ? "+300P" : "+100P"}</span>
                        </div>

                        <div className="flex justify-between">
                          <span>⚔️ ダメージボーナス</span>
                          <span>+{Math.floor(myDamage / 20)}P</span>
                        </div>

                        <div className="flex justify-between">
                          <span>✅ 正解数ボーナス</span>
                          <span>+{correctCount * 5}P</span>
                        </div>
                      </div>

                      <div className="my-3 border-t-2 border-green-300" />

                      <div className="flex items-center justify-between">
                        <span className="text-lg font-black text-green-700">
                          合計
                        </span>

                        <span className="text-3xl font-black text-green-600">
                          {earnedPoints}P
                        </span>
                      </div>
                    </div>

                    {/* <div className="rounded-2xl bg-purple-100 p-3">
                      <p className="text-xs font-black text-purple-700">獲得経験値</p>
                      <p className="text-2xl font-black text-purple-600">
                        {earnedExp}EXP
                      </p>
                    </div> */}
                    <div className="rounded-2xl bg-purple-100 p-3">
                      <p className="text-sm font-black text-purple-700">
                        🌟 獲得経験値
                      </p>

                      <div className="mt-3 space-y-1 text-left text-sm font-black">
                        <div className="flex justify-between">
                          <span>📝 正解数ボーナス</span>
                          <span>+{correctCount * 20}EXP</span>
                        </div>
                      </div>

                      <div className="my-3 border-t-2 border-purple-300" />

                      <div className="flex items-center justify-between">
                        <span className="text-lg font-black text-purple-700">
                          合計
                        </span>

                        <span className="text-3xl font-black text-purple-600">
                          {earnedExp}EXP
                        </span>
                      </div>
                    </div>
                  </div>

                  {!isLoggedIn && (
                    <div className="mt-3">
                      <p className="font-bold text-gray-700">
                        ※未ログインのため、ポイントは受け取れません。
                      </p>
                      <button
                        onClick={onGoLogin}
                        className="mt-2 rounded-full bg-blue-500 px-5 py-2 font-black text-white hover:bg-blue-600"
                      >
                        ログインする
                      </button>
                    </div>
                  )}
             
                </>
              )}
            </div>
          )}

          {showButton && (
            <div className="mt-8 flex flex-col items-center justify-center gap-3 md:flex-row">
              <button
                onClick={onShareX}
                className="w-full rounded-full border-2 border-black bg-black px-7 py-3 text-xl font-black text-white shadow hover:opacity-80 md:w-auto"
              >
                Xで結果をシェア
              </button>

              {/* <button
                onClick={isCodeMatch ? onRematch : onNewMatch}
                className="w-full rounded-full border-2 border-black bg-gradient-to-r from-blue-500 to-violet-600 px-7 py-3 text-xl font-black text-white shadow hover:scale-105 md:w-auto"
              >
                {isCodeMatch ? "もう一回対戦する" : "もう一戦いく！"}
              </button> */}
              <button
                onClick={onRematch}
                className="w-full rounded-full border-2 border-black bg-gradient-to-r from-blue-500 to-violet-600 px-7 py-3 text-xl font-black text-white shadow hover:scale-105 md:w-auto"
              >
                もう一回対戦する
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {showButton && (
        <div className="mx-auto mt-8 w-full max-w-[900px] rounded-[28px] border border-[#e5ddd3] bg-[#f8f8f8] px-2 py-5 shadow-[0_10px_30px_rgba(0,0,0,0.08)] md:px-8 md:py-7">
          {rankLoading ? (
            <p className="py-6 text-center text-base font-bold text-gray-600 md:text-lg">
              ランキング読み込み中...
            </p>
          ) : arenaTop10.length > 0 ? (
            <ArenaRankingTop10 rows={arenaTop10} />
          ) : (
            <p className="py-6 text-center text-base font-bold text-gray-600 md:text-lg">
              まだランキングがありません
            </p>
          )}
        </div>
      )}

      {showButton && (
        <RecommendedMultiplayerGames
          title="次はみんなでどれ行く？🎮"
          count={4}
          excludeHref="/quiz-arena"
        />
      )}
    </div>
  );
};

export default function QuizArenaModePage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mode = pathname.split("/").pop() || "random";
  const code = searchParams?.get("code") || "";
  const timeParam = searchParams?.get("time") || "1";
  const totalTime = parseInt(timeParam) * 60;

  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { user, loading: userLoading } = useSupabaseUser();

  const [ownedCharacters, setOwnedCharacters] = useState<ArenaCharacter[]>([]);
  const [characterLoading, setCharacterLoading] = useState(true);
  const [selectedCharacter, setSelectedCharacter] = useState<ArenaCharacter | null>(null);
  const [entryDone, setEntryDone] = useState(false);

  const [questions, setQuestions] = useState<{ id: string; quiz: QuizData }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState<number | null>(null);

  const [timeLeft, setTimeLeft] = useState(totalTime);
  const [finished, setFinished] = useState(false);
  const [joined, setJoined] = useState(false);
  const [roomReady, setRoomReady] = useState(false);
  const [readyClicked, setReadyClicked] = useState(false);
  const [readyToStart, setReadyToStart] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [roomCode, setRoomCode] = useState("");

  const [attackGauge, setAttackGauge] = useState(0);
  const [specialGauge, setSpecialGauge] = useState(0);
  const [combo, setCombo] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  const [showCorrectMessage, setShowCorrectMessage] = useState(false);
  const [incorrectMessage, setIncorrectMessage] = useState<string | null>(null);
  const [battleMessage, setBattleMessage] = useState<string | null>(null);
  const [effect, setEffect] = useState<"attack" | "special" | "critical" | null>(null);
  const [myHitEffect, setMyHitEffect] = useState<"attack" | "critical" | null>(null);
  const [opponentHitEffect, setOpponentHitEffect] = useState<"attack" | "critical" | null>(null);
  const [myCardFlash, setMyCardFlash] = useState<"gold" | null>(null);
  const [opponentCardFlash, setOpponentCardFlash] = useState<"red" | null>(null);
  const [effectCharacter, setEffectCharacter] = useState<ArenaCharacter | null>(null);
  const [playerDisplayName, setPlayerDisplayName] = useState("");

  const [opponentAttackGauge, setOpponentAttackGauge] = useState(0);
  const [opponentSpecialGauge, setOpponentSpecialGauge] = useState(0);
  const [opponentCost, setOpponentCost] = useState(1);
  const [opponentSpecialCost, setOpponentSpecialCost] = useState(4);
  const [serverStartAt, setServerStartAt] = useState<number | null>(null);
  const [serverEndAt, setServerEndAt] = useState<number | null>(null);
  const [serverQuestionIds, setServerQuestionIds] = useState<string[]>([]);
  const [allQuestions, setAllQuestions] = useState<{ id: string; quiz: QuizData }[]>([]);
  const [battleCharacter, setBattleCharacter] = useState<ArenaCharacter | null>(null);
  const activeCharacter =
    battleCharacter ??
    selectedCharacter ??
    DEFAULT_CHARACTER;
  
  const finishStartedRef = useRef(false);
  const [finishOverlay, setFinishOverlay] = useState<{
    type: "ko" | "timeup";
    message: string;
    defeatedId?: "me" | "opponent";
  } | null>(null);

  const arenaResultSavedRef = useRef(false);
  const [finalArenaResult, setFinalArenaResult] = useState<{
    isWin: boolean;
    isDraw: boolean;
    myHp: number;
    opponentHp: number;
    myDamage: number;
    opponentDamage: number;
  } | null>(null);

  const finishTypeRef = useRef<"ko" | "timeup" | null>(null);

  const [arenaTop10, setArenaTop10] = useState<ArenaRankRow[]>([]);
  const [rankLoading, setRankLoading] = useState(true);

  const [sharedEffect, setSharedEffect] = useState<{
    fromId: string;
    type: "attack" | "special" | "critical";
    damage: number;
    character: ArenaCharacter;
  } | null>(null);

  const [visibleMessages, setVisibleMessages] = useState<BattleMessage[]>([]);
  const [rematchRequested, setRematchRequested] = useState(false);
  const [rematchAvailable, setRematchAvailable] = useState(false);
  const [matchEnded, setMatchEnded] = useState(false);

  const [earnedPoints, setEarnedPoints] = useState(0);
  const [earnedExp, setEarnedExp] = useState(0);
  const [awardStatus, setAwardStatus] = useState<AwardStatus>("idle");

  const playerName =
    playerDisplayName.trim() || "アリーナ参加者";

  const {
    joinRandom,
    joinWithCode,
    updateScore,
    sendReady,
    sendMessage,
    resetMatch,
    updateStartAt,
    players: rawPlayers,
    matched,
    bothReady,
    startAt,
    mySocketId,
    socket,
  } = useBattle(playerName);

  const players: Player[] = rawPlayers.map((p) => ({
    socketId: p.socketId,
    name: p.name,
    score: p.score,
    characterId: p.characterId ?? null,
    characterName: p.characterName ?? null,
    characterImage: p.characterImage ?? null,
    characterRarity: p.characterRarity ?? null,
  }));

  const me = players.find((p) => p.socketId === mySocketId);
  const opponent = players.find((p) => p.socketId !== mySocketId);
  const myPlayerName = me?.name ?? playerName;
  const opponentPlayerName = opponent?.name ?? "相手";

  const opponentImage = opponent?.characterImage;
  const opponentName = opponent?.characterName ?? opponent?.name ?? "相手";

  const opponentRarity = opponent?.characterRarity ?? "ノーマル";
  const opponentStats = getArenaStatsByRarity(opponentRarity);

  const opponentBattleCharacter: ArenaCharacter = {
    id: opponent?.characterId ?? "opponent",
    name: opponent?.characterName ?? opponent?.name ?? "相手",
    image: opponent?.characterImage ?? DEFAULT_CHARACTER.image,
    rarity: opponentRarity,
    ...opponentStats,
  };

  const myCharacterImage =
    me?.characterImage ?? selectedCharacter?.image ?? DEFAULT_CHARACTER.image;

  const myCharacterName =
    me?.characterName ?? selectedCharacter?.name ?? "あなた";

  const myCharacterRarity =
    me?.characterRarity ?? selectedCharacter?.rarity ?? "ノーマル";

  const getOpponentArenaCharacter = (): ArenaCharacter => {
    return {
      id: opponent?.characterId ?? "opponent",
      name: opponent?.characterName ?? opponent?.name ?? "相手",
      image: opponent?.characterImage ?? DEFAULT_CHARACTER.image,
      rarity: opponent?.characterRarity ?? "ノーマル",
      attack: 80,
      cost: 1,
      specialCost: 6,
    };
  };

  const lockArenaResult = () => {
    setFinalArenaResult((prev) => {
      if (prev) return prev;

      return {
        isWin,
        isDraw,
        myHp,
        opponentHp,
        myDamage,
        opponentDamage,
      };
    });
  };

  const startFinishSequence = ({
    type,
    defeatedId,
    message,
  }: {
    type: "ko" | "timeup";
    defeatedId?: "me" | "opponent";
    message: string;
  }) => {
    if (finishStartedRef.current) return;
    finishStartedRef.current = true;
    finishTypeRef.current = type;

    if (type === "timeup") {
      setFinishOverlay({
        type: "timeup",
        message: "TIME UP!",
      });

      setTimeout(() => {
        setFinished(true);
      }, 3000);

      return;
    }

    // まずキャラだけ消す
    setFinishOverlay({
      type: "ko",
      defeatedId,
      message: "",
    });

    // 1.5秒後にK.O.表示
    setTimeout(() => {
      setFinishOverlay({
        type: "ko",
        defeatedId,
        message,
      });
    }, 1500);

    // K.O.を3秒表示してリザルト
    setTimeout(() => {
      setFinished(true);
    }, 4500);
  };

  const myDamage = me?.score ?? 0;
  const opponentDamage = opponent?.score ?? 0;

  const myHp = Math.max(0, MAX_HP - opponentDamage);
  const opponentHp = Math.max(0, MAX_HP - myDamage);

  const isWin = myHp > opponentHp;
  const isDraw = myHp === opponentHp;
  const isCodeMatch = mode === "code";

  const addVisibleMessage = (message: BattleMessage) => {
    setVisibleMessages((prev) => [...prev, message]);

    setTimeout(() => {
      setVisibleMessages((prev) => prev.filter((m) => m.createdAt !== message.createdAt));
    }, 1600);
  };

  useEffect(() => {
    if (userLoading) return;

    const fetchOwned = async () => {
      setCharacterLoading(true);

      if (!user) {
        setOwnedCharacters([DEFAULT_CHARACTER]);
        setSelectedCharacter(DEFAULT_CHARACTER);
        setCharacterLoading(false);
        return;
      }

      const { data: rows, error } = await supabase
        .from("user_characters")
        .select("character_id")
        .eq("user_id", user.id);

      if (error) {
        console.warn("fetch arena owned characters error:", error);
        setOwnedCharacters([DEFAULT_CHARACTER]);
        setSelectedCharacter(DEFAULT_CHARACTER);
        setCharacterLoading(false);
        return;
      }

      const ids = (rows ?? [])
        .map((r: any) => r.character_id)
        .filter((v: string | null): v is string => !!v);

      if (ids.length === 0) {
        setOwnedCharacters([DEFAULT_CHARACTER]);
        setSelectedCharacter(DEFAULT_CHARACTER);
        setCharacterLoading(false);
        return;
      }

      const { data: chars, error: charsError } = await supabase
        .from("characters")
        .select("id, no, name, image_url, rarity")
        .in("id", ids)
        .order("no", { ascending: true });

      if (charsError) {
        console.warn("fetch arena characters error:", charsError);
        setOwnedCharacters([DEFAULT_CHARACTER]);
        setSelectedCharacter(DEFAULT_CHARACTER);
        setCharacterLoading(false);
        return;
      }

      const arenaChars: ArenaCharacter[] = (chars ?? []).map((c: any) => {
        const stats = getArenaStatsByRarity(c.rarity);
        const image = c.image_url
          ? c.image_url.startsWith("/")
            ? c.image_url
            : `/${c.image_url}`
          : DEFAULT_CHARACTER.image;

        return {
          id: c.id,
          no: c.no == null ? null : Number(c.no),
          name: c.name ?? "なぞのキャラ",
          image,
          rarity: c.rarity ?? "ノーマル",
          ...stats,
        };
      });

      const list =
        arenaChars.length > 0
          ? [...arenaChars].sort((a, b) => {
              const an = a.no ?? 999999;
              const bn = b.no ?? 999999;
              return an - bn;
            })
          : [DEFAULT_CHARACTER];

      // setOwnedCharacters(list);
      // setSelectedCharacter(list[0]);
      // setCharacterLoading(false);
      setOwnedCharacters(list);

      setSelectedCharacter((prev) => {
        if (prev) {
          const same = list.find((c) => c.id === prev.id);
          return same ?? prev;
        }

        return list[0];
      });

      setCharacterLoading(false);
    };

    fetchOwned();
  }, [user, userLoading, supabase]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchArticles = async () => {
      try {
        const res = await fetch("/api/articles", { signal: controller.signal });
        const data: ArticleData[] = await res.json();

        const quizQuestions: { id: string; quiz: QuizData }[] = data
          .filter((a) => a.quiz)
          .map((a, index) => ({
            id: `q${index + 1}`,
            quiz: {
              title: a.title,
              question: a.quiz!.question,
              answer: Number(a.quiz!.answer),
              displayAnswer: a.quiz!.displayAnswer,
              choices: a.quiz!.choices ? a.quiz!.choices.map(String) : [],
              genre: a.quiz!.genre,
              level: a.quiz!.level,
              answerExplanation: a.quiz!.answerExplanation,
              trivia: a.quiz!.trivia,
              hint: a.quiz!.hint,
            },
          }));

        setAllQuestions(quizQuestions);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        console.error("クイズ問題の取得に失敗しました:", e);
      }
    };

    fetchArticles();
    return () => controller.abort();
  }, [serverQuestionIds]);

  useEffect(() => {
    if (allQuestions.length === 0) return;
    if (serverQuestionIds.length === 0) return;

    const questionMap = new Map(allQuestions.map((q) => [q.id, q]));

    const orderedQuestions = serverQuestionIds
      .map((id) => questionMap.get(id))
      .filter((q): q is { id: string; quiz: QuizData } => !!q);

    if (orderedQuestions.length === 0) {
      console.error("サーバーの questionIds と /api/articles の id が一致していません", {
        serverQuestionIds: serverQuestionIds.slice(0, 10),
        articleIds: allQuestions.slice(0, 10).map((q) => q.id),
      });
      return;
    }

    setQuestions(orderedQuestions);
    setCurrentIndex(0);
  }, [allQuestions, serverQuestionIds]);

  useEffect(() => {
    if (players.length >= 2) setRoomReady(true);
  }, [players]);

  useEffect(() => {
    const targetStartAt = serverStartAt ?? startAt;

    if (targetStartAt) {
      const interval = setInterval(() => {
        const diff = Math.ceil((targetStartAt - Date.now()) / 1000);

        if (diff > 0) {
          setCountdown(diff);
        } else {
          setCountdown(null);
          setReadyToStart(true);
          clearInterval(interval);
        }
      }, 200);

      return () => clearInterval(interval);
    }
  }, [bothReady, startAt, serverStartAt]);

  useEffect(() => {
    if (!readyToStart || finished || !serverEndAt) return;

    const timer = setInterval(() => {
      const left = Math.max(0, Math.ceil((serverEndAt - Date.now()) / 1000));
      setTimeLeft(left);

      // if (left <= 0) {
      //   clearInterval(timer);
      //   setFinished(true);
      // }
      // if (left <= 0) {
      //   clearInterval(timer);

      //   if (finishStartedRef.current) return;
      //   if (myHp <= 0 || opponentHp <= 0) return;

      //   lockArenaResult();

      //   startFinishSequence({
      //     type: "timeup",
      //     message: "TIME UP!",
      //   });
      // }
      if (left <= 0) {
        clearInterval(timer);

        if (finishStartedRef.current) return;
        if (finishTypeRef.current) return;
        if (finalArenaResult) return;
        if (myHp <= 0 || opponentHp <= 0) return;

        lockArenaResult();

        startFinishSequence({
          type: "timeup",
          message: "TIME UP!",
        });
      }
    }, 250);

    return () => clearInterval(timer);
  }, [readyToStart, finished, serverEndAt, myHp, opponentHp]);

  useEffect(() => {
    const fetchArenaRanking = async () => {
      setRankLoading(true);

      try {
        const res = await fetch("/api/rankings/arena", {
          cache: "no-store",
        });

        const data = (await res.json()) as ArenaRankRow[];
        setArenaTop10(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("アリーナランキング取得失敗:", e);
        setArenaTop10([]);
      } finally {
        setRankLoading(false);
      }
    };

    fetchArenaRanking();
  }, [finished]);

  // useEffect(() => {
  //   if (myHp <= 0 || opponentHp <= 0) {
  //     setFinished(true);
  //   }
  // }, [myHp, opponentHp]);
  useEffect(() => {
    if (finished || finishStartedRef.current) return;

    if (myHp <= 0) {
      lockArenaResult();

      if (roomCode) {
        socket?.emit("arena_match_end", {
          roomCode,
          reason: "ko",
        });
      }

      startFinishSequence({
        type: "ko",
        defeatedId: "me",
        message: `${opponentPlayerName}が${myPlayerName}を撃破！`,
      });
      return;
    }

    if (opponentHp <= 0) {
      lockArenaResult();

      if (roomCode) {
        socket?.emit("arena_match_end", {
          roomCode,
          reason: "ko",
        });
      }

      startFinishSequence({
        type: "ko",
        defeatedId: "opponent",
        message: `${myPlayerName}が${opponentPlayerName}を撃破！`,
      });
    }
  }, [myHp, opponentHp, finished, myPlayerName, opponentPlayerName]);

  useEffect(() => {
    if (!socket) return;

    const handleReceive = ({ fromId, message }: { fromId: string; message: string }) => {
      addVisibleMessage({
        fromId,
        message,
        createdAt: Date.now() + Math.random(),
      });
    };

    const handleArenaMatchStart = ({
      startAt,
      endAt,
      questionIds,
    }: {
      startAt: number;
      endAt: number;
      questionIds?: string[];
    }) => {
      setServerStartAt(startAt);
      setServerEndAt(endAt);

      if (questionIds && questionIds.length > 0) {
        setServerQuestionIds(questionIds);
      }

      updateStartAt(startAt);
      setReadyToStart(false);
      setCountdown(Math.ceil((startAt - Date.now()) / 1000));
    };

    // const handleArenaTimeUp = () => {
    //   setTimeLeft(0);
    //   setFinished(true);
    // };
    // const handleArenaTimeUp = () => {
    //   if (finished || finishStartedRef.current) return;

    //   setTimeLeft(0);

    //   lockArenaResult();
    //   startFinishSequence({
    //     type: "timeup",
    //     message: "TIME UP!",
    //   });
    // };
    const handleArenaTimeUp = () => {
      if (finishStartedRef.current) return;
      if (finishTypeRef.current) return;
      if (finalArenaResult) return;
      if (myHp <= 0 || opponentHp <= 0) return;

      setTimeLeft(0);

      lockArenaResult();

      startFinishSequence({
        type: "timeup",
        message: "TIME UP!",
      });
    };

    const handleBothRematchReady = () => {
      setRematchAvailable(true);
      setRematchRequested(false);
    };

    const handleRematchStart = ({ startAt }: { startAt: number }) => {
      resetArenaState(false);
      updateStartAt(startAt);
      setReadyToStart(false);
      setCountdown(3);
      setRematchRequested(false);
      setRematchAvailable(false);
      setMatchEnded(false);
    };

    const handleOpponentLeft = () => {
      setMatchEnded(true);
      setFinished(true);
    };

    const handleArenaGaugeUpdate = ({
      fromId,
      attackGauge,
      specialGauge,
      cost,
      specialCost,
    }: {
      fromId: string;
      attackGauge: number;
      specialGauge: number;
      cost: number;
      specialCost: number;
    }) => {
      if (fromId === mySocketId) return;
      if (finishStartedRef.current || finished) return;

      setOpponentAttackGauge(attackGauge);
      setOpponentSpecialGauge(specialGauge);
      setOpponentCost(cost);
      setOpponentSpecialCost(specialCost);
    };

    const handleArenaAttackEffect = ({
      fromId,
      type,
      damage,
      character,
    }: {
      fromId: string;
      type: "attack" | "special" | "critical";
      damage: number;
      character: ArenaCharacter;
    }) => {
      if (fromId === mySocketId) return;
      if (finishStartedRef.current || finished) return;

      setOpponentCardFlash("red");

      setBattleMessage(
        type === "special"
          ? `🌟 相手の必殺技！ ${damage}ダメージ！`
          : type === "critical"
          ? `💥 相手のクリティカルヒット！ ${damage}ダメージ！`
          : `⚔️ 相手の攻撃！ ${damage}ダメージ！`
      );

      if (type === "special") {
        setSharedEffect({
          fromId,
          type,
          damage,
          character,
        });
      } else {
        setOpponentHitEffect(type);
      }

      setTimeout(() => {
        setSharedEffect(null);
        setOpponentHitEffect(null);
        setOpponentCardFlash(null);
      }, type === "special" ? 1400 : type === "critical" ? 900 : 650);
    };

    socket.on("receive_message", handleReceive);
    socket.on("both_rematch_ready", handleBothRematchReady);
    socket.on("rematch_start", handleRematchStart);
    socket.on("opponent_left", handleOpponentLeft);
    socket.on("match_ended", handleOpponentLeft);
    socket.on("arena_attack_effect", handleArenaAttackEffect);
    socket.on("arena_gauge_update", handleArenaGaugeUpdate);
    socket.on("arena_match_start", handleArenaMatchStart);
    socket.on("arena_time_up", handleArenaTimeUp);

    return () => {
      socket.off("receive_message", handleReceive);
      socket.off("both_rematch_ready", handleBothRematchReady);
      socket.off("rematch_start", handleRematchStart);
      socket.off("opponent_left", handleOpponentLeft);
      socket.off("match_ended", handleOpponentLeft);
      socket.off("arena_attack_effect", handleArenaAttackEffect);
      socket.off("arena_gauge_update", handleArenaGaugeUpdate);
      socket.off("arena_match_start", handleArenaMatchStart);
      socket.off("arena_time_up", handleArenaTimeUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, updateStartAt]);

  // useEffect(() => {
  //   if (!finished) return;

  //   const points = calcEarnedPoints({
  //     isWin,
  //     damage: myDamage,
  //     correctCount,
  //   });
  //   const exp = calcEarnedExp(correctCount);

  //   setEarnedPoints(points);
  //   setEarnedExp(exp);

  //   if (!user) {
  //     setAwardStatus("need_login");
  //     return;
  //   }

  //   // サーバー側の正式実装前なので、ここでは表示だけ awarded にしています。
  //   // add_points_and_exp を使いたい場合は、ここにRPC処理を追加してください。
  //   setAwardStatus("awarded");
  // }, [finished, isWin, myDamage, correctCount, user]);

  useEffect(() => {
    if (!finished) return;

    const resultForSave = finalArenaResult ?? {
      isWin,
      isDraw,
      myHp,
      opponentHp,
      myDamage,
      opponentDamage,
    };

    const points = calcEarnedPoints({
      isWin: resultForSave.isWin,
      damage: resultForSave.myDamage,
      correctCount,
    });

    const exp = calcEarnedExp(correctCount);

    setEarnedPoints(points);
    setEarnedExp(exp);

    if (!user) {
      setAwardStatus("need_login");
      return;
    }

    // あいことば対戦はランキング記録しない
    if (isCodeMatch) {
      setAwardStatus("awarded");
      return;
    }

    if (resultForSave.isDraw) {
      setAwardStatus("awarded");
      return;
    }

    if (arenaResultSavedRef.current) return;
    arenaResultSavedRef.current = true;

    const saveArenaResult = async () => {
      setAwardStatus("awarding");

      const { error } = await supabase.rpc("update_arena_result", {
        p_user_id: user.id,
        p_is_win: resultForSave.isWin,
      });

      if (error) {
        console.error("アリーナ結果保存失敗:", error);
        setAwardStatus("error");
        return;
      }

      const { error: pointError } = await supabase.rpc("add_points_and_exp", {
        p_user_id: user.id,
        p_points: points,
        p_exp: exp,
      });

      if (pointError) {
        console.error("アリーナポイント付与失敗:", pointError);
        setAwardStatus("error");
        return;
      }

      window.dispatchEvent(new Event("points:updated"));
      window.dispatchEvent(new Event("profile:updated"));

      setAwardStatus("awarded");
    };

    saveArenaResult();
  }, [finished, finalArenaResult, isWin, isDraw, myHp, opponentHp, myDamage, opponentDamage, correctCount, user, supabase, isCodeMatch]);

  const resetArenaState = (resetSocket: boolean) => {
    if (resetSocket) resetMatch();

    setJoined(false);
    setRoomReady(false);
    setReadyClicked(false);
    setReadyToStart(false);
    setFinished(false);
    setTimeLeft(totalTime);
    setCurrentIndex(0);
    setUserAnswer(null);
    setAttackGauge(0);
    setSpecialGauge(0);
    setCombo(0);
    setCorrectCount(0);
    setShowCorrectMessage(false);
    setIncorrectMessage(null);
    setBattleMessage(null);
    setEffect(null);
    setVisibleMessages([]);
    setRematchRequested(false);
    setRematchAvailable(false);
    setMatchEnded(false);
    setEarnedPoints(0);
    setEarnedExp(0);
    setAwardStatus("idle");
    setMyCardFlash(null);
    setOpponentCardFlash(null);
    setSharedEffect(null);
    setOpponentAttackGauge(0);
    setOpponentSpecialGauge(0);
    setOpponentCost(1);
    setOpponentSpecialCost(4);
    setMyHitEffect(null);
    setOpponentHitEffect(null);
    setEffectCharacter(null);
    setServerStartAt(null);
    setServerEndAt(null);
    setFinishOverlay(null);
    finishStartedRef.current = false;
    setFinishOverlay(null);
    arenaResultSavedRef.current = false;
    setFinalArenaResult(null);
    finishTypeRef.current = null;
  };

  const handleEntry = () => {
    if (!selectedCharacter) {
      setSelectedCharacter(DEFAULT_CHARACTER);
    }
    if (!playerDisplayName.trim()) {
      alert("プレイヤー名を入力してください");
      return;
    }

    const character = selectedCharacter ?? DEFAULT_CHARACTER;

    setSelectedCharacter(character);
    setBattleCharacter(character);
    setEntryDone(true);
  };

  const getSelectedCharacterPayload = () => {
    const character = selectedCharacter ?? DEFAULT_CHARACTER;

    return {
      characterId: character.id,
      characterName: character.name,
      characterImage: character.image,
      characterRarity: character.rarity,
    };
  };

  const handleJoin = () => {
    if (!selectedCharacter) {
      setSelectedCharacter(DEFAULT_CHARACTER);
    }

    setJoined(true);

    // if (mode === "random") {
    //   joinRandom({ maxPlayers: 2, gameType: "arena" }, (createdCode?: string) => {
    //     if (createdCode) setRoomCode(createdCode);
    //   });
    // } else {
    //   joinWithCode(code, "2", "arena");
    //   setRoomCode(`arena_${code}`);
    // }
    const characterPayload = getSelectedCharacterPayload();

    if (mode === "random") {
      joinRandom(
        {
          maxPlayers: 2,
          gameType: "arena",
          userId: user?.id ?? null,
          character: characterPayload,
        },
        (createdCode?: string) => {
          if (createdCode) setRoomCode(createdCode);
        }
      );
    } else {
      joinWithCode(
        code,
        "2",
        "arena",
        user?.id ?? null,
        characterPayload
      );

      setRoomCode(`arena_${code}`);
    }
  };

  const handleReady = () => {
    if (!socket || !roomCode) return;

    socket.emit("send_ready", {
      roomCode,
      gameType: "arena",
    });

    setReadyClicked(true);
  };

  const handleSendMessage = (message: string) => {
    if (!socket || !mySocketId) return;

    sendMessage(message);
    addVisibleMessage({
      fromId: mySocketId,
      message,
      createdAt: Date.now() + Math.random(),
    });
  };

  const sendArenaGaugeUpdate = ({
    attack,
    special,
  }: {
    attack: number;
    special: number;
  }) => {
    if (!socket || !roomCode || !mySocketId || !selectedCharacter) return;

    socket.emit("arena_gauge_update", {
      roomCode,
      fromId: mySocketId,
      attackGauge: attack,
      specialGauge: special,
      cost: selectedCharacter.cost,
      specialCost: selectedCharacter.specialCost,
    });
  };

  // const handleRematch = () => {
  //   if (!socket) return;

  //   setRematchRequested(true);

  //   if (roomCode) {
  //     socket.emit("send_ready", { roomCode });
  //     return;
  //   }

  //   sendReady();
  // };

  const handleRematch = () => {
    const keepCharacter = battleCharacter ?? selectedCharacter ?? DEFAULT_CHARACTER;

    // useBattle側の matched / players / startAt を消す
    resetMatch();

    // キャラと名前は維持
    setSelectedCharacter(keepCharacter);
    setBattleCharacter(keepCharacter);

    // 画面を「マッチに参加する」に戻す
    setEntryDone(true);
    setJoined(false);
    setRoomReady(false);
    setReadyClicked(false);
    setReadyToStart(false);
    setFinished(false);

    // 前回バトル状態を全部リセット
    setTimeLeft(totalTime);
    setCountdown(null);
    setCurrentIndex(0);
    setUserAnswer(null);
    setAttackGauge(0);
    setSpecialGauge(0);
    setOpponentAttackGauge(0);
    setOpponentSpecialGauge(0);
    setCombo(0);
    setCorrectCount(0);

    setShowCorrectMessage(false);
    setIncorrectMessage(null);
    setBattleMessage(null);
    setEffect(null);
    setSharedEffect(null);
    setMyHitEffect(null);
    setOpponentHitEffect(null);
    setMyCardFlash(null);
    setOpponentCardFlash(null);
    setEffectCharacter(null);

    setRematchRequested(false);
    setRematchAvailable(false);
    setMatchEnded(false);

    setFinishOverlay(null);
    finishStartedRef.current = false;
    setFinishOverlay(null);
    arenaResultSavedRef.current = false;
    setFinalArenaResult(null);
    finishTypeRef.current = null;

    setServerStartAt(null);
    setServerEndAt(null);
    setServerQuestionIds([]);
    setQuestions([]);
  };

  const handleNewMatch = () => {
    resetArenaState(true);

    setTimeout(() => {
      setJoined(true);

      // if (mode === "random") {
      //   joinRandom({ maxPlayers: 2, gameType: "arena" }, (createdCode?: string) => {
      //     if (createdCode) setRoomCode(createdCode);
      //   });
      // } else {
      //   joinWithCode(code, "2", "arena");
      //   setRoomCode(`arena_${code}`);
      // }
      const characterPayload = getSelectedCharacterPayload();

      if (mode === "random") {
        joinRandom(
          {
            maxPlayers: 2,
            gameType: "arena",
            userId: user?.id ?? null,
            character: characterPayload,
          },
          (createdCode?: string) => {
            if (createdCode) setRoomCode(createdCode);
          }
        );
      } else {
        joinWithCode(
          code,
          "2",
          "arena",
          user?.id ?? null,
          characterPayload
        );

        setRoomCode(`arena_${code}`);
      }
    }, 100);
  };

  const nextQuestion = () => {
    setShowCorrectMessage(false);
    setIncorrectMessage(null);
    setUserAnswer(null);

    if (currentIndex + 1 >= questions.length) {
      setCurrentIndex(0);
      return;
    }

    setCurrentIndex((i) => i + 1);
  };

  const performAttack = (
    damage: number,
    type: "attack" | "special" | "critical"
  ) => {
    if (finishStartedRef.current || finished) return;
    const character = activeCharacter;
    setEffectCharacter(character);

    setMyCardFlash("gold");

    setBattleMessage(
      type === "special"
        ? `🌟 必殺技！ ${damage}ダメージ！`
        : type === "critical"
        ? `💥 クリティカルヒット！ ${damage}ダメージ！`
        : `⚔️ 攻撃！ ${damage}ダメージ！`
    );

    socket?.emit("arena_attack_effect", {
      roomCode,
      fromId: mySocketId,
      type,
      damage,
      character: {
        id: character.id,
        name: character.name,
        image: character.image,
        rarity: character.rarity,
        attack: character.attack,
        cost: character.cost,
        specialCost: character.specialCost,
      },
    });

    if (type === "special") {
      setEffect("special");

      setTimeout(() => {
        updateScore(damage);
        setEffect(null);
        setMyCardFlash(null);
      }, 1400);

      return;
    }

    setMyHitEffect(type);

    setTimeout(() => {
      updateScore(damage);
      setMyHitEffect(null);
      setMyCardFlash(null);
    }, type === "critical" ? 900 : 650);
  };

  const checkAnswer = () => {
    if (!questions[currentIndex]?.quiz || !selectedCharacter) return;
    if (finishStartedRef.current || finished) return;

    const correct = Number(questions[currentIndex].quiz.answer) === Number(userAnswer);
    const displayAnswer = questions[currentIndex].quiz.displayAnswer ?? questions[currentIndex].quiz.answer;

    if (!correct) {
      setCombo(0);
      setShowCorrectMessage(false);
      setIncorrectMessage(`× 不正解！\n答えは「${displayAnswer}」でした`);
      setTimeout(nextQuestion, 1300);
      return;
    }

    const nextCombo = combo + 1;
    const nextAttackGauge = attackGauge + 1;
    const nextSpecialGauge = specialGauge + 1;

    setCorrectCount((v) => v + 1);
    setCombo(nextCombo);
    const cappedSpecialGauge = Math.min(
      nextSpecialGauge,
      selectedCharacter.specialCost
    );

    setAttackGauge(nextAttackGauge);
    setSpecialGauge(cappedSpecialGauge);

    sendArenaGaugeUpdate({
      attack: nextAttackGauge,
      special: cappedSpecialGauge,
    });
    setShowCorrectMessage(true);
    setIncorrectMessage(null);

    const canSpecial = nextSpecialGauge >= activeCharacter.specialCost;
    const canAttack = nextAttackGauge >= activeCharacter.cost;

    if (canSpecial) {
      const specialDamage = Math.floor(
        selectedCharacter.attack * 2.0 * getComboMultiplier(nextCombo)
      );
      setAttackGauge(0);
      setSpecialGauge(0);

      sendArenaGaugeUpdate({
        attack: 0,
        special: 0,
      });

      setTimeout(() => {
        performAttack(specialDamage, "special");
        setTimeout(nextQuestion, 1400);
      }, 450);

      return;
    }

    if (canAttack) {
      const isCritical = nextCombo >= 3 && Math.random() < 0.2;
      const multiplier = getComboMultiplier(nextCombo) * (isCritical ? 1.5 : 1);
      const damage = Math.floor(activeCharacter.attack * multiplier);

      setAttackGauge(0);

      sendArenaGaugeUpdate({
        attack: 0,
        special: cappedSpecialGauge,
      });

      setTimeout(() => {
        performAttack(damage, isCritical ? "critical" : "attack");
        setTimeout(nextQuestion, 1400);
      }, 450);

      return;
    }

    setTimeout(nextQuestion, 900);
  };

  // const handleShareX = () => {
  //   const resultText = isDraw ? "引き分け🤝" : isWin ? "勝ち🏆" : "負け…";
  //   const text = [
  //     "【ひまQ｜クイズアリーナ⚔️】",
  //     `勝敗：${resultText}`,
  //     `正解数：${correctCount}問`,
  //     `与えたダメージ：${myDamage}`,
  //     `残りHP：${myHp}`,
  //     "",
  //     "👇ひまQ（みんなで遊べるクイズ）",
  //     "#ひまQ #クイズ #クイズゲーム",
  //   ].join("\n");

  //   openXShare({ text, url: buildTopUrl() });
  // };
  const handleShareX = () => {
    const result = finalArenaResult ?? {
      isWin,
      isDraw,
      myHp,
      opponentHp,
      myDamage,
      opponentDamage,
    };

    const resultText = result.isDraw
      ? "引き分け🤝"
      : result.isWin
      ? "勝ち🏆"
      : "負け…";

    const text = [
      "【ひまQ｜クイズアリーナ⚔️】",
      `勝敗：${resultText}`,
      `正解数：${correctCount}問`,
      `与えたダメージ：${result.myDamage}`,
      `残りHP：${result.myHp}`,
      "",
      "👇ひまQ（みんなで遊べるクイズ）",
      "#ひまQ #クイズ #クイズゲーム",
    ].join("\n");

    openXShare({ text, url: buildTopUrl() });
  };

  if (!entryDone) {
    return (
      <CharacterSelect
        loading={userLoading || characterLoading}
        characters={ownedCharacters}
        selected={selectedCharacter}
        onSelect={setSelectedCharacter}
        onStart={handleEntry}
        isLoggedIn={!!user}
        playerDisplayName={playerDisplayName}
        setPlayerDisplayName={setPlayerDisplayName}
      />
    );
  }

  if (finished) {
    return (
      <QuizResult
        correctCount={correctCount}
        // myDamage={myDamage}
        // opponentDamage={opponentDamage}
        // myHp={myHp}
        // opponentHp={opponentHp}
        // isWin={isWin}
        // isDraw={isDraw}
        myDamage={finalArenaResult?.myDamage ?? myDamage}
        opponentDamage={finalArenaResult?.opponentDamage ?? opponentDamage}
        myHp={finalArenaResult?.myHp ?? myHp}
        opponentHp={finalArenaResult?.opponentHp ?? opponentHp}
        isWin={finalArenaResult?.isWin ?? isWin}
        isDraw={finalArenaResult?.isDraw ?? isDraw}
        earnedPoints={earnedPoints}
        earnedExp={earnedExp}
        isLoggedIn={!!user}
        awardStatus={awardStatus}
        onGoLogin={() => router.push("/user/login")}
        isCodeMatch={isCodeMatch}
        rematchRequested={rematchRequested}
        rematchAvailable={rematchAvailable}
        matchEnded={matchEnded}
        onShareX={handleShareX}
        onNewMatch={handleNewMatch}
        onRematch={handleRematch}
        arenaTop10={arenaTop10}
        rankLoading={rankLoading}
      />
    );
  }

  return (
    <>
      <AnimatePresence>
        {finishOverlay && (finishOverlay.type === "timeup" || finishOverlay.message) && (
          <motion.div
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="rounded-[2rem] border-4 border-yellow-300 bg-stone-950 px-8 py-6 text-center shadow-[0_0_40px_rgba(250,204,21,0.9)]"
            >
              {finishOverlay.type === "timeup" ? (
                <>
                  <p className="text-5xl font-black text-yellow-300 md:text-8xl">
                    TIME UP!
                  </p>
                </>
              ) : (
                <>
                  <p className="text-4xl font-black text-yellow-300 md:text-7xl">
                    K.O.!
                  </p>

                  <p className="mt-4 text-2xl font-black text-white md:text-4xl">
                    {finishOverlay.message}
                  </p>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {effect === "special" && selectedCharacter && (
          <motion.div
            key="my-special"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AttackEffect character={effectCharacter ?? selectedCharacter} type="special" />
          </motion.div>
        )}

        {sharedEffect?.type === "special" && (
          <motion.div
            key={`shared-${sharedEffect.fromId}-special`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AttackEffect character={sharedEffect.character} type="special" />
          </motion.div>
        )}
      </AnimatePresence>

      <FloatingMessages messages={visibleMessages} mySocketId={mySocketId} />

      <div className="bg-[radial-gradient(circle_at_top,#fde68a_0%,#fb7185_28%,#7c3aed_62%,#111827_100%)] px-2 py-3 text-center md:p-6">
        <div className="mx-auto max-w-6xl">
          <OnlineGameNotice />

          {!joined ? (
            <div className="relative mx-auto mt-8 max-w-xl overflow-hidden rounded-[2rem] border-3 border-stone-950 bg-gradient-to-br from-stone-950 via-amber-950 to-red-900 p-1 shadow-[0_8px_0_rgba(28,25,23,1)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#facc15_0%,transparent_35%)] opacity-40" />

              <div className="relative rounded-[1.8rem] border-2 border-amber-300/70 bg-gradient-to-b from-amber-100 via-white to-orange-100 p-5">
                <div className="mb-3 flex items-center justify-center gap-2">
                  <div className="rounded-full bg-sky-100 px-4 py-2 text-lg font-black text-sky-700 shadow">
                    👤 {playerDisplayName}
                  </div>
                </div>
                
                <div className="mx-auto mb-3 inline-flex rounded-full border-2 border-stone-900 bg-stone-950 px-5 py-1 text-sm font-black text-white shadow">
                  ⚔️ 出陣キャラ
                </div>

                <div className="mx-auto grid h-46 md:h-52 w-46 md:w-52 place-items-center rounded-full bg-gradient-to-b from-yellow-100 via-orange-100 to-red-100 shadow-[0_0_35px_rgba(250,204,21,0.9)]">
                  {/* <img
                    src={selectedCharacter?.image}
                    alt={selectedCharacter?.name}
                    className="h-46 object-contain drop-shadow-2xl md:h-52"
                  /> */}
                  <Image
                    src={selectedCharacter?.image ?? DEFAULT_CHARACTER.image}
                    alt={selectedCharacter?.name ?? "出陣キャラ"}
                    width={220}
                    height={220}
                    className="h-46 w-auto object-contain drop-shadow-2xl md:h-52"
                    priority
                  />
                </div>

                <p className="mt-4 text-3xl font-black text-stone-950 drop-shadow md:text-4xl">
                  {selectedCharacter?.name}
                </p>

                <p className="mx-auto mt-1 md:mt-2 inline-flex rounded-full bg-violet-700 px-4 py-1 text-sm font-black text-white shadow">
                  {selectedCharacter?.rarity}
                </p>

                <div className="mt-2 md:mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm font-black">
                  <div className="rounded-2xl border-2 border-red-300 bg-red-100 p-2 text-red-700">
                    ⚔️ 攻撃力：
                    {/* <br /> */}
                    {selectedCharacter?.attack}
                  </div>
                  <div className="rounded-2xl border-2 border-violet-300 bg-violet-100 p-2 text-violet-700">
                    ⚡ 攻撃コスト：
                    {/* <br /> */}
                    {selectedCharacter?.cost}
                  </div>
                  <div className="rounded-2xl border-2 border-yellow-300 bg-yellow-100 p-2 text-yellow-700">
                    🌟 必殺コスト：
                    {/* <br /> */}
                    {selectedCharacter?.specialCost}
                  </div>
                </div>

                <button
                  onClick={handleJoin}
                  className="mt-6 w-full rounded-full border-3 border-stone-950 bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400 px-8 py-4 text-xl font-black text-white shadow-[0_6px_0_rgba(28,25,23,1)] transition hover:scale-105 active:translate-y-1 active:shadow-[0_2px_0_rgba(28,25,23,1)] md:text-2xl"
                >
                  ⚔️ マッチに参加する
                </button>

                <button
                  onClick={() => setEntryDone(false)}
                  className="mt-4 rounded-full border-2 border-stone-900 bg-white px-6 py-2 text-base font-black text-stone-800 shadow transition hover:bg-amber-100 hover:scale-105"
                >
                  🔁 キャラを変える
                </button>
              </div>
            </div>
          ) : !roomReady || !matched ? (
            <div className="mx-auto mt-8 max-w-xl rounded-[2rem] border-3 border-stone-900 bg-white p-6 shadow-xl">
              <p className="text-2xl font-black text-stone-900 animate-pulse">
                対戦相手を待っています…
              </p>
              <p className="mt-2 font-bold text-stone-600">
                2人そろうと準備画面に進みます。
              </p>
            </div>
          ) : !readyToStart ? (
            <div className="relative mx-auto mt-8 max-w-3xl overflow-hidden rounded-[2rem] border-3 border-slate-950 bg-gradient-to-br from-slate-950 via-purple-950 to-fuchsia-900 p-1 shadow-[0_8px_0_rgba(28,25,23,1)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#facc15_0%,transparent_35%)] opacity-40" />

              <div className="relative rounded-[1.8rem] border-2 border-amber-300/70 bg-gradient-to-b from-amber-100 via-white to-orange-100 p-5">
                <p className="inline-flex rounded-full border-2 border-stone-900 bg-stone-950 px-5 py-1 text-sm font-black text-white shadow">
                  ⚔️ 対戦相手が見つかりました！
                </p>

                <p className="mt-3 text-2xl font-black text-orange-600 md:text-4xl">
                  いざ、クイズバトル開幕！
                </p>

                <p className="mt-1 text-sm font-bold text-stone-600 md:text-base">
                  準備できたら「対戦スタート！」を押そう！
                </p>

                <div className="mt-5 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-2 md:gap-5">
                  <div className="rounded-[1.5rem] border-3 border-emerald-700 bg-gradient-to-b from-emerald-100 to-white p-3 shadow-xl">
                    <p className="mb-2 text-sm font-black text-emerald-700">あなた：{myPlayerName}</p>

                    <div className="mx-auto grid h-28 w-28 place-items-center rounded-full bg-emerald-50 shadow-[0_0_20px_rgba(16,185,129,0.55)] md:h-40 md:w-40">
                      {/* <img
                        src={myCharacterImage}
                        alt={myCharacterName}
                        className="h-28 object-contain drop-shadow-2xl md:h-40"
                      /> */}
                      <Image
                        src={myCharacterImage}
                        alt={myCharacterName}
                        width={160}
                        height={160}
                        className="h-28 w-auto object-contain drop-shadow-2xl md:h-40"
                        priority
                      />
                    </div>

                    <p className="mt-2 truncate text-sm font-black text-stone-900 md:text-lg">
                      {myCharacterName}
                    </p>
                  </div>

                  <div className="grid place-items-center">
                    <p className="rounded-full border-3 border-stone-950 bg-red-600 px-3 py-2 text-2xl font-black text-white shadow-[0_4px_0_rgba(28,25,23,1)] md:px-5 md:text-5xl">
                      VS
                    </p>
                  </div>

                  <div className="rounded-[1.5rem] border-3 border-red-700 bg-gradient-to-b from-red-100 to-white p-3 shadow-xl">
                    <p className="mb-2 text-sm font-black text-red-700">相手：{opponentPlayerName}</p>

                    <div className="mx-auto grid h-28 w-28 place-items-center rounded-full bg-red-50 shadow-[0_0_20px_rgba(239,68,68,0.55)] md:h-40 md:w-40">
                      {opponentImage ? (
                        // <img
                        //   src={opponentImage}
                        //   alt={opponentName}
                        //   className="h-28 object-contain drop-shadow-2xl md:h-40"
                        // />
                        <Image
                          src={opponentImage}
                          alt={opponentName}
                          width={160}
                          height={160}
                          className="h-28 w-auto object-contain drop-shadow-2xl md:h-40"
                          priority
                        />
                      ) : (
                        <div className="text-5xl md:text-7xl">❓</div>
                      )}
                    </div>

                    <p className="mt-2 truncate text-sm font-black text-stone-900 md:text-lg">
                      {opponentName}
                    </p>
                  </div>
                </div>

                {countdown !== null ? (
                  <p className="mt-6 text-6xl font-black text-red-500 drop-shadow animate-pulse md:text-8xl">
                    {countdown}
                  </p>
                ) : readyClicked ? (
                  <p className="mt-6 rounded-2xl bg-white px-4 py-3 text-xl font-black text-stone-700 shadow">
                    相手の準備を待っています…
                  </p>
                ) : (
                  <button
                    onClick={handleReady}
                    className="mt-6 w-full rounded-full border-3 border-stone-950 bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400 px-8 py-4 text-xl font-black text-white shadow-[0_6px_0_rgba(28,25,23,1)] transition hover:scale-105 active:translate-y-1 active:shadow-[0_2px_0_rgba(28,25,23,1)] md:w-auto md:text-2xl"
                  >
                    ⚔️ 対戦スタート！
                  </button>
                )}
              </div>
            </div>
          ) : questions.length === 0 ? (
            <div className="mx-auto mt-8 max-w-xl rounded-[2rem] border-3 border-stone-900 bg-white p-6 shadow-xl">
              <p className="text-2xl font-black text-stone-900 animate-pulse">
                問題を読み込み中...
              </p>
              {/* <p className="mt-2 font-bold text-stone-600">
                サーバーから問題を受け取っています。
              </p> */}
            </div>
          ) : (
            <>
              <div className="relative overflow-hidden rounded-[2rem] border-3 border-slate-950 bg-gradient-to-br from-slate-950 via-purple-950 to-fuchsia-900 p-2 shadow-[0_8px_0_rgba(28,25,23,1)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#facc15_0%,transparent_35%)] opacity-30" />

                <div className="relative rounded-[1.7rem] bg-gradient-to-b from-white via-slate-50 to-purple-50 p-3 md:p-5">

                  {/* 上部 */}
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="rounded-full border-2 border-white/50 bg-gradient-to-r from-purple-700 via-fuchsia-600 to-pink-500 px-3 py-1 text-sm font-black text-white md:text-lg">
                      ⚔️ クイズアリーナ
                    </div>

                    <div className="rounded-full border-2 border-white/30 bg-black/40 backdrop-blur px-3 py-1 text-sm font-black text-yellow-300 shadow md:text-xl">
                      ⏱ 残り {timeLeft} 秒
                    </div>
                  </div>

                  {battleMessage && (
                    <p className="mb-3 rounded-2xl bg-gradient-to-r from-yellow-300 via-orange-300 to-pink-300 px-4 py-2 text-xl font-black text-stone-950 shadow animate-pulse md:text-3xl">
                      {battleMessage}
                    </p>
                  )}

                  {/* キャラ部分 */}
                  {/* <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center"> */}
                  <div className="grid w-full min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center">

                    {/* 自分 */}
                    {/* <div className="rounded-[1.5rem] border-3 border-emerald-700 bg-gradient-to-b from-emerald-100 via-white to-white p-3 shadow-xl"> */}
                    <div
                      className={`
                        w-full min-w-0 rounded-[1.5rem] border-3 border-emerald-700 bg-gradient-to-b from-cyan-100 via-white to-blue-50 p-3 shadow-xl transition-all duration-300
                        ${
                          myCardFlash === "gold"
                            ? "scale-[1.03] ring-4 ring-yellow-300 shadow-[0_0_35px_rgba(250,204,21,0.95)]"
                            : ""
                        }
                      `}
                    >
                      {/* <div className="flex items-center gap-3"> */}
                      <div className="flex min-w-0 items-center gap-2 md:gap-3">

                        {/* <div className="relative grid h-24 w-24 shrink-0 place-items-center overflow-hidden bg-emerald-50 shadow-[0_0_20px_rgba(16,185,129,0.5)] md:h-32 md:w-32"> */}
                        <div className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden bg-emerald-50 shadow-[0_0_20px_rgba(16,185,129,0.5)] md:h-32 md:w-32">
                          {/* <img
                            src={myCharacterImage}
                            alt={myCharacterName}
                            // className="h-24 object-contain drop-shadow-2xl md:h-32"
                            // className="h-20 object-contain drop-shadow-2xl md:h-32"
                            className={`
                              h-20 object-contain drop-shadow-2xl transition-all duration-1000 md:h-32
                              ${finishOverlay?.defeatedId === "me" ? "opacity-0 scale-75 blur-sm" : ""}
                            `}
                          /> */}
                          <Image
                            src={myCharacterImage}
                            alt={myCharacterName}
                            width={128}
                            height={128}
                            className={`
                              h-20 w-auto object-contain drop-shadow-2xl transition-all duration-1000 md:h-32
                              ${finishOverlay?.defeatedId === "me" ? "opacity-0 scale-75 blur-sm" : ""}
                            `}
                            priority
                          />

                          {myHitEffect && <CharacterHitEffect type={myHitEffect} />}
                        </div>

                        {/* <div className="flex-1 text-left"> */}
                        <div className="min-w-0 flex-1 text-left">
                          <p className="text-xs font-black text-emerald-700">
                            あなた：{myPlayerName}
                          </p>

                          {/* <p className="truncate text-lg font-black text-stone-950 md:text-2xl"> */}
                          <p className="line-clamp-2 text-lg font-black text-stone-950 md:line-clamp-none md:text-2xl">
                            {myCharacterName}
                          </p>

                          <HpGauge
                            label="HP"
                            current={myHp}
                            max={MAX_HP}
                          />

                          <div className="mt-2 grid gap-1">
                            <Gauge
                              label="攻撃ゲージ"
                              current={attackGauge}
                              max={activeCharacter.cost}
                              colorClass="bg-orange-500"
                            />

                            <Gauge
                              label="必殺ゲージ"
                              current={specialGauge}
                              max={activeCharacter.specialCost}
                              colorClass="bg-violet-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* VS */}
                    <div className="hidden md:grid place-items-center">
                      <p className="rounded-full border-3 border-stone-950 bg-red-600 px-4 py-2 text-4xl font-black text-white shadow-[0_5px_0_rgba(28,25,23,1)]">
                        VS
                      </p>
                    </div>

                    {/* 相手 */}
                    {/* <div className="rounded-[1.5rem] border-3 border-red-700 bg-gradient-to-b from-red-100 via-white to-white p-3 shadow-xl"> */}
                    <div
                      className={`
                        w-full min-w-0 rounded-[1.5rem] border-3 border-red-700 bg-gradient-to-b from-pink-100 via-white to-rose-50 p-3 shadow-xl transition-all duration-300
                        ${
                          opponentCardFlash === "red"
                            ? "scale-[1.03] ring-4 ring-red-400 shadow-[0_0_35px_rgba(239,68,68,0.95)]"
                            : ""
                        }
                      `}
                    >
                      {/* <div className="flex items-center gap-3 md:flex-row-reverse"> */}
                      <div className="flex min-w-0 items-center gap-2 md:flex-row-reverse md:gap-3">

                        {/* <div className="relative grid h-24 w-24 shrink-0 place-items-center overflow-hidden bg-red-50 shadow-[0_0_20px_rgba(239,68,68,0.5)] md:h-32 md:w-32"> */}
                        <div className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden bg-red-50 shadow-[0_0_20px_rgba(239,68,68,0.5)] md:h-32 md:w-32">
                          {opponent?.characterImage ? (
                            // <img
                            //   src={opponentBattleCharacter.image}
                            //   alt={opponentBattleCharacter.name}
                            //   // className="h-24 object-contain drop-shadow-2xl md:h-32"
                            //   // className="h-20 object-contain drop-shadow-2xl md:h-32"
                            //   className={`
                            //     h-20 object-contain drop-shadow-2xl transition-all duration-1000 md:h-32
                            //     ${finishOverlay?.defeatedId === "opponent" ? "opacity-0 scale-75 blur-sm" : ""}
                            //   `}
                            // />
                            <Image
                              src={opponentBattleCharacter.image}
                              alt={opponentBattleCharacter.name}
                              width={128}
                              height={128}
                              className={`
                                h-20 w-auto object-contain drop-shadow-2xl transition-all duration-1000 md:h-32
                                ${finishOverlay?.defeatedId === "opponent" ? "opacity-0 scale-75 blur-sm" : ""}
                              `}
                              priority
                            />
                          ) : (
                            <div className="text-5xl">❓</div>
                          )}

                          {opponentHitEffect && <CharacterHitEffect type={opponentHitEffect} />}
                        </div>

                        {/* <div className="flex-1 text-left md:text-right"> */}
                        <div className="min-w-0 flex-1 text-left md:text-right">

                          <p className="text-xs font-black text-red-700">
                            相手：{opponentPlayerName}
                          </p>

                          {/* <p className="truncate text-lg font-black text-stone-950 md:text-2xl"> */}
                          <p className="line-clamp-2 text-lg font-black text-stone-950 md:line-clamp-none md:text-2xl">
                            {opponentBattleCharacter.name}
                          </p>

                          <HpGauge
                            label="HP"
                            current={opponentHp}
                            max={MAX_HP}
                          />

                          <div className="mt-2 grid gap-1">
                            <Gauge
                              label="攻撃ゲージ"
                              current={opponentAttackGauge}
                              max={opponentBattleCharacter.cost}
                              colorClass="bg-orange-500"
                            />

                            <Gauge
                              label="必殺ゲージ"
                              current={opponentSpecialGauge}
                              max={opponentBattleCharacter.specialCost}
                              colorClass="bg-violet-500"
                            />
                          </div>

                          <p className="mt-2 rounded-full bg-red-100 px-3 py-1 text-sm font-black text-red-700">
                            受けたダメージ：{opponentDamage}
                          </p>

                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 下部ステータス */}
                  <div className="mt-3 flex flex-wrap justify-center gap-2">

                    <p className="rounded-full border-2 border-stone-900 bg-white px-4 py-1 text-sm font-black text-stone-900 shadow">
                      ✅ 正解数：{correctCount}
                    </p>

                    <p className="rounded-full border-2 border-red-300 bg-red-100 px-4 py-1 text-sm font-black text-red-600 shadow">
                      🔥 コンボ：{combo}
                    </p>

                    <p className="rounded-full border-2 border-violet-300 bg-violet-100 px-4 py-1 text-sm font-black text-violet-700 shadow">
                      ✨ 倍率：×{getComboMultiplier(combo)}
                    </p>

                  </div>

                </div>
              </div>

              {/* <MessageButtons disabled={!socket} onSend={handleSendMessage} /> */}

              {showCorrectMessage && (
                <p className="mb-3 mt-4 text-4xl font-black text-green-600 drop-shadow animate-bounce">
                  ◎正解！
                </p>
              )}

              {incorrectMessage && (
                <p className="mb-3 mt-4 whitespace-pre-line text-3xl font-black text-red-500 drop-shadow animate-shake">
                  {incorrectMessage}
                </p>
              )}

              {!showCorrectMessage && !incorrectMessage && (
                <div className="mx-auto mt-4 max-w-3xl rounded-[2rem] border-3 border-stone-900 bg-white p-4 shadow-xl">
                  <QuizQuestion
                    key={questions[currentIndex].id}
                    quiz={questions[currentIndex].quiz}
                    userAnswer={userAnswer}
                    setUserAnswer={setUserAnswer}
                  />

                  <button
                    onClick={checkAnswer}
                    disabled={userAnswer === null}
                    className="mt-4 rounded-full border-2 border-black bg-gradient-to-r from-blue-500 to-violet-600 px-8 py-3 text-xl font-black text-white shadow hover:scale-105 disabled:bg-gray-300 disabled:text-gray-500"
                  >
                    回答する
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
