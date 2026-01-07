"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { useSupabaseUser } from "../../../hooks/useSupabaseUser";
import { motion, AnimatePresence } from "framer-motion";

type Character = {
  id: string;
  name: string;
  image_url: string | null;
  rarity: string | null;
  no: string | null;
  description: string | null;
};

type CharacterWithOwned = Character & {
  owned: boolean;
  ownedCount: number;
};

const HATENA_IMAGE = "/images/hatena_card.png";

// レアリティごとの星の数
const rarityToStarCount: Record<string, number> = {
  "ノーマル": 1,
  "レア": 2,
  "超レア": 3,
  "激レア": 4,
  "超激レア": 5,
  "神レア": 6,
  "シークレット": 7,
};

// レアリティごとのグラデーション（モーダル背景用）
const rarityGradient: Record<string, string> = {
  "ノーマル": "from-gray-400 via-gray-300 to-gray-200",
  "レア": "from-blue-400 via-blue-300 to-blue-200",
  "超レア": "from-purple-500 via-purple-400 to-purple-300",
  "激レア": "from-pink-500 via-rose-400 to-red-300",
  "超激レア": "from-yellow-400 via-orange-400 to-red-400",
  "神レア": "from-green-400 via-emerald-400 to-teal-300",
  "シークレット": "from-black via-gray-700 to-purple-700",
};

// レアリティごとの文字色
const rarityText: Record<string, string> = {
  "ノーマル": "text-white",
  "レア": "text-white",
  "超レア": "text-white",
  "激レア": "text-white",
  "超激レア": "text-white",
  "神レア": "text-white",
  "シークレット": "text-white",
};

