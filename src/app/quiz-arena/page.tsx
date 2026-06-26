"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Anton } from "next/font/google";
import { useRouter } from "next/navigation";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";
import ArenaRankingTop10 from "@/app/components/ArenaRankingTop10";

const anton = Anton({ subsets: ["latin"], weight: "400" });

type ArenaRankRow = {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  arena_wins: number;
  arena_current_win_streak?: number | null;
};

type ArenaCharacter = {
  src: string;
  hpPercent: number;
  hpColorClass: string;
};

export default function QuizArenaPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useSupabaseUser();

  const [showDescription, setShowDescription] = useState(false);
  const descriptionRef = useRef<HTMLDivElement>(null);

  const [limitTime] = useState<number | null>(1);

  const [arenaTop10, setArenaTop10] = useState<ArenaRankRow[]>([]);
  const [rankLoading, setRankLoading] = useState(true);

  const allCharacters: ArenaCharacter[] = [
    {
      src: "/images/ドラゴン1.png",
      hpPercent: 100,
      hpColorClass: "bg-emerald-500",
    },
    {
      src: "/images/きまぐれモンスター1.png",
      hpPercent: 52,
      hpColorClass: "bg-yellow-400",
    },
    {
      src: "/images/kenshi.png",
      hpPercent: 18,
      hpColorClass: "bg-red-500",
    },
  ];

  const mobileCharacters: ArenaCharacter[] = [
    {
      src: "/images/きまぐれモンスター1.png",
      hpPercent: 52,
      hpColorClass: "bg-yellow-400",
    },
    {
      src: "/images/kenshi.png",
      hpPercent: 18,
      hpColorClass: "bg-red-500",
    },
  ];

  const [characters, setCharacters] = useState<ArenaCharacter[]>([]);
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    setCharacters(isMobile ? mobileCharacters : allCharacters);
  }, []);

  useEffect(() => {
    setVisibleCount(0);

    characters.forEach((_, index) => {
      setTimeout(() => {
        setVisibleCount((v) => v + 1);
      }, index * 220);
    });
  }, [characters]);

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
  }, []);

  const handleOnlineStart = () => {
    router.push(`/quiz-arena/random?time=${limitTime}`);
  };

  const [showCodeInput, setShowCodeInput] = useState(false);
  const [battleCode, setBattleCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);

  const handleCodeStart = () => {
    const code = battleCode.trim();

    if (!code) {
      setCodeError("あいことばを入力してください");
      return;
    }

    router.push(
      `/quiz-arena/code?time=${limitTime}&code=${encodeURIComponent(code)}`
    );
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#fde68a_0%,#fb7185_28%,#7c3aed_62%,#111827_100%)] px-4 py-8 text-center">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border-2 border-white/70 bg-white/20 px-4 py-1 text-sm font-black text-purple-500 shadow-lg backdrop-blur">
          <span>⚔️ 2人対戦型クイズバトル</span>
        </div>

        <h1
          className="mb-3 text-center text-5xl font-extrabold leading-tight md:text-7xl"
          style={{
            color: "#ffffff",
            textShadow: `
              2px 2px 0 #000,
              -2px 2px 0 #000,
              2px -2px 0 #000,
              -2px -2px 0 #000,
              0px 2px 0 #000,
              2px 0px 0 #000,
              -2px 0px 0 #000,
              0px -2px 0 #000,
              1px 1px 0 #000,
              -1px 1px 0 #000,
              1px -1px 0 #000,
              -1px -1px 0 #000,
              0 0 18px #facc15,
              0 0 32px #fb7185
            `,
            fontFamily: anton.style.fontFamily,
          }}
        >
          <span className="block md:hidden">
            クイズ
            <br />
            アリーナ
          </span>
          <span className="hidden md:block">クイズアリーナ</span>
        </h1>

        <p className="mb-2 text-xl font-black text-white drop-shadow md:text-3xl">
          ひまQのキャラで対戦！
        </p>
        <p className="mb-6 text-base font-bold text-white/95 md:text-2xl">
          クイズ正解で攻撃チャンス！相手より先にHPを削りきれ！
        </p>

        <div className="mb-6 flex justify-center gap-2 md:gap-5">
          {characters.map((character, index) => (
            <div
              key={character.src}
              className={`
                relative rounded-3xl border-2 border-white/80 bg-white/20 p-2 pb-5 shadow-2xl backdrop-blur
                ${visibleCount > index ? "character-animate" : "opacity-0"}
              `}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <img
                src={character.src}
                alt={`アリーナキャラ${index + 1}`}
                className="h-32 w-28 rounded-2xl object-cover md:h-52 md:w-44"
              />

              <div className="absolute -bottom-4 left-1/2 w-[92%] -translate-x-1/2 rounded-2xl border-2 border-black bg-gray-900 px-2 py-1 shadow">
                <div className="mb-1 flex items-center justify-between text-[10px] font-black text-white md:text-xs">
                  <span>HP</span>
                  <span>{Math.round(character.hpPercent * 10)} / 1000</span>
                </div>

                <div className="h-3 overflow-hidden rounded-full border border-black bg-gray-300 md:h-4">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${character.hpColorClass}`}
                    style={{ width: `${character.hpPercent}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-2xl border-2 border-white/70 bg-white/85 p-3 shadow-xl">
            <p className="text-2xl">⚡</p>
            <p className="font-black text-gray-900">正解で攻撃</p>
            <p className="text-xs font-bold text-gray-600">
              コスト分たまると発動
            </p>
          </div>
          <div className="rounded-2xl border-2 border-white/70 bg-white/85 p-3 shadow-xl">
            <p className="text-2xl">🔥</p>
            <p className="font-black text-gray-900">コンボ</p>
            <p className="text-xs font-bold text-gray-600">連続正解で火力UP</p>
          </div>
          <div className="rounded-2xl border-2 border-white/70 bg-white/85 p-3 shadow-xl">
            <p className="text-2xl">💥</p>
            <p className="font-black text-gray-900">会心の一撃</p>
            <p className="text-xs font-bold text-gray-600">
              大ダメージのチャンス
            </p>
          </div>
          <div className="rounded-2xl border-2 border-white/70 bg-white/85 p-3 shadow-xl">
            <p className="text-2xl">🌟</p>
            <p className="font-black text-gray-900">必殺技</p>
            <p className="text-xs font-bold text-gray-600">ゲージMAXで発動</p>
          </div>
        </div> */}

        <div className="mx-auto flex max-w-4xl flex-col justify-center gap-3 md:flex-row md:gap-4 mt-10">
          <div className="flex-1">
            <button
              onClick={handleOnlineStart}
              className="w-full rounded-full border-2 border-black bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-600 px-6 py-3 text-xl font-black text-white shadow-xl transition-transform hover:scale-105 md:px-8 md:py-4 md:text-2xl"
            >
              ⚔️ オンラインで対戦
            </button>
            <p className="mt-1 text-sm font-bold text-white">
              ※2人でプレイできます
            </p>
          </div>

          <div className="flex-1">
            <button
              onClick={() => setShowCodeInput((prev) => !prev)}
              className="w-full rounded-full border-2 border-black bg-gradient-to-r from-pink-500 via-rose-500 to-orange-400 px-6 py-3 text-xl font-black text-white shadow-xl transition-transform hover:scale-105 md:px-8 md:py-4 md:text-2xl"
            >
              🔑 あいことばで対戦
            </button>
            <p className="mt-1 text-sm font-bold text-white">
              ※友達と2人でプレイできます
            </p>
          </div>
        </div>

        {showCodeInput && (
          <div className="mx-auto mt-6 max-w-md rounded-3xl border-2 border-black bg-white p-5 shadow-2xl">
            <p className="mb-2 text-xl font-black text-gray-900">
              あいことばを入力してください
            </p>

            <input
              type="text"
              value={battleCode}
              onChange={(e) => {
                setBattleCode(e.target.value);
                setCodeError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCodeStart();
                }
              }}
              // placeholder="例：ARENA123"
              className="w-full rounded-xl border-2 border-gray-300 px-3 py-2 text-center text-lg font-bold outline-none focus:border-pink-500"
            />

            {codeError && (
              <p className="mt-2 font-bold text-red-600">{codeError}</p>
            )}

            <button
              onClick={handleCodeStart}
              className="mt-4 w-full rounded-full border-2 border-black bg-gray-900 px-4 py-2 text-lg font-black text-white shadow hover:bg-gray-700"
            >
              バトル開始
            </button>
          </div>
        )}

        <button
          onClick={() => setShowDescription((prev) => !prev)}
          className="mt-5 rounded-full border-2 border-black bg-white px-6 py-2 font-black text-gray-800 shadow-md transition-colors hover:bg-yellow-100 md:text-xl"
        >
          このゲームの説明を見る
        </button>

        <div
          className="mx-auto mt-3 max-w-3xl overflow-hidden rounded-3xl bg-white/95 shadow-xl transition-all duration-500 ease-in-out"
          style={{
            maxHeight: showDescription
              ? descriptionRef.current?.scrollHeight
              : 0,
          }}
        >
          <div
            ref={descriptionRef}
            className="px-5 py-4 text-left text-sm font-bold leading-relaxed text-gray-700 md:text-lg"
          >
            <p className="mb-2">
              「クイズアリーナ」は、ひまQのキャラで戦う2人対戦型のリアルタイムクイズバトルです。⚔
            </p>
            <p className="mb-2">
              プレイヤーのHPは1000。クイズに正解すると攻撃ゲージがたまり、キャラごとの攻撃コストに達すると自動で相手に攻撃します。🔥
            </p>
            <p className="mb-2">
              連続正解するとコンボが発生し、攻撃力がアップします。さらに、会心の一撃や必殺技で一気に逆転できるチャンスもあります。
            </p>
            <p className="mb-2">
              制限時間は1分間。先に相手のHPを0にした方が勝利です。時間切れの場合は、残りHPが多い方が勝ちになります。🏆
            </p>
            <p>
              ログイン中はガチャで手に入れたキャラを使用できます。ログインしていない場合は固定キャラでプレイできます。
            </p>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="mx-auto mt-6 w-full max-w-[900px] rounded-[28px] border border-[#e5ddd3] bg-[#f8f8f8] px-2 py-5 shadow-[0_10px_30px_rgba(0,0,0,0.08)] md:px-8 md:py-7">
            <div className="flex flex-col items-center text-center">
              <h2 className="text-xl font-extrabold tracking-tight text-gray-800 md:text-3xl">
                <span className="mr-2 text-purple-500">⚔️</span>
                アリーナ勝利数ランキング
                <span className="ml-2 text-yellow-500">🏆</span>
              </h2>

              {!userLoading && !user && (
                <>
                  <div className="mt-5 w-full max-w-[800px] rounded-[22px] border-2 border-[#efb8b8] bg-[#fff8f8] px-5 py-5 md:px-8 md:py-6">
                    <div className="flex items-center gap-4 md:gap-6">
                      <div className="shrink-0 text-3xl md:text-5xl">🔒</div>

                      <div className="text-left">
                        <p className="text-lg font-extrabold leading-tight text-red-600 md:text-2xl">
                          ランキングに載るにはログインが必要です
                        </p>
                        <p className="mt-2 text-sm font-bold leading-relaxed text-gray-800 md:text-lg">
                          オンライン対戦で勝利して、勝利数ランキング上位を目指そう！
                        </p>
                        <p className="mt-2 text-xs font-black text-red-500 md:text-sm">
                          ※オンライン対戦のみランキングに反映されます
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 w-full max-w-[800px] rounded-[22px] border border-[#d9d9d9] bg-[#fdfdfd] px-5 py-5 shadow-sm md:px-8 md:py-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="text-left">
                        <p className="text-xl font-extrabold leading-tight text-red-600 md:text-2xl">
                          ログインしていません
                        </p>
                        <p className="mt-2 text-sm font-bold text-gray-800 md:text-base">
                          ログインするとランキングに参加できます！
                        </p>
                      </div>

                      <Link href="/user/login" className="md:shrink-0">
                        <button className="w-full min-w-[200px] rounded-[18px] border-2 border-[#b85c00] bg-orange-400 px-6 py-2 text-lg font-extrabold text-white shadow-[0_3px_0_#b85c00] transition-transform hover:scale-[1.02] hover:bg-orange-500 md:w-auto md:px-8 md:py-3 md:text-2xl">
                          ログインする
                        </button>
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>

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
        </div>

        <div className="mx-auto mt-6 max-w-3xl rounded-3xl border-3 border-violet-950 bg-gradient-to-br from-violet-600 via-white to-pink-300 p-4 shadow-[0_6px_0_rgba(46,16,101,1)] md:p-5">
          <div className="text-center">
            <p className="text-xl font-black text-violet-950 drop-shadow md:text-3xl">
              お気に入りのキャラでアリーナへ！✨
            </p>

            <p className="mt-2 text-sm font-bold leading-relaxed text-violet-950/90 md:text-base">
              ひまキャラガチャで、新しいキャラをゲット！
              <br />
              クイズアリーナで自分だけのキャラを使って戦おう！
            </p>
          </div>

          <div className="mt-4 hidden justify-center gap-3 md:flex">
            <img
              src="/images/ゴブリン_2.png"
              alt=""
              className="h-24 object-contain drop-shadow-xl"
            />
            <img
              src="/images/きまぐれモンスター【勇者】.png"
              alt=""
              className="h-24 object-contain drop-shadow-xl"
            />
            <img
              src="/images/ブラックドラゴン_2.png"
              alt=""
              className="h-24 object-contain drop-shadow-xl"
            />
          </div>

          <div className="mt-4 flex justify-center gap-3 md:hidden">
            <img
              src="/images/きまぐれモンスター【勇者】.png"
              alt=""
              className="h-20 object-contain drop-shadow-xl"
            />
            <img
              src="/images/ブラックドラゴン_2.png"
              alt=""
              className="h-20 object-contain drop-shadow-xl"
            />
          </div>

          <Link
            href="/quiz-gacha"
            className="mt-4 inline-flex rounded-full border-3 border-violet-950 bg-white px-7 py-3 text-base font-black text-violet-900 shadow-[0_5px_0_rgba(46,16,101,1)] transition hover:scale-105 md:text-xl"
          >
            🎰ひまキャラガチャ
          </Link>
        </div>
      </div>
    </div>
  );
}