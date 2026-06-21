"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "../../hooks/useSupabaseUser";

type Rarity =
  | "ノーマル"
  | "レア"
  | "超レア"
  | "激レア"
  | "超激レア"
  | "神レア"
  | "シークレット";

type Character = {
  id: string;
  no: number | null;
  name: string;
  image: string;
  rarity: Rarity;
  ownedCount: number;
};

type AlchemyResult = Omit<Character, "ownedCount"> & {
  isNew: boolean;
  power: number;
};

type AlchemyPhase = "idle" | "mixing" | "flash" | "result";

const MIN_MATERIALS = 5;
const MAX_MATERIALS = 10;

const rarityText: Record<Rarity, string> = {
  ノーマル: "text-gray-500",
  レア: "text-blue-500",
  超レア: "text-purple-500",
  激レア: "text-pink-500",
  超激レア: "text-orange-500",
  神レア: "text-green-500",
  シークレット: "text-black",
};

const rarityBg: Record<Rarity, string> = {
  ノーマル: "from-gray-200 via-white to-gray-100",
  レア: "from-blue-200 via-white to-cyan-100",
  超レア: "from-purple-200 via-white to-violet-100",
  激レア: "from-pink-200 via-white to-rose-100",
  超激レア: "from-yellow-200 via-white to-orange-200",
  神レア: "from-lime-200 via-white to-green-200",
  シークレット: "from-gray-900 via-purple-900 to-black",
};

const rarityScore: Record<Rarity, number> = {
  ノーマル: 1,
  レア: 2,
  超レア: 4,
  激レア: 8,
  超激レア: 13,
  神レア: 20,
  シークレット: 30,
};

const rarityStarCount: Record<Rarity, number> = {
  ノーマル: 1,
  レア: 2,
  超レア: 3,
  激レア: 4,
  超激レア: 5,
  神レア: 6,
  シークレット: 7,
};

const normalizeImage = (imageUrl: string | null | undefined) => {
  if (!imageUrl) return "/images/きまぐれモンスター【白】.png";
  return imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
};

const getAlchemyRarities = (power: number) => {
  if (power >= 120) return ["神レア", "シークレット"] as Rarity[];
  if (power >= 85) return ["超激レア", "神レア", "シークレット"] as Rarity[];
  if (power >= 55) return ["激レア", "超激レア", "神レア", "シークレット"] as Rarity[];
  if (power >= 32) return ["超レア", "激レア", "超激レア", "神レア"] as Rarity[];
  if (power >= 18) return ["レア", "超レア", "激レア", "超激レア"] as Rarity[];
  if (power >= 10) return ["ノーマル", "レア", "超レア", "激レア"] as Rarity[];
  return ["ノーマル", "レア", "超レア"] as Rarity[];
};

const pickRandom = <T,>(items: T[]) => {
  return items[Math.floor(Math.random() * items.length)];
};

function AlchemyCharacterCard({
  item,
  large = false,
}: {
  item: Character | AlchemyResult;
  large?: boolean;
}) {
  return (
    <div
      className={`
        relative mx-auto rounded-3xl border-4 border-white shadow-2xl
        bg-gradient-to-br ${rarityBg[item.rarity]}
        ${
          large
            ? "w-[280px] p-5 md:w-[420px] md:p-8"
            : "w-[150px] p-3 md:w-[220px] md:p-4"
        }
      `}
    >
      {/* <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full border-2 border-white bg-green-500 px-3 py-1 text-xs font-black text-white shadow md:text-sm">
        錬成成功
      </div> */}

      <img
        src={item.image}
        alt={item.name}
        className={`${
          large ? "h-44 md:h-72" : "h-28 md:h-40"
        } mx-auto object-contain drop-shadow-xl`}
      />

      <div
        className={`
          mt-2 rounded-xl border-2 border-black bg-white/90 px-3 py-2
          ${large ? "text-2xl md:text-5xl" : "text-base md:text-2xl"}
          font-black leading-tight text-gray-900
        `}
      >
        {item.name}
      </div>

      <p
        className={`
          mt-2 font-black leading-tight text-center
          ${rarityText[item.rarity]}
          ${large ? "text-base md:text-2xl" : "text-xs md:text-sm"}
        `}
      >
        レアリティ：{item.rarity}
      </p>

      <p className="mt-1 text-xl font-black text-yellow-400 drop-shadow md:text-3xl text-center">
        {"★".repeat(rarityStarCount[item.rarity])}
      </p>
    </div>
  );
}