export default function MyCharactersPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { user, loading: userLoading } = useSupabaseUser();
  const router = useRouter();

  const [characters, setCharacters] = useState<CharacterWithOwned[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // モーダル用：選択されたキャラ
  const [selectedCharacter, setSelectedCharacter] =
    useState<CharacterWithOwned | null>(null);

  useEffect(() => {
    if (userLoading) return;

    if (!user) {
      router.push("/user/login");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // ① 全キャラを取得
        const { data: allCharacters, error: charError } = await supabase
          .from("characters")
          .select("id, name, image_url, rarity, no, description");

        if (charError) {
          console.error("characters fetch error:", charError);
          setError("キャラ一覧の取得に失敗しました。時間をおいて再度お試しください。");
          setLoading(false);
          return;
        }

        if (!allCharacters) {
          setCharacters([]);
          setLoading(false);
          return;
        }

        // ② 自分が当てたキャラID一覧を取得
        const { data: ownedRows, error: ownedError } = await supabase
          .from("user_characters")
          .select("character_id, count")
          .eq("user_id", user.id);

        if (ownedError) {
          console.error("user_characters fetch error:", ownedError);
          setError("マイキャラ情報の取得に失敗しました。");
          setLoading(false);
          return;
        }

        const ownedMap = new Map<string, number>(
          (ownedRows ?? []).map((row: { character_id: string; count: number }) => [
            row.character_id,
            row.count ?? 1,
          ])
        );

        // ③ 所持フラグを付けてマージ
        const merged: CharacterWithOwned[] = (allCharacters as Character[]).map((c) => {
          const cnt = ownedMap.get(c.id) ?? 0;
          return {
            ...c,
            owned: cnt > 0,
            ownedCount: cnt,
          };
        });

        // ④ No順でソート
        merged.sort((a, b) => {
          const na = a.no ? parseInt(a.no, 10) : 9999;
          const nb = b.no ? parseInt(b.no, 10) : 9999;
          return na - nb;
        });

        setCharacters(merged);
      } catch (err) {
        console.error("my characters page error:", err);
        setError("データ取得中にエラーが発生しました。");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, userLoading, supabase, router]);

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-center text-lg md:text-2xl">読み込み中...</p>
      </div>
    );
  }

  if (!user) return null;

  const isOwnedSelected = !!selectedCharacter?.owned;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-10 bg-gradient-to-r from-pink-300 via-purple-200 via-blue-200 to-green-300 rounded-xl">
      {/* タイトル */}
      <div className="text-center mb-6 md:mb-10">
        <h1
          className="
            text-3xl md:text-5xl font-extrabold tracking-wide
            drop-shadow-[0_4px_0_rgba(255,255,255,0.8)]
            text-transparent bg-clip-text
            bg-black
          "
        >
          マイキャラ図鑑
        </h1>
        <p className="mt-2 md:mt-3 text-sm md:text-lg text-gray-700 drop-shadow-sm">
          ガチャで当てたキャラがここにコレクションされていくよ！
        </p>
      </div>

      {/* エラー表示 */}
      {error && (
        <p className="text-center text-red-500 mb-4 whitespace-pre-line">
          {error}
        </p>
      )}

      {/* ローディング表示 */}
      {loading && (
        <div className="flex items-center justify-center min-h-[40vh]">
          <p className="text-center text-lg md:text-2xl">図鑑を読み込み中...</p>
        </div>
      )}

      {/* 中身 */}
      {!loading && !error && (
        <>
          {characters.length === 0 ? (
            <p className="text-center text-gray-500">
              まだキャラが登録されていません。
            </p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 md:gap-6">
              {characters.map((ch) => {
                const isOwned = ch.owned;
                const imgSrc = isOwned
                  ? ch.image_url
                    ? ch.image_url.startsWith("/")
                      ? ch.image_url
                      : `/${ch.image_url}`
                    : HATENA_IMAGE
                  : HATENA_IMAGE;

                const starCount =
                  ch.rarity && rarityToStarCount[ch.rarity]
                    ? rarityToStarCount[ch.rarity]
                    : 0;

                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => setSelectedCharacter(ch)} // ← 未所持でも開く
                    className={`
                      flex flex-col items-center justify-between
                      bg-white border border-gray-300 rounded-lg shadow-sm
                      p-2 md:p-3
                      transition-transform transition-shadow duration-150
                      ${
                        isOwned
                          ? "hover:scale-105 hover:shadow-lg cursor-pointer"
                          : "opacity-70 cursor-pointer"
                      }
                    `}
                  >
                    {/* No. */}
                    <p className="text-[10px] md:text-xs text-gray-500 mb-1">
                      No.{ch.no ?? "??"}
                    </p>

                    {/* 画像部分 */}
                    <div className="w-full aspect-square flex items-center justify-center mb-1 md:mb-2">
                      <img
                        src={imgSrc}
                        alt={isOwned ? ch.name : "？？？"}
                        className={`
                          w-full h-full object-contain
                          ${!isOwned ? "grayscale" : ""}
                        `}
                      />
                    </div>

                    {/* 名前・レアリティ・星 */}
                    <div className="text-center mt-1 md:mt-2">
                      <p className="text-[10px] md:text-sm font-bold truncate max-w-[80px] md:max-w-[120px]">
                        {isOwned ? ch.name : "？？？？？？"}
                      </p>
                      {isOwned && (
                        <p className="text-[10px] md:text-xs mt-0.5 font-extrabold text-gray-700">
                          {ch.rarity ?? ""}
                        </p>
                      )}
                      {isOwned && starCount > 0 && (
                        <p className="text-[10px] md:text-xs text-yellow-400 mt-0.5">
                          {"★".repeat(starCount)}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* --- モーダル（拡大表示） --- */}
          <AnimatePresence>
            {selectedCharacter && (
              <motion.div
                className="fixed inset-0 flex items-center justify-center z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedCharacter(null)}
              >
                {/* 背景 */}
                {isOwnedSelected ? (
                  <>
                    {/* カラフルもわもわ（所持キャラのとき） */}
                    <div className="fixed inset-0 -z-10">
                      <div
                        style={{
                          background:
                            "radial-gradient(circle at 30% 30%, #ff00ff, #00ffff, #ffff00, #ff0000)",
                          filter: "blur(120px)",
                          opacity: 0.6,
                          width: "100%",
                          height: "100%",
                        }}
                      />
                    </div>

                    {/* ✨ キラキラ粒子 */}
                    {Array.from({ length: 30 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="fixed z-40 w-4 h-4 rounded-full bg-white"
                        style={{
                          top: `${Math.random() * 100}%`,
                          left: `${Math.random() * 100}%`,
                          opacity: 0.6,
                          filter: "blur(4px)",
                        }}
                        animate={{ y: [-10, 10] }}
                        transition={{
                          duration: 1 + Math.random(),
                          repeat: Infinity,
                          repeatType: "reverse",
                        }}
                      />
                    ))}
                  </>
                ) : (
                  // 未所持キャラのときはシンプルにうっすら暗くするだけ
                  <div className="fixed inset-0 bg-black/40 -z-10" />
                )}

                {/* モーダル本体 */}
                <motion.div
                  className={`
                    relative z-50 bg-white p-6 rounded-2xl flex flex-col items-center
                    shadow-2xl
                    w-80 md:w-[420px]
                    ${
                      isOwnedSelected &&
                      selectedCharacter.rarity &&
                      rarityGradient[selectedCharacter.rarity]
                        ? `bg-gradient-to-r ${rarityGradient[selectedCharacter.rarity]}`
                        : "bg-white"
                    }
                  `}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* No */}
                  <p className="text-lg md:text-2xl text-gray-700 mb-1 md:mb-2">
                    No：{selectedCharacter.no ?? "??"}
                  </p>
                  {/* 画像 */}
                  <img
                    src={
                      isOwnedSelected && selectedCharacter.image_url
                        ? selectedCharacter.image_url.startsWith("/")
                          ? selectedCharacter.image_url
                          : `/${selectedCharacter.image_url}`
                        : HATENA_IMAGE
                    }
                    className="w-40 h-40 md:w-64 md:h-64 rounded mb-4 drop-shadow-lg"
                    alt={isOwnedSelected ? selectedCharacter.name : "？？？？？？"}
                  />
                  {/* 名前 */}
                  <p
                    className={`
                      text-3xl md:text-5xl font-bold mt-1 md:mt-2 drop-shadow
                      ${isOwnedSelected ? "text-white" : "text-gray-800"}
                    `}
                  >
                    {isOwnedSelected ? selectedCharacter.name : "？？？？？？"}
                  </p>
                  {/* 説明文（キャラ名の下） */}
                  {isOwnedSelected && (
                    <p
                      className={`
                        mt-3 md:mt-4 text-sm md:text-base text-center whitespace-pre-line drop-shadow
                        text-white
                      `}
                    >
                      {selectedCharacter.description ?? "（説明文がまだありません）"}
                    </p>
                  )}
                  {/* レアリティ */}
                  <p
                    className={`
                      text-xl md:text-3xl font-extrabold mt-3 md:mt-5 drop-shadow
                      ${isOwnedSelected ? "text-gray-100" : "text-gray-700"}
                    `}
                  >
                    レアリティ：
                    <span
                      className={`text-xl md:text-3xl font-bold ${
                        isOwnedSelected &&
                        selectedCharacter.rarity &&
                        rarityText[selectedCharacter.rarity]
                          ? rarityText[selectedCharacter.rarity]
                          : ""
                      }`}
                    >
                      {isOwnedSelected ? selectedCharacter.rarity : "？？？"}
                    </span>
                  </p>
                  {/* 星（所持キャラだけ） */}
                  {isOwnedSelected && (
                    <p className="text-yellow-300 text-2xl md:text-4xl font-extrabold mt-1 md:mt-3 drop-shadow">
                      {"★".repeat(
                        selectedCharacter.rarity &&
                        rarityToStarCount[selectedCharacter.rarity]
                          ? rarityToStarCount[selectedCharacter.rarity]
                          : 1
                      )}
                    </p>
                  )}

                  {/* 当たった回数（★の下） */}
                  {isOwnedSelected && (
                    <p className="mt-3 md:mt-4 text-sm md:text-base font-bold text-white drop-shadow bg-gray-700 p-2 rounded-full">
                      当たった数：{selectedCharacter.ownedCount}
                    </p>
                  )}

                  {/* 未所持用の一言メッセージ */}
                  {!isOwnedSelected && (
                    <p className="mt-3 md:mt-4 text-sm md:text-base text-gray-700 text-center">
                      まだ出会っていないキャラだよ…！<br />
                      ガチャでゲットして正体をあばこう！
                    </p>
                  )}

                  <button
                    className="mt-4 md:mt-6 px-6 py-2 md:py-3 bg-blue-500 text-white rounded-lg font-bold shadow-md hover:bg-blue-600 cursor-pointer"
                    onClick={() => setSelectedCharacter(null)}
                  >
                    閉じる
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
