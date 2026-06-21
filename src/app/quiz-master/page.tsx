"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Anton } from "next/font/google";
import DungeonRankingTop10 from "@/app/components/DungeonRankingTop10";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "../../hooks/useSupabaseUser"; 

const anton = Anton({ subsets: ["latin"], weight: "400" });

type DungeonRankRow = {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  best_stage: number;
};

export default function QuizMasterPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { user, loading: userLoading } = useSupabaseUser();

  const [showGenreButtons, setShowGenreButtons] = useState(false);
  const [showDescription, setShowDescription] = useState(false);

  const [dungeonTop10, setDungeonTop10] = useState<DungeonRankRow[]>([]);
  const [rankLoading, setRankLoading] = useState(true);

  const handleGenreClick = () => {
    setShowGenreButtons(true);
  };
  const handleDescriptionClick = () => setShowDescription((prev) => !prev);

  // ★ PC用キャラ（全6枚）
  const allCharacters = [
    "/images/dragon.png",
    "/images/yuusya_game.png",
    "/images/mimic.png",
  ];

  const secretBosses = [
    { id: "ancient_dragon", no: "89", name: "エンシェントドラゴン", requiredLevel: 10 },
    { id: "dark_knight", no: "91", name: "ダークナイト", requiredLevel: 15 },
    { id: "susanoo", no: "93", name: "スサノオ", requiredLevel: 20 },
    { id: "takemikazuchi", no: "95", name: "タケミカヅチ", requiredLevel: 25 },
    { id: "ultimate_dragon", no: "97", name: "アルティメットドラゴン", requiredLevel: 30 },
    { id: "fujin", no: "99", name: "風神", requiredLevel: 35 },
    { id: "raijin", no: "101", name: "雷神", requiredLevel: 35 },
    { id: "quiz_demon_king", no: "103", name: "クイズ大魔王", requiredLevel: 40 },
    { id: "quiz_emperor", no: "105", name: "クイズ帝王", requiredLevel: 50 },
  ] as const;

  const [userLevel, setUserLevel] = useState<number>(0);
  const [levelLoading, setLevelLoading] = useState(false);
  const [ownedBossNos, setOwnedBossNos] = useState<Set<string>>(new Set()); // クリア表示用（所持してたらtrue）
  const [ownedUnlockNos, setOwnedUnlockNos] = useState<Set<string>>(new Set()); // 解放条件用（normal/fairyどちらか所持）
  const [ownedLoading, setOwnedLoading] = useState(false);
  const normalizeBossNo = (no: string) => {
    const n = Number(no);
    return String(n % 2 === 0 ? n - 1 : n);
  };

  useEffect(() => {
    const fetchLevel = async () => {
      if (!user) {
        setUserLevel(0);
        return;
      }
      setLevelLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("level")
          .eq("id", user.id)
          .single();

        if (error) throw error;
        setUserLevel(Number(data?.level ?? 0));
      } catch (e) {
        console.error("failed to load user level:", e);
        setUserLevel(0);
      } finally {
        setLevelLoading(false);
      }
    };

    const fetchOwnedBosses = async () => {
      if (!user) {
        setOwnedBossNos(new Set());
        setOwnedUnlockNos(new Set());
        return;
      }
      setOwnedLoading(true);

      try {
        const bossNos = secretBosses.flatMap((b) => {
          const base = Number(b.no);
          return [String(base), String(base + 1)]; // 例: 91 と 92
        });

        // ① characters から no→id を取得
        const { data: chars, error: charErr } = await supabase
          .from("characters")
          .select("id, no")
          .in("no", bossNos);

        if (charErr) throw charErr;

        const noToId = new Map<string, string>();
        for (const c of chars ?? []) {
          noToId.set(String(c.no), String(c.id));
        }

        const bossCharIds = bossNos
          .map((no) => noToId.get(no))
          .filter((v): v is string => Boolean(v));

        if (bossCharIds.length === 0) {
          setOwnedBossNos(new Set());
          setOwnedUnlockNos(new Set());
          return;
        }

        // ② user_characters を character_id(id) でまとめて取得
        //    ※ 解放条件は normal/fairy を持ってたらOK
        const { data: ownedRows, error: ownedErr } = await supabase
          .from("user_characters")
          .select("character_id")
          .eq("user_id", user.id)
          .in("character_id", bossCharIds);

        if (ownedErr) throw ownedErr;

        // ③ character_id → no に戻して Set を作る
        const idToNo = new Map<string, string>();
        for (const [no, id] of noToId.entries()) idToNo.set(id, no);

        const ownedAnyNo = new Set<string>();
        const ownedUnlockNo = new Set<string>();

        for (const r of ownedRows ?? []) {
          const no = idToNo.get(String(r.character_id));
          if (!no) continue;

          const groupNo = normalizeBossNo(no);

          ownedAnyNo.add(groupNo);
          ownedUnlockNo.add(groupNo);
        }

        setOwnedBossNos(ownedAnyNo);
        setOwnedUnlockNos(ownedUnlockNo);
      } catch (e) {
        console.error("failed to load owned bosses:", e);
        setOwnedBossNos(new Set());
        setOwnedUnlockNos(new Set());
      } finally {
        setOwnedLoading(false);
      }
    };

    fetchLevel();
    fetchOwnedBosses();
  }, [user, supabase]);

  const bossProgress = secretBosses.map((b, i) => {
    const prev = secretBosses[i - 1];

    const hasPrevOwned =
      i === 0 ? true : ownedUnlockNos.has(normalizeBossNo(String(prev.no)));
    const levelOk = userLevel >= b.requiredLevel;

    const canSee = levelOk && hasPrevOwned;
    const isCleared = ownedBossNos.has(normalizeBossNo(String(b.no)));

    return { ...b, i, levelOk, hasPrevOwned, canSee, isCleared, prevName: prev?.name ?? null, };
  });

  // 「表示するのは、解放済み全部 + 次の未解放1つ」
  const showBosses = (() => {
    const unlocked = bossProgress.filter((x) => x.canSee);
    const firstLocked = bossProgress.find((x) => !x.canSee);
    return [...unlocked, ...(firstLocked ? [firstLocked] : [])];
  })();


  // ★ スマホ専用キャラ（2枚だけ）
  const mobileCharacters = [
    "/images/dragon.png",
    "/images/yuusya_game.png",
  ];

  // ★ 画面サイズで表示画像を切り替え
  const [characters, setCharacters] = useState<string[]>([]);

  useEffect(() => {
    const isMobile = window.innerWidth < 768; // md未満
    setCharacters(isMobile ? mobileCharacters : allCharacters);
  }, []);

  // ★ アニメーション用
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    characters.forEach((_, index) => {
      setTimeout(() => {
        setVisibleCount((v) => v + 1);
      }, index * 300);
    });
  }, [characters]); // ← charactersが決まってから実行

  useEffect(() => {
    const fetchDungeonRanking = async () => {
      setRankLoading(true);
      try {
        const res = await fetch("/api/rankings/dungeon", { cache: "no-store" });
        const data = (await res.json()) as DungeonRankRow[];
        setDungeonTop10(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("ランキング取得失敗:", e);
        setDungeonTop10([]);
      } finally {
        setRankLoading(false);
      }
    };

    fetchDungeonRanking();
  }, []);

  // アコーディオン用 ref
  const descriptionRef = useRef<HTMLParagraphElement>(null);

  return (
    <div className="container mx-auto px-4 py-8 text-center bg-gradient-to-b from-purple-100 via-purple-200 to-purple-300">
      <h1
        className="text-5xl md:text-7xl font-extrabold mb-6 text-center"
        style={{
          color: "#a78bfa",
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
            0 0 10px #aa00ff
          `,
          fontFamily: anton.style.fontFamily,
        }}
      >
        {/* 📱スマホ（改行あり） */}
        <span className="block md:hidden leading-tight">
          クイズ<br />ダンジョン
        </span>

        {/* 💻PC（1行） */}
        <span className="hidden md:block">
          クイズダンジョン
        </span>
      </h1>

      <>
        <p className="text-md md:text-2xl font-semibold text-gray-800 mb-2 md:mb-4">
          ＜1人で遊べるクイズゲーム＞
        </p>
        <p className="text-md md:text-2xl font-semibold text-gray-800 mb-8">
          クイズで進む冒険ダンジョン！君はどこまで到達できる？最強の称号「クイズマスター」を手に入れろ！
        </p>

        {/* ★ スマホは2枚、PCは6枚を順番に登場 */}
        <div className="flex justify-center md:gap-4 mb-8">
          {characters.map((src, index) => (
            <img
              key={index}
              src={src}
              alt={`キャラ${index}`}
              className={`
                ${visibleCount > index ? "character-animate" : "opacity-0"}
                w-30 h-30 md:w-50 md:h-52 object-cover rounded-lg
              `}
              style={{ animationDelay: `${index * 0.1}s` }}
            />
          ))}
        </div>

        <div className="flex flex-col md:flex-row justify-center gap-3 md:gap-4 max-w-4xl mx-auto">
          <Link href="/quiz-master/random" className="flex-1">
            <button className="w-full md:w-80 px-6 py-2 md:px-8 md:py-4 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-white rounded-full hover:bg-blue-600 cursor-pointer text-lg md:text-2xl font-semibold shadow-lg transition-transform hover:scale-105 border-2 border-black">
              ゲームスタート
            </button>
          </Link>
          {/* <Link href="/quiz-master/random" className="flex-1">
            <button className="w-full md:w-110 px-6 py-2 md:px-8 md:py-4 bg-blue-500 text-white rounded-full hover:bg-blue-600 cursor-pointer text-lg md:text-2xl font-semibold shadow-lg transition-transform hover:scale-105 border-2 border-black">
              全てのクイズから出題
            </button>
          </Link>

          <button
            className="flex-1 w-full px-6 py-2 md:px-8 md:py-4 bg-green-500 text-white rounded-full hover:bg-green-600 cursor-pointer text-lg md:text-2xl font-semibold shadow-lg transition-transform hover:scale-105 border-2 border-black"
            onClick={() => setShowGenreButtons((prev) => !prev)}
          >
            ジャンルを選んで出題
          </button> */}
        </div>
        {showGenreButtons && (
          <div className="flex flex-col justify-center items-center mt-3 md:mt-5">
            <div className="mb-2 md:mb-3 text-lg md:text-2xl">
              <p>ジャンルを選んでください</p>
            </div>
            <div className="flex justify-center gap-3">
              <Link href="/quiz-master/genre?genre=知識系">
                <button className="px-4 py-2 md:px-6 md:py-3 bg-gradient-to-br from-sky-100 via-sky-300 to-teal-100 border-2 border-black text-lg md:text-xl font-bold text-black rounded-full hover:bg-purple-600 cursor-pointer shadow-lg">
                  知識系
                </button>
              </Link>
              <Link href="/quiz-master/genre?genre=心理系">
                <button className="px-4 py-2 md:px-6 md:py-3 bg-gradient-to-br from-pink-100 via-pink-300 to-purple-100 border-2 border-black text-lg md:text-xl font-bold text-black rounded-full hover:bg-pink-600 cursor-pointer shadow-lg">
                  心理系
                </button>
              </Link>
              <Link href="/quiz-master/genre?genre=雑学系">
                <button className="px-4 py-2 md:px-6 md:py-3 bg-gradient-to-br from-yellow-100 via-green-300 to-green-100 border-2 border-black text-lg md:text-xl font-bold text-black rounded-full hover:bg-yellow-600 cursor-pointer shadow-lg">
                  雑学系
                </button>
              </Link>
            </div>
          </div>
        )}

        {/* 説明ボタン */}
        <button
          onClick={handleDescriptionClick}
          className="mt-4 px-6 py-1 md:px-8 md:text-xl bg-white text-gray-800 rounded-full border-2 border-black hover:bg-gray-300 shadow-md transition-colors"
        >
          このゲームの説明を見る
        </button>

        {/* アコーディオン説明文 */}
        <div
          className={`overflow-hidden transition-all duration-500 ease-in-out mt-2 rounded-xl bg-white`}
          style={{
            maxHeight: showDescription
              ? descriptionRef.current?.scrollHeight
              : 0,
          }}
        >
          <p
            ref={descriptionRef}
            className="text-gray-700 text-md md:text-lg text-center px-4 py-2"
          >
            「クイズダンジョン」は、クイズを解きながらダンジョンを進んでいく冒険クイズゲームです。<br />
            クイズに正解すれば敵に攻撃できますが、間違えるとあなたのHP（ライフ）が減ってしまいます。<br />
            HPが0になるとゲームオーバー。<br />
            敵を倒すごとにステージが進み、あなたのランク（称号）もどんどん昇格していきます。<br />
            運が良ければ、めったに入手できないレアアイテムを発見できることも…！？<br />
            最終称号 「クイズマスター」を手に入れて、ダンジョン制覇を目指しましょう！
          </p>
        </div>

        {/* ✅ シークレットステージ */}
        {user && (
          <div className="mt-6 max-w-4xl mx-auto">
            <div
              className="relative overflow-hidden border-2 border-black rounded-2xl p-4 shadow
              bg-gradient-to-br from-[#f6f1ff] via-[#efe7ff] to-[#fff4d6]"
  >
              <div className="relative">
                <p className="text-2xl md:text-3xl font-extrabold text-gray-900">
                  🔒 シークレットステージ
                </p>

                {userLoading ? (
                  <p className="mt-2 text-gray-600 font-bold">判定中...</p>
                ) : user ? (
                  <>
                    <p className="text-md md:text-lg mt-2 text-gray-800 font-bold">
                      挑戦するステージを選んでください
                    </p>

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {showBosses.map((b) => {
                        const isUnlocked = b.canSee;

                        return (
                          <div
                            key={String(b.no)}
                            className="relative overflow-hidden rounded-xl p-4 shadow flex flex-col gap-3
                            bg-gradient-to-br from-[#fff7cc] via-[#f7d774] to-[#d4a017]"
                          >
                            {isUnlocked ? (
                              <p className="text-sm md:text-md font-extrabold text-gray-700">
                                {/* 条件：ユーザーレベル {b.requiredLevel} 以上 */}
                              </p>
                            ) : (
                              <p className="text-sm md:text-md font-extrabold text-gray-700">
                                🔒 ユーザーレベル {b.requiredLevel} 以上 {b.prevName ? ` + ${b.prevName}討伐` : ""} で解放
                              </p>
                            )}

                            <p className="text-xl md:text-2xl font-extrabold text-gray-900">
                              {isUnlocked ? `${b.name} の領域⚔` : "？？？ の領域⚔"}
                            </p>

                            {isUnlocked ? (
                              <div className="flex gap-2">
                                <Link
                                  href={`/quiz-master/random?course=secret&boss=${encodeURIComponent(
                                    String(b.id)
                                  )}&variant=normal`}
                                  className="flex-1"
                                >
                                  <button className="w-full px-4 py-2 bg-white text-gray-900 rounded-lg border-2 border-black font-extrabold hover:bg-gray-100 cursor-pointer">
                                    通常に挑戦🔥
                                  </button>
                                </Link>

                                <Link
                                  href={`/quiz-master/random?course=secret&boss=${encodeURIComponent(
                                    String(b.id)
                                  )}&variant=fairy`}
                                  className="flex-1"
                                >
                                  <button className="w-full px-4 py-2 bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white rounded-lg border-2 border-black font-extrabold hover:opacity-90 cursor-pointer">
                                    フェアリーに挑戦🔥
                                  </button>
                                </Link>
                              </div>
                            ) : (
                              <button
                                disabled
                                className="w-full px-4 py-2 rounded-lg border-2 border-black font-extrabold
                                          bg-black/30 text-white/60 cursor-not-allowed"
                              >
                                まだ挑戦できません
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="mt-3 text-gray-800 font-bold">
                      このステージはログイン（無料）すると遊べます！
                    </p>
                    <button
                      onClick={() => router.push("/user/login")}
                      className="mt-3 px-6 py-3 bg-blue-500 text-white rounded-xl font-extrabold hover:bg-blue-600 cursor-pointer"
                    >
                      ログインして遊ぶ
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-center">
          <div className="mt-3 w-full max-w-[900px] rounded-[28px] border border-[#e5ddd3] bg-[#f8f8f8] px-2 py-5 md:px-8 md:py-7 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
            <div className="flex flex-col items-center text-center">
              <h2 className="text-xl md:text-3xl font-extrabold text-gray-800 tracking-tight">
                <span className="mr-2 text-yellow-500">👑</span>
                全国ランキングをチェック！
                <span className="ml-2 text-yellow-500">✨</span>
              </h2>

              {!userLoading && !user && (
                <>
                  <div className="mt-5 w-full max-w-[800px] rounded-[22px] border-2 border-[#efb8b8] bg-[#fff8f8] px-5 py-5 md:px-8 md:py-6">
                    <div className="flex items-center gap-4 md:gap-6">
                      <div className="shrink-0 text-3xl md:text-5xl">🔒</div>

                      <div className="text-left">
                        <p className="text-lg md:text-2xl font-extrabold text-red-600 leading-tight">
                          ランキングに載るにはログインが必要です
                        </p>
                        <p className="mt-2 text-sm md:text-lg font-bold text-gray-800 leading-relaxed">
                          あなたの記録をランキングに残して、全国のユーザーと競い合おう！
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 w-full max-w-[800px] rounded-[22px] border border-[#d9d9d9] bg-[#fdfdfd] px-5 py-5 md:px-8 md:py-6 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="text-left">
                        <p className="text-xl md:text-2xl font-extrabold text-red-600 leading-tight">
                          ログインしていません
                        </p>
                        <p className="mt-2 text-sm md:text-base font-bold text-gray-800">
                          ログインするとランキングに参加できます！
                        </p>
                      </div>

                      <Link href="/user/login" className="md:shrink-0">
                        <button className="w-full md:w-auto min-w-[200px] px-6 py-2 md:px-8 md:py-3 bg-orange-400 hover:bg-orange-500 text-white rounded-[18px] font-extrabold text-lg md:text-2xl border-2 border-[#b85c00] shadow-[0_3px_0_#b85c00] transition-transform hover:scale-[1.02] cursor-pointer">
                          ログインする
                        </button>
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
            {rankLoading ? (
              <p className="py-6 text-center text-base md:text-lg font-bold text-gray-600">
                ランキング読み込み中...
              </p>
            ) : dungeonTop10.length > 0 ? (
              <DungeonRankingTop10 rows={dungeonTop10} />
            ) : (
              <p className="py-6 text-center text-base md:text-lg font-bold text-gray-600">
                まだランキングがありません
              </p>
            )}
          </div>
        </div>
      </>
    </div>
  );
}