function MaterialCard({
  character,
  selectedCount,
  disabledAdd,
  onAdd,
  onRemove,
}: {
  character: Character;
  selectedCount: number;
  disabledAdd: boolean;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const isSelected = selectedCount > 0;
  const remaining = character.ownedCount - selectedCount;

  return (
    <div
      className={`
        relative flex items-center gap-3 rounded-2xl border-2 p-2 text-left shadow-sm transition
        ${
          isSelected
            ? "border-green-400 bg-lime-100 ring-2 ring-green-200"
            : "border-gray-100 bg-gray-50 hover:bg-gray-100"
        }
      `}
    >
      <div className="relative shrink-0">
        <img
          src={character.image}
          alt={character.name}
          className="h-14 w-14 rounded-xl border bg-white object-contain md:h-16 md:w-16"
        />

        {isSelected && (
          <span className="absolute -left-2 -top-2 rounded-full bg-green-500 px-2 py-0.5 text-xs font-black text-white shadow">
            {selectedCount}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black text-gray-900 md:text-base">
          {character.name}
        </p>

        <p className={`text-xs font-black ${rarityText[character.rarity]}`}>
          {character.rarity}
        </p>

        <div className="mt-1 flex flex-wrap gap-1">
          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-black text-gray-700 ring-1 ring-black/10">
            所持 {character.ownedCount}体
          </span>

          {isSelected && (
            <span className="rounded-full bg-green-500 px-2 py-0.5 text-xs font-black text-white">
              残り {remaining}体
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-1">
        <button
          type="button"
          onClick={onAdd}
          disabled={disabledAdd}
          className={`
            h-8 w-8 rounded-full border-2 border-black text-lg font-black shadow
            ${
              disabledAdd
                ? "bg-gray-200 text-gray-400"
                : "bg-green-500 text-white hover:bg-green-600"
            }
          `}
        >
          ＋
        </button>

        <button
          type="button"
          onClick={onRemove}
          disabled={selectedCount <= 0}
          className={`
            h-8 w-8 rounded-full border-2 border-black text-lg font-black shadow
            ${
              selectedCount <= 0
                ? "bg-gray-200 text-gray-400"
                : "bg-white text-gray-800 hover:bg-gray-100"
            }
          `}
        >
          －
        </button>
      </div>
    </div>
  );
}

export default function CharacterAlchemyPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { user, loading: userLoading } = useSupabaseUser();

  const [showDescription, setShowDescription] = useState(false);
  const descriptionRef = useRef<HTMLDivElement>(null);

  const [loadingCharacters, setLoadingCharacters] = useState(true);
  const [ownedCharacters, setOwnedCharacters] = useState<Character[]>([]);
  const [allCharacters, setAllCharacters] = useState<Character[]>([]);
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());

  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);
  const [history, setHistory] = useState<AlchemyResult[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<AlchemyResult | null>(null);

  const [alchemyPhase, setAlchemyPhase] = useState<AlchemyPhase>("idle");
  const [alchemyResult, setAlchemyResult] = useState<AlchemyResult | null>(null);
  const [alchemyMessage, setAlchemyMessage] = useState("");

  const materialCount = selectedMaterialIds.length;

  const selectedCountById = useMemo(() => {
    const map = new Map<string, number>();

    for (const id of selectedMaterialIds) {
      map.set(id, (map.get(id) ?? 0) + 1);
    }

    return map;
  }, [selectedMaterialIds]);

  const selectedMaterials = selectedMaterialIds
    .map((id) => ownedCharacters.find((c) => c.id === id))
    .filter((c): c is Character => !!c);

  const alchemyPower = selectedMaterials.reduce(
    (sum, c) => sum + rarityScore[c.rarity],
    0
  );

  const canAlchemy =
    materialCount >= MIN_MATERIALS &&
    materialCount <= MAX_MATERIALS &&
    alchemyPhase === "idle";

  const fetchData = async () => {
    if (!user) return;

    setLoadingCharacters(true);

    const { data: ownedRows, error: ownedError } = await supabase
      .from("user_characters")
      .select("character_id, count")
      .eq("user_id", user.id)
      .gt("count", 0)
      .order("count", { ascending: false });

    if (ownedError) {
      console.error("fetch owned characters error:", ownedError);
      setOwnedCharacters([]);
      setOwnedIds(new Set());
      setLoadingCharacters(false);
      return;
    }

    const countMap = new Map<string, number>();

    for (const row of ownedRows ?? []) {
      if (!row.character_id) continue;
      countMap.set(row.character_id, Number(row.count ?? 0));
    }

    const ownedCharacterIds = Array.from(countMap.keys());

    const { data: allRows, error: allError } = await supabase
      .from("characters")
      .select("id, no, name, image_url, rarity")
      .order("no", { ascending: true });

    if (allError) {
      console.error("fetch all characters error:", allError);
      setAllCharacters([]);
      setOwnedCharacters([]);
      setLoadingCharacters(false);
      return;
    }

    const allList: Character[] = (allRows ?? []).map((c: any) => ({
      id: c.id,
      no: c.no == null ? null : Number(c.no),
      name: c.name ?? "なぞのキャラ",
      image: normalizeImage(c.image_url),
      rarity: (c.rarity ?? "ノーマル") as Rarity,
      ownedCount: countMap.get(c.id) ?? 0,
    }));

    const ownedList = allList
      .filter((c) => ownedCharacterIds.includes(c.id))
      .sort((a, b) => {
        if (b.ownedCount !== a.ownedCount) {
          return b.ownedCount - a.ownedCount;
        }

        return (a.no ?? 999999) - (b.no ?? 999999);
      });

    setAllCharacters(allList);
    setOwnedCharacters(ownedList);
    setOwnedIds(new Set(ownedCharacterIds));
    setLoadingCharacters(false);
  };

  useEffect(() => {
    if (userLoading) return;
    if (!user) return;

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userLoading, supabase]);

  const addMaterial = (id: string) => {
    const character = ownedCharacters.find((c) => c.id === id);
    if (!character) return;

    const currentCount = selectedCountById.get(id) ?? 0;

    if (selectedMaterialIds.length >= MAX_MATERIALS) return;
    if (currentCount >= character.ownedCount) return;

    setSelectedMaterialIds((prev) => [...prev, id]);
  };

  const removeMaterial = (id: string) => {
    setSelectedMaterialIds((prev) => {
      const index = prev.lastIndexOf(id);
      if (index === -1) return prev;

      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  };

  const clearMaterials = () => {
    setSelectedMaterialIds([]);
  };

  const pickAlchemyResult = () => {
    const targetRarities = getAlchemyRarities(alchemyPower);

    let pool = allCharacters.filter((c) => targetRarities.includes(c.rarity));

    if (pool.length === 0) {
      pool = allCharacters;
    }

    return pickRandom(pool);
  };

  const consumeMaterials = async () => {
    if (!user) throw new Error("ログインが必要です");

    for (const [characterId, selectedCount] of selectedCountById.entries()) {
      const current = ownedCharacters.find((c) => c.id === characterId);
      if (!current) throw new Error("素材キャラが見つかりません");

      const nextCount = current.ownedCount - selectedCount;

      if (nextCount < 0) {
        throw new Error("素材キャラの所持数が足りません");
      }

      const { error } = await supabase
        .from("user_characters")
        .update({ count: nextCount })
        .eq("user_id", user.id)
        .eq("character_id", characterId);

      if (error) throw error;
    }
  };

  const runAlchemy = async () => {
    if (!user) {
      alert("ログインしてからキャラ錬成をしてね！");
      return;
    }

    if (!canAlchemy) {
      alert("キャラを5〜10体選んでください！");
      return;
    }

    if (allCharacters.length === 0) {
      alert("キャラ情報の読み込み中です。少し待ってからもう一度お試しください。");
      return;
    }

    setAlchemyPhase("mixing");
    setAlchemyResult(null);
    setAlchemyMessage("素材キャラをまぜまぜ中...");

    const picked = pickAlchemyResult();
    const isNew = !ownedIds.has(picked.id);

    const result: AlchemyResult = {
      id: picked.id,
      no: picked.no,
      name: picked.name,
      image: picked.image,
      rarity: picked.rarity,
      isNew,
      power: alchemyPower,
    };

    setTimeout(() => {
      setAlchemyPhase("flash");
      setAlchemyMessage("まぶしい光があふれ出した！");
    }, 1200);

    setTimeout(async () => {
      try {
        const { error: rpcError } = await supabase.rpc("alchemy_character", {
          p_material_character_ids: selectedMaterialIds,
          p_result_character_id: result.id,
        });

        if (rpcError) throw rpcError;

        window.dispatchEvent(new Event("profile:updated"));
        window.dispatchEvent(new Event("points:updated"));

        setAlchemyResult(result);
        setHistory((prev) => [result, ...prev]);
        setOwnedIds((prev) => new Set([...prev, result.id]));
        setAlchemyPhase("result");
        setAlchemyMessage(`${result.name} が誕生！`);
        setSelectedMaterialIds([]);

        fetchData();
      } catch (e: any) {
        console.error("alchemy error:", e);
        alert(e?.message ?? "錬成に失敗しました。");
        setAlchemyPhase("idle");
      }
    }, 2200);
  };

  const closeResult = () => {
    if (alchemyPhase !== "result") return;
    setAlchemyResult(null);
    setAlchemyPhase("idle");
    setAlchemyMessage("");
  };

  if (!userLoading && !user) {
    return (
      <div className="bg-gradient-to-b from-lime-200 via-green-200 to-emerald-200 px-4">
        <div className="flex items-center justify-center">
          <div className="w-full max-w-xl rounded-3xl border-4 border-green-400 bg-white/95 p-6 text-center shadow-2xl md:p-10">
            <p className="text-4xl md:text-6xl">🧪</p>

            <p className="mt-4 text-xl font-black text-gray-900 md:text-3xl">
              キャラ錬成所はログインすると遊べるよ！
            </p>

            <p className="mt-3 text-sm font-bold leading-relaxed text-gray-700 md:text-lg">
              ログインすると、持っているキャラを素材にして、
              新しいひまキャラを錬成できるようになります。
            </p>

            <div className="mt-6 flex flex-col justify-center gap-3 md:flex-row">
              <button
                onClick={() => router.push("/user/login")}
                className="rounded-xl bg-green-500 px-6 py-3 font-black text-white shadow hover:bg-green-600"
              >
                ログインして遊ぶ
              </button>

              <button
                onClick={() => router.push("/user/signup")}
                className="rounded-xl bg-lime-400 px-6 py-3 font-black text-black shadow hover:bg-lime-300"
              >
                新規登録（無料）
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (userLoading) {
    return <div className="flex items-center justify-center">読み込み中...</div>;
  }

  if (!user) return null;

  return (
    <div className="bg-gradient-to-b from-lime-200 via-green-200 to-emerald-200">
      <div className="container mx-auto px-1 md:px-4 py-2 md:py-6 text-center">
        <div className="mx-auto max-w-5xl rounded-3xl border-4 border-green-400 bg-white/75 p-2 md:p-4 shadow-2xl backdrop-blur md:p-8">
          <p className="text-3xl md:text-5xl md:text-7xl">🧪</p>

          <h1 className="mt-1 md:mt-2 text-3xl md:text-5xl font-black tracking-widest text-green-600 drop-shadow-[0_3px_0_rgba(255,255,255,1)] md:text-8xl">
            ひまキャラ錬成所
          </h1>

          <p className="mt-2 md:mt-4 text-md md:text-xl font-black text-green-700 drop-shadow md:text-3xl">
            もってるキャラを素材にして、
            <br className="md:hidden" />
            新たなひまキャラを生み出そう！✨
          </p>

          <p className="mt-2 md:mt-3 text-xs md:text-sm font-bold leading-relaxed text-emerald-700 md:text-xl">
            キャラ5〜10体を選んで錬成！
            <br />
            素材のレア度が高いほど、レアなキャラが生まれやすくなります。
          </p>

          <button
            onClick={() => setShowDescription((prev) => !prev)}
            className="mt-2 md:mt-5 rounded-full border-2 border-green-400 bg-white px-6 py-2 font-black text-gray-900 shadow hover:bg-lime-100"
          >
            説明を見る
          </button>

          <div
            className="mt-3 overflow-hidden rounded-2xl bg-white/95 transition-all duration-500"
            style={{
              maxHeight: showDescription
                ? descriptionRef.current?.scrollHeight
                : 0,
            }}
          >
            <div
              ref={descriptionRef}
              className="px-4 py-4 text-sm font-bold leading-relaxed text-gray-800 md:text-lg"
            >
              <p>
                「ひまキャラ錬成所」は、持っているキャラを5〜10体選んで、
                新しいひまキャラ1体を生み出す場所です。
              </p>

              <p>
                レア度が高いキャラを素材にするほど、
                レアなキャラが生まれやすくなります。
              </p>

              <p>
                錬成に使った素材キャラは所持数が減り、
                錬成されたキャラは新しく入手できます。
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-1 md:px-4 pb-4 md:pb-12">
        <div className="mb-3 md:mb-6 flex flex-col items-center justify-center gap-2 md:gap-4 text-center">
          <div className="mt-2 flex flex-col items-center rounded-3xl border-4 border-green-400 bg-white/80 px-2 md:px-4 py-2 md:py-5 shadow-xl">
            <p className="mb-3 text-xl font-black text-green-700 md:text-2xl">
              キャラをまぜまぜ錬成！🧪
            </p>

            <div className="hidden items-center justify-center gap-3 md:flex">
              {selectedMaterials.slice(0, 3).map((c, index) => (
                <div key={`${c.id}-${index}`} className="flex items-center gap-3">
                  {index > 0 && (
                    <span className="text-3xl font-black text-green-600">+</span>
                  )}
                  <img src={c.image} className="h-20 object-contain drop-shadow" alt="" />
                </div>
              ))}

              {selectedMaterials.length === 0 && (
                <>
                  <img src="/images/ゴブリン_1.png" className="h-20 object-contain drop-shadow opacity-60" alt="" />
                  <span className="text-3xl font-black text-green-600">+</span>
                  <img src="/images/スライム_1.png" className="h-20 object-contain drop-shadow opacity-60" alt="" />
                  <span className="text-3xl font-black text-green-600">+</span>
                  <img src="/images/ミミック_1.png" className="h-20 object-contain drop-shadow opacity-60" alt="" />
                </>
              )}

              {selectedMaterials.length > 3 && (
                <div className="rounded-full border-2 border-green-400 bg-lime-100 px-4 py-2 text-xl font-black text-green-700">
                  +{selectedMaterials.length - 3}
                </div>
              )}

              <span className="mx-2 text-4xl font-black text-green-600">→</span>
              <div className="text-6xl animate-pulse">❓</div>
            </div>

            <div className="flex items-center justify-center gap-2 md:hidden">
              {selectedMaterials.slice(0, 2).map((c, index) => (
                <div key={`${c.id}-sp-${index}`} className="flex items-center gap-2">
                  {index > 0 && (
                    <span className="text-2xl font-black text-green-600">+</span>
                  )}
                  <img src={c.image} className="h-14 object-contain drop-shadow" alt="" />
                </div>
              ))}

              {selectedMaterials.length === 0 && (
                <>
                  <img src="/images/ゴブリン_1.png" className="h-14 object-contain drop-shadow opacity-60" alt="" />
                  <span className="text-2xl font-black text-green-600">+</span>
                  <img src="/images/スライム_1.png" className="h-14 object-contain drop-shadow opacity-60" alt="" />
                </>
              )}

              {selectedMaterials.length > 2 && (
                <span className="rounded-full bg-lime-100 px-2 py-1 text-sm font-black text-green-700">
                  +{selectedMaterials.length - 2}
                </span>
              )}

              <span className="text-2xl font-black text-green-600">→</span>
              <div className="text-4xl animate-pulse">❓</div>
            </div>
          </div>

          <div className="rounded-2xl border-2 border-green-400 bg-white/90 px-6 py-3 shadow-xl">
            <p className="text-sm font-black text-gray-500">選択数</p>
            <p className="text-2xl font-black text-green-700">
              {materialCount} / {MAX_MATERIALS}体
            </p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <button
              onClick={runAlchemy}
              disabled={!canAlchemy}
              className={`
                rounded-full border-4 border-white px-8 py-4 text-xl font-black
                shadow-2xl transition-all duration-300 md:text-3xl
                ${
                  canAlchemy
                    ? "bg-gradient-to-r from-lime-400 via-green-400 to-emerald-400 text-white hover:scale-105"
                    : "cursor-not-allowed bg-gray-400 text-white opacity-60"
                }
              `}
            >
              {alchemyPhase === "idle" ? "このキャラで錬成する🧪" : "錬成中..."}
            </button>

            <button
              onClick={clearMaterials}
              disabled={selectedMaterialIds.length === 0 || alchemyPhase !== "idle"}
              className="w-[160px] md:w-auto mx-auto rounded-full border-2 border-black bg-white px-2 md:px-6 py-1 md:py-3 text-lg font-black text-gray-800 shadow hover:bg-gray-100 disabled:opacity-50"
            >
              選択をリセット
            </button>
          </div>

          {materialCount < MIN_MATERIALS && (
            <p className="text-sm font-black text-red-600 md:text-base">
              あと {MIN_MATERIALS - materialCount} 体選ぶと錬成できます
            </p>
          )}
        </div>

        <div className="mx-auto max-w-2xl rounded-3xl border-4 border-green-400 bg-white/90 p-4 shadow-2xl">
          <div className="flex items-center justify-between gap-3">
            <div className="text-left">
              <h2 className="text-xl font-black text-gray-900 md:text-2xl">
                素材キャラを選ぶ
              </h2>
              <p className="mt-1 text-xs font-bold text-gray-600 md:text-sm">
                5〜10体まで選べます
              </p>
            </div>

            <span className="rounded-full bg-lime-100 px-4 py-2 text-sm font-black text-green-700">
              {ownedCharacters.length}種類
            </span>
          </div>

          {loadingCharacters ? (
            <p className="py-8 text-center text-lg font-black text-gray-600">
              キャラ読み込み中...
            </p>
          ) : ownedCharacters.length === 0 ? (
            <p className="py-8 text-center text-lg font-black text-gray-600">
              まだ素材にできるキャラがありません
            </p>
          ) : (
            <div className="mt-4 max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {ownedCharacters.map((character) => {
                const selectedCount = selectedCountById.get(character.id) ?? 0;
                const disabledAdd =
                  selectedMaterialIds.length >= MAX_MATERIALS ||
                  selectedCount >= character.ownedCount ||
                  alchemyPhase !== "idle";

                return (
                  <MaterialCard
                    key={character.id}
                    character={character}
                    selectedCount={selectedCount}
                    disabledAdd={disabledAdd}
                    onAdd={() => addMaterial(character.id)}
                    onRemove={() => removeMaterial(character.id)}
                  />
                );
              })}
            </div>
          )}

          <p className="mt-3 text-center text-xs font-bold text-gray-500">
            ※スクロールして素材にするキャラを選べます
          </p>
        </div>

        <div className="mx-auto mt-4 md:mt-8 max-w-4xl rounded-3xl border-4 border-green-400 bg-white/90 p-4 shadow-2xl md:p-6">
          <h2 className="text-center text-2xl font-black text-gray-900 md:text-4xl">
            今回錬成されたキャラ
          </h2>

          {history.length === 0 ? (
            <p className="text-center mt-3 md:mt-6 text-xl font-bold text-gray-500 md:text-2xl">
              まだキャラを錬成していません
            </p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <div className="flex gap-4 py-4">
                {history.map((item, index) => (
                  <div
                    key={`${item.id}-${index}`}
                    className="relative shrink-0 cursor-pointer"
                    onClick={() => setSelectedHistory(item)}
                  >
                    {item.isNew && (
                      <div className="absolute -top-3 -left-2 z-10 rounded-full border-2 border-white bg-red-500 px-3 py-1 text-sm font-black text-white shadow md:text-base">
                        NEW
                      </div>
                    )}

                    <AlchemyCharacterCard item={item} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedHistory && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedHistory(null)}
          >
            <div className="fixed inset-0 -z-10 bg-black/70" />

            <motion.div
              initial={{ scale: 0.7, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.7, y: 40 }}
              transition={{ type: "spring", stiffness: 200, damping: 18 }}
              // onClick={(e) => e.stopPropagation()}
            >
              <AlchemyCharacterCard item={selectedHistory} large />

              <p className="mt-4 text-center text-lg font-black text-white drop-shadow md:text-2xl">
                No：{selectedHistory.no ?? "-"}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {alchemyPhase !== "idle" && (
          <motion.div
            className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-white px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeResult}
          >
            {alchemyPhase !== "result" && (
              <>
                <div
                  className="fixed inset-0 z-0"
                  style={{
                    background:
                      "radial-gradient(circle at 30% 30%, #d9f99d, #86efac, #34d399, #22c55e)",
                    filter: "blur(35px)",
                    opacity: 0.8,
                  }}
                />

                <motion.div
                  className="relative z-20 flex flex-col items-center"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: [0.9, 1.08, 0.9], rotate: [-2, 2, -2] }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <div className="rounded-[2rem] border-4 border-white bg-lime-100 px-6 py-5 shadow-2xl">
                    <div className="flex items-center justify-center gap-2 md:gap-4">
                      {selectedMaterials.slice(0, 5).map((c, index) => (
                        <img
                          key={`${c.id}-mix-${index}`}
                          src={c.image}
                          alt=""
                          className="h-14 object-contain drop-shadow md:h-24"
                        />
                      ))}

                      {selectedMaterials.length > 5 && (
                        <div className="rounded-full bg-green-500 px-3 py-2 text-xl font-black text-white">
                          +{selectedMaterials.length - 5}
                        </div>
                      )}
                    </div>

                    <p className="mt-4 text-3xl font-black text-green-700 md:text-5xl">
                      まぜまぜ中...🧪
                    </p>
                  </div>
                </motion.div>

                {alchemyPhase === "flash" && (
                  <motion.div
                    className="fixed inset-0 z-30 bg-white"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0.2, 1, 0] }}
                    transition={{ duration: 1 }}
                  />
                )}

                <p className="relative z-40 mt-5 text-xl font-black text-white drop-shadow md:text-3xl">
                  {alchemyMessage}
                </p>
              </>
            )}

            {alchemyPhase === "result" && alchemyResult && (
              <>
                <div
                  className="fixed inset-0 z-0"
                  style={{
                    background:
                      "radial-gradient(circle at 30% 30%, #d9f99d, #86efac, #34d399, #22c55e)",
                    filter: "blur(35px)",
                    opacity: 0.7,
                  }}
                />

                <motion.div
                  className="relative z-40 text-center"
                  initial={{ opacity: 0, scale: 0.35, y: 80 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.55, ease: "easeOut" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {alchemyResult.isNew && (
                    <div className="absolute -top-8 left-2 z-20 rounded-full border-4 border-white bg-gradient-to-r from-red-500 via-pink-500 to-yellow-400 px-5 py-2 text-2xl font-black text-white shadow-xl md:text-4xl">
                      NEW
                    </div>
                  )}

                  <AlchemyCharacterCard item={alchemyResult} large />

                  <p className="mt-2 text-3xl font-black text-white drop-shadow md:text-6xl">
                    錬成成功！
                  </p>

                  <p className="mt-2 text-2xl font-black text-white drop-shadow md:text-5xl">
                    {alchemyResult.name} が誕生した！✨
                  </p>

                  <button
                    onClick={closeResult}
                    className="mt-6 rounded-full border-2 border-black bg-white px-8 py-3 text-xl font-black text-green-700 shadow-xl hover:bg-lime-100"
                  >
                    閉じる
                  </button>
                </motion.div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}