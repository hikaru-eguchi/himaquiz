"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import QuizQuestion from "../../components/QuizQuestion";
import { QuizData } from "@/lib/articles";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "../../../hooks/useSupabaseUser";
import { submitGameResult, calcTitle } from "@/lib/gameResults";
import { buildResultModalPayload } from "@/lib/resultMessages";
import { useResultModal } from "../../components/ResultModalProvider";
import { CharacterAcquireModal, type CharacterItem } from "../../components/CharacterAcquireModal";
import { getWeekStartJST } from "@/lib/week";
import { getMonthStartJST } from "@/lib/month";
import { openXShare, buildTopUrl } from "@/lib/shareX";
import type { Rarity } from "@/types/gacha";
import DungeonRankingTop10 from "../../components/DungeonRankingTop10";
import RecommendedSoloGames from "@/app/components/RecommendedSoloGames";

// =====================
// ポイント仕様（ステージ到達に応じて付与）
// =====================
const stagePointMap: Record<number, number> = {
  1: 5,
  2: 10,
  3: 25,
  4: 50,
  5: 75,
  6: 100,
  7: 150,
  8: 200,
  9: 300,
  10: 400,
  11: 500,
  12: 600,
  13: 700,
  14: 800,
  15: 900,
  16: 1200,
  17: 1500,
  18: 2000,
  19: 3000,
  20: 4000,
  21: 5000,
  22: 6000,
  23: 6000,
};

const RARITIES: Rarity[] = [
  "ノーマル",
  "レア",
  "超レア",
  "激レア",
  "超激レア",
  "神レア",
  "シークレット",
];

const isRarity = (v: unknown): v is Rarity =>
  typeof v === "string" && RARITIES.includes(v as Rarity);

// シークレットステージ専用：敵ごとの報酬
const secretRewardMap: Record<
  "normal" | "fairy",
  Record<string, { points: number; exp: number }>
> = {
  normal: {
    ancient_dragon: { points: 200, exp: 100 },
    dark_knight:    { points: 400, exp: 200 },
    susanoo:        { points: 600, exp: 300 },
    takemikazuchi:  { points: 800, exp: 400 },
    ultimate_dragon:{ points: 1000, exp: 500 },
    fujin:          { points: 1200, exp: 600 },
    raijin:         { points: 1200, exp: 600 },
    quiz_demon_king:{ points: 1600, exp: 800 },
    quiz_emperor:   { points: 2000, exp: 1000 },
  },
  fairy: {
    ancient_dragon: { points: 300, exp: 150 },
    dark_knight:    { points: 600, exp: 300 },
    susanoo:        { points: 900, exp: 450 },
    takemikazuchi:  { points: 1200, exp: 600 },
    ultimate_dragon:{ points: 1500, exp: 750 },
    fujin:          { points: 1800, exp: 900 },
    raijin:         { points: 1800, exp: 900 },
    quiz_demon_king:{ points: 2400, exp: 1200 },
    quiz_emperor:   { points: 3000, exp: 1500 },
  },
};

function calcSecretRewardByBoss(bossId: string, variant: "normal" | "fairy") {
  return secretRewardMap[variant]?.[bossId] ?? { points: 1000, exp: 500 };
}

// ✅ シークレットボスの no 割当（normalが奇数、fairyが+1）
const secretBossNoBaseMap: Record<string, number> = {
  ancient_dragon: 89,
  dark_knight: 91,
  susanoo: 93,
  takemikazuchi: 95,
  ultimate_dragon: 97,
  fujin: 99,
  raijin: 101,
  quiz_demon_king: 103,
  quiz_emperor: 105,
};

const getBossNoById = (bossId: string, variant: "normal" | "fairy") => {
  const base = secretBossNoBaseMap[bossId];
  if (!base) return null;
  return String(variant === "fairy" ? base + 1 : base);
};

// ✅ シークレットステージ専用：称号＆コメント
const secretResultMap: Record<
  "normal" | "fairy",
  Record<string, { title: string; comment: string }>
> = {
  normal: {
    ancient_dragon: { title: "エンシェントドラゴン討伐⚔", comment: "エンシェントドラゴンを倒した！おめでとう！🎉" },
    dark_knight:    { title: "ダークナイト討伐⚔",       comment: "ダークナイトを倒した！おめでとう！🎉" },
    susanoo:        { title: "スサノオ討伐⚔",           comment: "スサノオを倒した！おめでとう！🎉" },
    takemikazuchi:  { title: "タケミカヅチ討伐⚔",       comment: "タケミカヅチを倒した！おめでとう！🎉" },
    ultimate_dragon:{ title: "アルティメットドラゴン討伐⚔", comment: "アルティメットドラゴンを倒した！おめでとう！🎉" },
    fujin:          { title: "風神討伐⚔",               comment: "風神を倒した！おめでとう！🎉" },
    raijin:         { title: "雷神討伐⚔",               comment: "雷神を倒した！おめでとう！🎉" },
    quiz_demon_king:{ title: "クイズ大魔王討伐⚔",       comment: "クイズ大魔王を倒した！おめでとう！🎉" },
    quiz_emperor:   { title: "クイズ帝王討伐⚔",         comment: "クイズ帝王を倒した！おめでとう！🎉" },
  },
  fairy: {
    ancient_dragon: { title: "エンシェントドラゴン【フェアリー】討伐⚔", comment: "エンシェントドラゴン【フェアリー】を倒した！おめでとう！🎉" },
    dark_knight:    { title: "ダークナイト【フェアリー】討伐⚔",       comment: "ダークナイト【フェアリー】を倒した！おめでとう！🎉" },
    susanoo:        { title: "スサノオ【フェアリー】討伐⚔",           comment: "スサノオ【フェアリー】を倒した！おめでとう！🎉" },
    takemikazuchi:  { title: "タケミカヅチ【フェアリー】討伐⚔",       comment: "タケミカヅチ【フェアリー】を倒した！おめでとう！🎉" },
    ultimate_dragon:{ title: "アルティメットドラゴン【フェアリー】討伐⚔", comment: "アルティメットドラゴン【フェアリー】を倒した！おめでとう！🎉" },
    fujin:          { title: "風神【フェアリー】討伐⚔",               comment: "風神【フェアリー】を倒した！おめでとう！🎉" },
    raijin:         { title: "雷神【フェアリー】討伐⚔",               comment: "雷神【フェアリー】を倒した！おめでとう！🎉" },
    quiz_demon_king:{ title: "クイズ大魔王【フェアリー】討伐⚔",       comment: "クイズ大魔王【フェアリー】を倒した！おめでとう！🎉" },
    quiz_emperor:   { title: "クイズ帝王【フェアリー】討伐⚔",         comment: "クイズ帝王【フェアリー】を倒した！おめでとう！🎉" },
  },
};

const getSecretResult = (bossId: string, variant: "normal" | "fairy") => {
  const enemy = getSecretEnemy(bossId, variant);
  // マップに無いボスでも動くようにフォールバック
  return secretResultMap[variant]?.[bossId] ?? {
    title: `${enemy.name}討伐⚔`,
    comment: `${enemy.name}を倒した！おめでとう！🎉`,
  };
};


function calcEarnedPointsByClearedStage(clearedStage: number) {
  return stagePointMap[clearedStage] ?? 0;
}

function calcEarnedExpByCorrectCount(correctCount: number) {
  return correctCount * 20;
}

type AwardStatus = "idle" | "awarding" | "awarded" | "need_login" | "error";

// =====================

// キャラクター情報
const characters = [
  { id: "warrior", name: "剣士", image: "/images/kenshi.png", description: "HPが高く、攻撃力は標準クラス。", hp: 150, Attack: 100 },
  { id: "fighter", name: "武闘家", image: "/images/butouka.png", description: "攻撃力が圧倒的に高い。", hp: 50, Attack: 250 },
  { id: "wizard", name: "魔法使い", image: "/images/mahoutsukai.png", description: "HP回復やヒントを見る能力がある。", hp: 80, Attack: 80 },
];

// 敵情報
const enemies = [
  { id: "slime", name: "スライム", image: "/images/スライム_1.png", hp: 50, attack: 25, description: "ぷるぷるして弱そうに見えるが油断は禁物。" },
  { id: "goblin", name: "ゴブリン", image: "/images/ゴブリン_1.png", hp: 100, attack: 50, description: "素早く群れで襲いかかる小型のモンスター。" },
  { id: "skeleton", name: "スケルトン", image: "/images/スケルトン_1.png", hp: 200, attack: 100, description: "朽ちた骨から生まれた剣と盾を操る不気味な戦士。" },
  { id: "mimic", name: "ミミック", image: "/images/ミミック_1.png", hp: 250, attack: 200, description: "宝箱に化けるトリッキーな敵。油断すると噛まれる！" },
  { id: "lizardman", name: "リザードマン", image: "/images/リザードマン_1.png", hp: 400, attack: 300, description: "鱗に覆われた戦士。高い身体能力と鋭い爪で攻撃してくる。" },
  { id: "golem", name: "ゴーレム", image: "/images/ゴーレム_1.png", hp: 600, attack: 450, description: "岩と魔力で作られた巨人。圧倒的な防御力を誇る。" },
  { id: "cerberus", name: "ケルベロス", image: "/images/ケルベロス_1.png", hp: 700, attack: 550, description: "冥界を守る三つ首の魔獣。素早い連続攻撃が脅威。" },
  { id: "berserker", name: "バーサーカー", image: "/images/バーサーカー_1.png", hp: 900, attack: 700, description: "理性を失った狂戦士。攻撃力が非常に高い。" },
  { id: "dragon", name: "ドラゴン", image: "/images/ドラゴン_1.png", hp: 1200, attack: 1000, description: "火を吹く巨大竜。圧倒的な力を誇る古代の王者。" },
  { id: "fenikkusu", name: "フェニックス", image: "/images/フェニックス_1.png", hp: 1500, attack: 1250, description: "不死鳥の炎を操る神秘的な生物。燃え盛る翼で攻撃。" },
  { id: "leviathan", name: "リヴァイアサン", image: "/images/リヴァイアサン_1.png", hp: 2000, attack: 1700, description: "海の深淵から現れる巨大モンスター。水流で圧倒する。" },
  { id: "blackdragon", name: "ブラックドラゴン", image: "/images/ブラックドラゴン_1.png", hp: 3500, attack: 2500, description: "闇の力を宿す黒竜。魔法攻撃も強力。" },
  { id: "kingdemon", name: "キングデーモン", image: "/images/キングデーモン_1.png", hp: 4500, attack: 3500, description: "魔界を統べる悪魔の王。圧倒的な魔力と威圧感を放つ。" },
  { id: "kinghydra", name: "キングヒドラ", image: "/images/キングヒドラ_1.png", hp: 5000, attack: 4500, description: "複数の首を持つ巨大魔獣。倒しても再生する恐怖の存在。" },
  { id: "ordin", name: "オーディン", image: "/images/オーディン_1.png", hp: 6000, attack: 6000, description: "知恵と戦の神。魔法と剣技を極めた伝説の戦士。" },
  { id: "poseidon", name: "ポセイドン", image: "/images/ポセイドン_1.png", hp: 7500, attack: 7500, description: "海の神。雷と津波で敵を蹴散らす力を持つ。" },
  { id: "hades", name: "ハデス", image: "/images/ハデス_1.png", hp: 8500, attack: 8500, description: "冥界の支配者。死者の力を操り、強大な攻撃を仕掛ける。" },
  { id: "zeus", name: "ゼウス", image: "/images/ゼウス_1.png", hp: 10000, attack: 10000, description: "天空の王。雷霆を操る全知全能の神。" },
  { id: "gundarimyouou", name: "軍荼利明王（ぐんだりみょうおう）", image: "/images/軍荼利明王_1.png", hp: 12500, attack: 12500, description: "仏教の怒りの守護神。恐怖の炎で全てを焼き尽くす。" },
  { id: "maou", name: "魔王", image: "/images/魔王_1.png", hp: 30000, attack: 30000, description: "世界を闇に包もうとする存在。圧倒的な魔力を秘める。" },
  { id: "yuusya_game", name: "クイズマスターの最強勇者", image: "/images/勇者1_1.png", hp: 50000, attack: 50000, description: "全てのクイズと戦闘を制した伝説の勇者。前人未到の強さを誇る。" },
  { id: "quizou", name: "クイズ王", image: "/images/王様_1.png", hp: 100000, attack: 100000, description: "クイズの王様。クイズ界の支配者。" },
];

type SecretVariant = "normal" | "fairy";

const secretEnemiesByVariant: Record<SecretVariant, readonly {
  id: string;
  name: string;
  image: string;
  hp: number;
  attack: number;
  description: string;
}[]> = {
  normal: [
    {
      id: "ancient_dragon",
      name: "エンシェントドラゴン",
      image: "/images/エンシェントドラゴン_1.png",
      hp: 1000,
      attack: 1000,
      description: "古代の覇王竜。灼熱の息で全てを焼き尽くす。",
    },
    {
      id: "dark_knight",
      name: "ダークナイト",
      image: "/images/ダークナイト_1.png",
      hp: 2000,
      attack: 2000,
      description: "闇に落ちた騎士。絶望の剣で斬り裂く。",
    },
    {
      id: "susanoo",
      name: "スサノオ",
      image: "/images/スサノオ_1.png",
      hp: 3000,
      attack: 3000,
      description: "嵐を統べる神。雷と暴風で薙ぎ払う。",
    },
    {
      id: "takemikazuchi",
      name: "タケミカヅチ",
      image: "/images/タケミカヅチ_1.png",
      hp: 4000,
      attack: 4000,
      description: "雷剣を携えた武神。天を裂く一撃で敵を討つ。",
    },
    {
      id: "ultimate_dragon",
      name: "アルティメットドラゴン",
      image: "/images/アルティメットドラゴン_1.png",
      hp: 5000,
      attack: 5000,
      description: "全竜の頂点に立つ究極竜。世界を終焉へ導く咆哮を放つ。",
    },
    {
      id: "fujin",
      name: "風神",
      image: "/images/風神_1.png",
      hp: 6000,
      attack: 6000,
      description: "暴風を操る最強神。空間を切り裂く風刃で敵を吹き飛ばす。",
    },
    {
      id: "raijin",
      name: "雷神",
      image: "/images/雷神_1.png",
      hp: 6000,
      attack: 6000,
      description: "雷を支配する最強神。天罰の雷撃で全てを貫く。",
    },
    {
      id: "quiz_demon_king",
      name: "クイズ大魔王",
      image: "/images/大魔王_1.png",
      hp: 8000,
      attack: 8000,
      description: "クイズ界の知識を歪める最強大魔王。誤答を糧に世界を支配する。",
    },
    {
      id: "quiz_emperor",
      name: "クイズ帝王",
      image: "/images/帝王_1.png",
      hp: 10000,
      attack: 10000,
      description: "知識の頂点に君臨する帝王。真理を超えた問いを突きつける。",
    },
  ],
  fairy: [
    {
      id: "ancient_dragon",
      name: "エンシェントドラゴン【フェアリー】",
      image: "/images/エンシェントドラゴン_2.png", // ←フェアリー用画像に
      hp: 1500,
      attack: 1500,
      description: "妖精の加護を得た覇王竜。炎が虹色に揺らめく。",
    },
    {
      id: "dark_knight",
      name: "ダークナイト【フェアリー】",
      image: "/images/ダークナイト_2.png",
      hp: 2500,
      attack: 2500,
      description: "妖精の呪詛を纏う騎士。斬撃が幻惑を起こす。",
    },
    {
      id: "susanoo",
      name: "スサノオ【フェアリー】",
      image: "/images/スサノオ_2.png",
      hp: 3500,
      attack: 3500,
      description: "妖精嵐を従える神。雷が花弁のように舞う。",
    },
    {
      id: "takemikazuchi",
      name: "タケミカヅチ【フェアリー】",
      image: "/images/タケミカヅチ_2.png",
      hp: 4500,
      attack: 4500,
      description: "妖精雷を纏う武神。雷剣が幻想の光を放つ。",
    },
    {
      id: "ultimate_dragon",
      name: "アルティメットドラゴン【フェアリー】",
      image: "/images/アルティメットドラゴン_2.png",
      hp: 5500,
      attack: 5500,
      description: "妖精の力で覚醒した究極竜。虹色の咆哮が次元を震わせる。",
    },
    {
      id: "fujin",
      name: "風神【フェアリー】",
      image: "/images/風神_2.png",
      hp: 6500,
      attack: 6500,
      description: "妖精風を従える神。風が光の羽となり舞い踊る。",
    },
    {
      id: "raijin",
      name: "雷神【フェアリー】",
      image: "/images/雷神_2.png",
      hp: 6500,
      attack: 6500,
      description: "妖精雷に祝福された神。雷撃が星のように降り注ぐ。",
    },
    {
      id: "quiz_demon_king",
      name: "クイズ大魔王【フェアリー】",
      image: "/images/大魔王_2.png",
      hp: 9000,
      attack: 9000,
      description: "妖精の契約を結んだ大魔王。幻想の問いで心を支配する。",
    },
    {
      id: "quiz_emperor",
      name: "クイズ帝王【フェアリー】",
      image: "/images/帝王_2.png",
      hp: 12000,
      attack: 12000,
      description: "妖精王の力を得たクイズ界の帝王。真理すら書き換える存在。",
    },
  ],
} as const;

// const enemies = [
//   { id: "slime", name: "スライム", image: "/images/スライム_1.png", hp: 1, attack: 1, description: "ぷるぷるして弱そうに見えるが油断は禁物。" },
//   { id: "goblin", name: "ゴブリン", image: "/images/ゴブリン_1.png", hp: 1, attack: 1, description: "素早く群れで襲いかかる小型のモンスター。" },
//   { id: "skeleton", name: "スケルトン", image: "/images/スケルトン_1.png", hp: 1, attack: 1, description: "朽ちた骨から生まれた剣と盾を操る不気味な戦士。" },
//   { id: "mimic", name: "ミミック", image: "/images/ミミック_1.png", hp: 1, attack: 1, description: "宝箱に化けるトリッキーな敵。油断すると噛まれる！" },
//   { id: "lizardman", name: "リザードマン", image: "/images/リザードマン_1.png", hp: 1, attack: 1, description: "鱗に覆われた戦士。高い身体能力と鋭い爪で攻撃してくる。" },
//   { id: "golem", name: "ゴーレム", image: "/images/ゴーレム_1.png", hp: 1, attack: 1, description: "岩と魔力で作られた巨人。圧倒的な防御力を誇る。" },
//   { id: "cerberus", name: "ケルベロス", image: "/images/ケルベロス_1.png", hp: 1, attack: 1, description: "冥界を守る三つ首の魔獣。素早い連続攻撃が脅威。" },
//   { id: "berserker", name: "バーサーカー", image: "/images/バーサーカー_1.png", hp: 1, attack: 1, description: "理性を失った狂戦士。攻撃力が非常に高い。" },
//   { id: "dragon", name: "ドラゴン", image: "/images/ドラゴン_1.png", hp: 1, attack: 1, description: "火を吹く巨大竜。圧倒的な力を誇る古代の王者。" },
//   { id: "fenikkusu", name: "フェニックス", image: "/images/フェニックス_1.png", hp: 1, attack: 1, description: "不死鳥の炎を操る神秘的な生物。燃え盛る翼で攻撃。" },
//   { id: "leviathan", name: "リヴァイアサン", image: "/images/リヴァイアサン_1.png", hp: 1, attack: 1, description: "海の深淵から現れる巨大モンスター。水流で圧倒する。" },
//   { id: "blackdragon", name: "ブラックドラゴン", image: "/images/ブラックドラゴン_1.png", hp: 1, attack: 1, description: "闇の力を宿す黒竜。魔法攻撃も強力。" },
//   { id: "kingdemon", name: "キングデーモン", image: "/images/キングデーモン_1.png", hp: 1, attack: 1, description: "魔界を統べる悪魔の王。圧倒的な魔力と威圧感を放つ。" },
//   { id: "kinghydra", name: "キングヒドラ", image: "/images/キングヒドラ_1.png", hp: 1, attack: 1, description: "複数の首を持つ巨大魔獣。倒しても再生する恐怖の存在。" },
//   { id: "ordin", name: "オーディン", image: "/images/オーディン_1.png", hp: 1, attack: 1, description: "知恵と戦の神。魔法と剣技を極めた伝説の戦士。" },
//   { id: "poseidon", name: "ポセイドン", image: "/images/ポセイドン_1.png", hp: 1, attack: 1, description: "海の神。雷と津波で敵を蹴散らす力を持つ。" },
//   { id: "hades", name: "ハデス", image: "/images/ハデス_1.png", hp: 1, attack: 1, description: "冥界の支配者。死者の力を操り、強大な攻撃を仕掛ける。" },
//   { id: "zeus", name: "ゼウス", image: "/images/ゼウス_1.png", hp: 1, attack: 1, description: "天空の王。雷霆を操る全知全能の神。" },
//   { id: "gundarimyouou", name: "軍荼利明王（ぐんだりみょうおう）", image: "/images/軍荼利明王_1.png", hp: 1, attack: 1, description: "仏教の怒りの守護神。恐怖の炎で全てを焼き尽くす。" },
//   { id: "maou", name: "魔王", image: "/images/魔王_1.png", hp: 1, attack: 1, description: "世界を闇に包もうとする存在。圧倒的な魔力を秘める。" },
//   { id: "yuusya_game", name: "クイズマスターの最強勇者", image: "/images/勇者1_1.png", hp: 1, attack: 1, description: "全てのクイズと戦闘を制した伝説の勇者。前人未到の強さを誇る。" },
//   { id: "quizou", name: "クイズ王", image: "/images/王様_1.png", hp: 1, attack: 1, description: "クイズの王様。クイズ界の支配者。" },
// ];

// キャラクター選択画面
const CharacterSelect = ({ onSelect }: { onSelect: (characterId: string) => void }) => {
  return (
    <div className="text-center mt-5">
      <h2 className="text-2xl md:text-4xl font-bold mb-8">キャラクターを選択してください</h2>
      <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 mb-5">
        {characters.map((char) => (
          <div
            key={char.id}
            className={`cursor-pointer hover:scale-105 transform transition-all duration-200 border-2 border-gray-500 rounded-xl flex flex-col items-center justify-start p-4 w-64 h-72 md:w-60 md:h-94 ${
              char.id === "warrior"
                ? "bg-gradient-to-r from-blue-400 via-blue-200 to-cyan-300"
                : char.id === "fighter"
                ? "bg-gradient-to-r from-red-400 via-orange-200 to-yellow-300"
                : char.id === "wizard"
                ? "bg-gradient-to-r from-purple-400 via-pink-200 to-pink-300"
                : "bg-gray-50"
            }`}
            onClick={() => onSelect(char.id)}
          >
            <img src={char.image} alt={char.name} className="w-35 h-35 md:w-50 md:h-50 mx-auto" />
            <p className="text-xl font-bold">{char.name}</p>
            <p className="text-sm text-gray-900 mt-1">{char.description}</p>
            <div className="border border-gray-400 p-2 mt-2 bg-white">
              <p className="text-sm text-gray-800">HP（ライフ）： {char.hp}</p>
              <p className="text-sm text-gray-800">攻撃力： {char.Attack}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const getSecretEnemy = (bossId: string, variant: "normal" | "fairy") => {
  const list = secretEnemiesByVariant[variant] ?? secretEnemiesByVariant.normal;
  return list.find((e) => e.id === bossId) ?? list[0];
};

// ステージに応じて敵を取得する
const getEnemyForStage = (stage: number, course?: string, bossId?: string, variant?: "normal" | "fairy") => {
  // ✅ secret の場合はボス固定
  if (course === "secret") {
    return getSecretEnemy(bossId || "", variant ?? "normal");
  }

  // ステージに応じて敵を変える
  if (stage < 2) return enemies[0];
  if (stage < 3) return enemies[1];
  if (stage < 4) return enemies[2];
  if (stage < 5) return enemies[3];
  if (stage < 6) return enemies[4];
  if (stage < 7) return enemies[5];
  if (stage < 8) return enemies[6];
  if (stage < 9) return enemies[7];
  if (stage < 10) return enemies[8];
  if (stage < 11) return enemies[9];
  if (stage < 12) return enemies[10];
  if (stage < 13) return enemies[11];
  if (stage < 14) return enemies[12];
  if (stage < 15) return enemies[13];
  if (stage < 16) return enemies[14];
  if (stage < 17) return enemies[15];
  if (stage < 18) return enemies[16];
  if (stage < 19) return enemies[17];
  if (stage < 20) return enemies[18];
  if (stage < 21) return enemies[19];
  if (stage < 22) return enemies[20];
  if (stage < 23) return enemies[21];
  return enemies[21];
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

// クリアステージに応じて出すコメント
const rankComments = [
  { threshold: 0, comment: "ここから冒険の始まりだ！ゆっくり進んでいこう！" },
  { threshold: 1, comment: "クイズ戦士に昇格！戦場に立つ準備は万端だ！" },
  { threshold: 2, comment: "謎解きファイター！試練に立ち向かう力がついてきた！" },
  { threshold: 3, comment: "頭脳の騎士！君の知識が冒険の武器になる！" },
  { threshold: 4, comment: "ひらめきハンター！まるで答えが見えているかのような閃きだ！" },
  { threshold: 5, comment: "真理の探究者！知識の深みを極め、迷宮を読み解く力がある！" },
  { threshold: 6, comment: "知恵の勇者！知識と勇気を兼ね備えた英雄だ！" },
  { threshold: 7, comment: "知識の守護者！叡智を守り導く存在として認められた！" },
  { threshold: 8, comment: "英知の支配者！知識そのものが君の配下にあるかのようだ！" },
  { threshold: 9, comment: "思考の王者！すべての問いが君の前に跪く！" },
  { threshold: 10, comment: "叡智の化身！知識が肉体を持った存在…それが君だ！" },
  { threshold: 11, comment: "クイズ大賢者！答えへ至る道を完全に見通している…！" },
  { threshold: 12, comment: "真理を極めし者！世界の本質に手が届いている！" },
  { threshold: 13, comment: "叡智の伝説！語り継がれるほどの知識を手にした！" },
  { threshold: 14, comment: "答えの覇者！どんな難問も力でねじ伏せる存在だ！" },
  { threshold: 15, comment: "クイズ界の支配者！この世界のクイズはすべて君のものだ！" },
  { threshold: 16, comment: "クイズ超越者！もはや理解不能…次元が違いすぎる！" },
  { threshold: 17, comment: "フロアマスター！あらゆるステージを制覇する者の風格だ！" },
  { threshold: 18, comment: "グランドマスター！歴戦の賢者のような威厳がある！" },
  { threshold: 19, comment: "クイズマスター！最強の中の最強…殿堂入りレベル！" },
  { threshold: 20, comment: "レジェンドクイズマスター！伝説に語り継がれる存在だ…！" },
  { threshold: 21, comment: "クイズ王…！ついにクイズマスターを倒した！🎉君はクイズ界の王者だ！！" },
  { threshold: 22, comment: "クイズ神…！ついにクイズ王を倒した！🎉🎉一番すごい称号に到達だ！✨" },
];

const QuizResult = ({
  correctCount,
  getTitle,
  titles,
  earnedPoints,
  earnedExp,
  isLoggedIn,
  awardStatus,
  onGoLogin,
  onShareX,
  onRetry,
  isSecret,
  secretBossName,
  secretTitle,
  secretComment,
  secretCleared,
  rankingRows,
}: {
  correctCount: number;
  getTitle: () => string;
  titles: { threshold: number; title: string }[];

  earnedPoints: number;
  earnedExp: number;
  isLoggedIn: boolean;
  awardStatus: AwardStatus;
  onGoLogin: () => void;
  onShareX: () => void;
  onRetry: () => void;
  isSecret: boolean;
  secretBossName?: string;
  secretTitle?: string;
  secretComment?: string;
  secretCleared: boolean;
  rankingRows: { user_id: string; username: string | null; avatar_url: string | null; best_stage: number }[];
}) => {
  const [showScore, setShowScore] = useState(false);
  const [showText, setShowText] = useState(false);
  const [showRank, setShowRank] = useState(false);
  const [showButton, setShowButton] = useState(false);

  const isFinalStage = correctCount === 22;

  const getRankComment = () => {
    let comment = "";
    rankComments.forEach((r) => {
      if (correctCount >= r.threshold) comment = r.comment;
    });
    return comment;
  };

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    timers.push(setTimeout(() => setShowScore(true), 500));
    timers.push(setTimeout(() => setShowText(true), 1000));
    timers.push(setTimeout(() => setShowRank(true), 1500));
    timers.push(setTimeout(() => setShowButton(true), 1500));

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="text-center mt-6">
      {showScore && (
        <p className="text-3xl md:text-5xl mb-4 md:mb-6">
          {isSecret
            ? (secretCleared
                ? `${secretBossName}を倒した！`
                : `${secretBossName}に敗北…`)
            : `ステージ ${correctCount} までクリア！`}
        </p>
      )}
      {showText && <p className="text-xl md:text-2xl text-gray-600 mb-2">あなたの称号は…</p>}

      {showRank && (
        <>
          <div className="flex flex-col md:flex-row items-center justify-center mb-10 gap-4 md:gap-10">
            <img src="/images/yuusya_game.png" alt="勇者" className="w-0 h-0 md:w-50 md:h-50" />
            <p
              className={`text-4xl md:text-6xl font-bold drop-shadow-lg text-center animate-pulse ${
                isFinalStage ? "final-title text-yellow-300" : "text-blue-600"
              }`}
            >
              {isSecret
                ? (secretCleared ? (secretTitle ?? "討伐者") : "秘密の冒険者")
                : getTitle()}
            </p>
            <div className="flex flex-row md:flex-row items-center justify-center gap-4 md:gap-8">
              <img src="/images/yuusya_game.png" alt="勇者" className="w-30 h-30 md:w-0 md:h-0" />
              <img src="/images/dragon.png" alt="ドラゴン" className="w-30 h-30 md:w-50 md:h-50" />
            </div>
          </div>

          {/* ★ 正解数に応じたコメント */}
          {(() => {
            const text = isSecret
              ? (secretCleared
                  ? secretComment
                  : "惜しくも討伐できなかった…！\nもう一度挑戦してリベンジしよう🔥")
              : getRankComment();

            return text ? (
              <p className="text-lg md:text-2xl text-gray-800 mb-8 font-bold whitespace-pre-line">
                {text}
              </p>
            ) : null;
          })()}
          {/* ★ 追加：獲得ポイント表示 */}
          <div className="mx-auto max-w-[520px] bg-white border-2 border-black rounded-xl p-4 shadow mt-2">
            <p className="text-xl md:text-2xl font-extrabold text-gray-800">
              今回の獲得ポイント： <span className="text-green-600">{earnedPoints} P</span>
            </p>
            <p className="text-xl md:text-2xl font-extrabold text-gray-800 mt-2">
              今回の獲得経験値： <span className="text-purple-600">{earnedExp} EXP</span>
            </p>

            {isLoggedIn ? (
              <>
                {awardStatus === "awarding" && (
                  <p className="text-md md:text-xl text-gray-600 mt-2">ポイント反映中...</p>
                )}
                {awardStatus === "awarded" && (
                  <p className="text-md md:text-xl text-green-700 font-bold mt-2">✅ ポイントを加算しました！</p>
                )}
                {awardStatus === "error" && (
                  <p className="text-md md:text-xl text-red-600 font-bold mt-2">
                    ❌ ポイント加算に失敗しました。時間をおいて再度お試しください。
                  </p>
                )}
              </>
            ) : (
              <div className="mt-2">
                <p className="text-md md:text-xl text-gray-700 font-bold">
                  ※未ログインのため受け取れません。ログイン（無料）すると次からポイントを受け取れます！
                </p>
                <button
                  onClick={onGoLogin}
                  className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 cursor-pointer"
                >
                  ログインする
                </button>
                <p className="text-md md:text-xl text-gray-700 font-bold mt-2">
                  ログインなしでも、引き続き遊べます👇
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {showButton && (
        <>
          <div className="flex flex-col md:flex-row justify-center items-center gap-4 mt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <button
                className="px-6 py-3 bg-black text-white border border-black rounded-lg font-bold text-xl hover:opacity-80 cursor-pointer"
                onClick={onShareX}
              >
                Xで結果をシェア
              </button>
              <button
                className="px-6 py-3 bg-green-500 text-white rounded-lg font-bold text-xl hover:bg-green-600 cursor-pointer"
                onClick={onRetry}
              >
                もう一回挑戦する
              </button>
            </div>
          </div>

          <div className="mt-6">
            {!isLoggedIn && (
              <p className="mx-auto max-w-[720px] text-sm md:text-base font-bold text-gray-700 mb-2">
                ※ログイン（無料）すると、あなたの最高記録もランキングに反映されます！
              </p>
            )}
  
            <DungeonRankingTop10 rows={rankingRows} />
          </div>

          <RecommendedSoloGames
            title="次はどれで遊ぶ？🎮"
            count={4}
            excludeHref="/quiz-master" // 今のページを出したくないなら
          />
        </>
      )}
    </div>
  );
};

function ConfirmExitModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* overlay */}
      <button
        aria-label="閉じる"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      {/* modal */}
      <div className="relative w-full max-w-md rounded-2xl border-2 border-black bg-white shadow-2xl">
        <div className="p-5 md:p-6 text-center">
          <p className="text-2xl md:text-3xl font-extrabold text-gray-900">
            冒険を終了しますか？
          </p>
          <p className="mt-2 text-sm md:text-base text-gray-600 whitespace-pre-line">
            ここまでの結果でリザルトになります
          </p>

          <div className="mt-6 flex gap-3">
            <button
              className="
                flex-1 px-4 py-3 rounded-xl font-extrabold
                border-2 border-black bg-white hover:bg-gray-100
                active:scale-95 transition
              "
              onClick={onClose}
            >
              キャンセル
            </button>

            <button
              className="
                flex-1 px-4 py-3 rounded-xl font-extrabold text-white
                border-2 border-black
                bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-400
                hover:from-blue-600 hover:via-sky-600 hover:to-cyan-500
                shadow-lg shadow-blue-300
                active:scale-95 transition
              "
              onClick={onConfirm}
            >
              終了する
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function QuizModePage() {
  const router = useRouter();
  const pathname = usePathname();
  const mode = pathname.split("/").pop() || "random";
  const searchParams = useSearchParams();
  const genre = searchParams?.get("genre") || "";
  const course = searchParams?.get("course") || "normal"; // "normal" | "secret"
  const boss = searchParams?.get("boss") || "";
  const variant = (searchParams?.get("variant") || "normal") as "normal" | "fairy";

  // ★ 追加：Supabase & ユーザー
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { user, loading: userLoading } = useSupabaseUser();

  // ============================
  // ✅ 取りこぼし防止：pending key（ダンジョン用）
  // ============================
  const PENDING_KEY = "dungeon_award_pending_v1";

  // ✅ 付与直前に “いまログインできてるか” を確認して userId を返す
  const ensureAuthedUserId = async (): Promise<string | null> => {
    const { data: u1, error: e1 } = await supabase.auth.getUser();
    if (!e1 && u1.user) return u1.user.id;

    await supabase.auth.refreshSession();
    const { data: u2, error: e2 } = await supabase.auth.getUser();
    if (!e2 && u2.user) return u2.user.id;

    return null;
  };

  const savePendingAward = (payload: { correctCount: number; points: number; exp: number }) => {
    try {
      localStorage.setItem(PENDING_KEY, JSON.stringify({ ...payload, at: Date.now() }));
    } catch {}
  };

  const loadPendingAward = (): null | { correctCount: number; points: number; exp: number } => {
    try {
      const raw = localStorage.getItem(PENDING_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const clearPendingAward = () => {
    try {
      localStorage.removeItem(PENDING_KEY);
    } catch {}
  };

  // ✅ “付与”の本体（何回でも呼べる）
  const awardPointsAndExp = async (payload?: { correctCount: number; points: number; exp: number }) => {
    // 既に付与済みなら何もしない
    if (awardedOnceRef.current) return;

    const p = payload ?? loadPendingAward();
    if (!p) return;

    // 0以下は付与しない（pending も消す）
    if (p.points <= 0 && p.exp <= 0) {
      clearPendingAward();
      setAwardStatus("idle");
      return;
    }

    setAwardStatus("awarding");

    const uid = await ensureAuthedUserId();
    if (!uid) {
      // ✅ 未ログインなら “取りこぼさないよう保留”
      savePendingAward(p);
      setAwardStatus("need_login");
      return;
    }

    // ✅ ここで初めて二重加算防止フラグを立てる（未ログイン時に立てない）
    awardedOnceRef.current = true;

    try {
      const { data, error } = await supabase.rpc("add_points_and_exp", {
        p_user_id: uid,
        p_points: p.points,
        p_exp: p.exp,
      });

      if (error) {
        console.error("add_points_and_exp error:", error);
        // 失敗時は pending を残す（取りこぼし防止）
        savePendingAward(p);
        awardedOnceRef.current = false; // リトライできるよう戻す
        setAwardStatus("error");
        return;
      }

      const row = Array.isArray(data) ? data[0] : data;
      const oldLevel = row?.old_level ?? 1;
      const newLevel = row?.new_level ?? 1;

      window.dispatchEvent(new Event("points:updated"));
      window.dispatchEvent(new CustomEvent("profile:updated", { detail: { oldLevel, newLevel } }));

      const suffix = course === "secret" ? ` / secret:${boss}:${variant}` : "";

      // ログ（ポイント）
      if (p.points > 0) {
        await supabase.from("user_point_logs").insert({
          user_id: uid,
          change: p.points,
          reason: `クイズダンジョンでポイント獲得（クリアステージ ${p.correctCount}${suffix}）`,
        });
      }

      // ログ（EXP）
      if (p.exp > 0) {
        await supabase.from("user_exp_logs").insert({
          user_id: uid,
          change: p.exp,
          reason: `クイズダンジョンでEXP獲得（正解数 ${p.correctCount} → ${p.exp}EXP）`,
        });
      }

      // ✅ 成功したら pending を消す
      clearPendingAward();
      setAwardStatus("awarded");
    } catch (e) {
      console.error("award points/exp error:", e);
      savePendingAward(p);
      awardedOnceRef.current = false;
      setAwardStatus("error");
    }
  };


  const [character, setCharacter] = useState<string | null>(null); // 選択したキャラクター
  const [questions, setQuestions] = useState<{ id: string; quiz: QuizData }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentStage, setCurrentStage] = useState(0);
  const [userAnswer, setUserAnswer] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [quizCorrectCount, setQuizCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [showCorrectMessage, setShowCorrectMessage] = useState(false);
  const [incorrectMessage, setIncorrectMessage] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const incorrectRef = useRef<string | null>(incorrectMessage);
  const [characterHP, setCharacterHP] = useState<number | null>(null);
  const [enemyHP, setEnemyHP] = useState<number | null>(null);
  const [attackMessage, setAttackMessage] = useState<string | null>(null);
  const [isAttacking, setIsAttacking] = useState(false);
  const isAttackingRef = useRef(isAttacking);
  const [showStageIntro, setShowStageIntro] = useState(false);
  const [showAttackEffect, setShowAttackEffect] = useState(false);
  const [showEnemyAttackEffect, setShowEnemyAttackEffect] = useState(false);
  const [enemyDefeatedMessage, setEnemyDefeatedMessage] = useState<string | null>(null);
  const [deathMessage, setDeathMessage] = useState<string | null>(null);
  const [characterLevel, setCharacterLevel] = useState(1);
  const [levelUpMessage, setLevelUpMessage] = useState<string | null>(null);
  const [showNextStageButton, setShowNextStageButton] = useState(false);
  const [showMagicButtons, setShowMagicButtons] = useState(false);
  const [hintText, setHintText] = useState<string | null>(null);
  const [levelUp, setLevelUp] = useState<number | null>(null);
  const [healing, setHealing] = useState<number | null>(null);
  const [isBlinking, setIsBlinking] = useState(false);
  const [isBlinkingEnemy, setIsBlinkingEnemy] = useState(false);
  const [enemyVisible, setEnemyVisible] = useState(true);
  const [miracleSeedCount, setMiracleSeedCount] = useState(0); // 所持数
  const [miracleSeedMessage, setMiracleSeedMessage] = useState<string | null>(null); // ドロップメッセージ
  const [exitOpen, setExitOpen] = useState(false);
  // ====== シークレット討伐：獲得モーダル用 ======
  const [ownedCharacterIds, setOwnedCharacterIds] = useState<Set<string>>(new Set());
  const [acquired, setAcquired] = useState<CharacterItem | null>(null);
  const [acquireOpen, setAcquireOpen] = useState(false);

  // 「リザルト突入時に一回だけ」発火させる用
  const acquiredOnceRef = useRef(false);
  // 最後にヒントボタンを使った問題番号
  const [lastHintUsedIndex, setLastHintUsedIndex] = useState<number | null>(null);
  // 最後に回復ボタンを使った問題番号
  const [lastHealUsedIndex, setLastHealUsedIndex] = useState<number | null>(null);

  // ★ 追加：ポイント付与状態
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [earnedExp, setEarnedExp] = useState(0);
  const [awardStatus, setAwardStatus] = useState<AwardStatus>("idle");
  const awardedOnceRef = useRef(false);
  const sentRef = useRef(false); // ★ 成績保存の二重送信防止
  const { pushModal } = useResultModal();
  const [rankingRows, setRankingRows] = useState<
    { user_id: string; username: string | null; avatar_url: string | null; best_stage: number }[]
  >([]);

  const isSecret = course === "secret";
  const secretEnemy = isSecret ? getSecretEnemy(boss || "ancient_dragon", variant) : null;
  const secretRes = isSecret ? getSecretResult(boss || "ancient_dragon", variant) : null;
  const getPlayerStats = (characterId: string) => {
  const base = characters.find((c) => c.id === characterId);
    if (!base) return null;

    const mul = isSecret ? 20 : 1;
    return {
      ...base,
      hp: base.hp * mul,
      Attack: base.Attack * mul,
    };
  };

  const finishedRef = useRef(finished);
  const showCorrectRef = useRef(showCorrectMessage);
  const questionsReady = questions.length > 0 && !!questions[currentIndex]?.quiz;

  const titles = [
    { threshold: 1, title: "クイズ戦士" },
    { threshold: 2, title: "謎解きファイター" },
    { threshold: 3, title: "頭脳の騎士" },
    { threshold: 4, title: "ひらめきハンター" },
    { threshold: 5, title: "真理の探究者" },
    { threshold: 6, title: "知恵の勇者 🛡️" },
    { threshold: 7, title: "知識の守護者 🔮" },
    { threshold: 8, title: "英知の支配者 📜" },
    { threshold: 9, title: "思考の王者 👑" },
    { threshold: 10, title: "叡智の化身 ✨" },
    { threshold: 11, title: "クイズ大賢者 ⭐" },
    { threshold: 12, title: "真理を極めし者 🌠" },
    { threshold: 13, title: "叡智の伝説 🏹" },
    { threshold: 14, title: "答えの覇者 🌀" },
    { threshold: 15, title: "クイズ界の支配者 🌍" },
    { threshold: 16, title: "クイズ超越者 🌌" },
    { threshold: 17, title: "フロアマスター 🏆" },
    { threshold: 18, title: "グランドマスター 🏆" },
    { threshold: 19, title: "クイズマスター 🏆" },
    { threshold: 20, title: "レジェンドクイズマスター 🌟" },
    { threshold: 21, title: "✨クイズ王👑" },
    { threshold: 22, title: "💫クイズ神💫" },
  ];

  const resetGame = () => {
    // 進行
    setQuestions([]); 
    setCurrentIndex(0);
    setCurrentStage(0);
    setCorrectCount(0);
    setQuizCorrectCount(0);
    setFinished(false);
    setUserAnswer(null);

    // 表示/演出
    setShowCorrectMessage(false);
    setIncorrectMessage(null);
    setAttackMessage(null);
    setIsAttacking(false);
    setShowAttackEffect(false);
    setShowEnemyAttackEffect(false);
    setEnemyDefeatedMessage(null);
    setDeathMessage(null);
    setShowNextStageButton(false);
    setShowMagicButtons(false);
    setHintText(null);
    setLevelUpMessage(null);
    setLevelUp(null);
    setHealing(null);
    setIsBlinking(false);
    setIsBlinkingEnemy(false);
    setEnemyVisible(true);
    setMiracleSeedMessage(null);

    // クールダウン系
    setLastHintUsedIndex(null);
    setLastHealUsedIndex(null);

    // タイマー
    setTimeLeft(30);

    // リザルト/付与系
    setEarnedPoints(0);
    setEarnedExp(0);
    setAwardStatus("idle");
    awardedOnceRef.current = false;
    sentRef.current = false;
    clearPendingAward();
    startedRef.current = false;
    acquiredOnceRef.current = false;
    setAcquireOpen(false);
    setAcquired(null);

    // ref同期（タイマー制御で見てるので重要）
    finishedRef.current = false;
    showCorrectRef.current = false;
    incorrectRef.current = null;
    isAttackingRef.current = false;

    // HP/レベル初期化
    const char = characters.find((c) => c.id === character);
    if (char) setCharacterHP(char.hp);
    setCharacterLevel(1);
    setEnemyHP(getEnemyForStage(1, course, boss, variant).hp);
    setCharacter(null)

    // 問題順シャッフル（任意）
    setQuestions((prev) => shuffleArray(prev));
  };

  useEffect(() => {
    finishedRef.current = finished;
  }, [finished]);

  useEffect(() => {
    showCorrectRef.current = showCorrectMessage;
  }, [showCorrectMessage]);

  useEffect(() => {
    incorrectRef.current = incorrectMessage;
  }, [incorrectMessage]);

  useEffect(() => {
    isAttackingRef.current = isAttacking;
  }, [isAttacking]);

  useEffect(() => {
    if (!finished) return;

    (async () => {
      const { data, error } = await supabase
        .from("user_public_profiles")
        .select("user_id, username, avatar_url, best_stage")
        .order("best_stage", { ascending: false })
        .limit(10);

      if (error) {
        console.error("fetch dungeon ranking error:", error);
        setRankingRows([]);
        return;
      }

      setRankingRows((data ?? []) as any);
    })();
  }, [finished, supabase]);

  // ✅ NEW判定用：所持キャラIDを取得
  useEffect(() => {
    if (!user) return;

    (async () => {
      const { data, error } = await supabase
        .from("user_characters")
        .select("character_id")
        .eq("user_id", user.id);

      if (error) {
        console.error("fetch owned characters error:", error);
        return;
      }

      const ids = new Set<string>((data ?? []).map((r: any) => r.character_id));
      setOwnedCharacterIds(ids);
    })();
  }, [user, supabase]);

  useEffect(() => {
    if (!character) return; // キャラ選択前は取得しない

    const controller = new AbortController();

    const fetchArticles = async () => {
      try {
        const res = await fetch("/api/articles", { signal: controller.signal });
        const data: ArticleData[] = await res.json();
        let all: ArticleData[] = data;

        if (mode === "genre" && genre) {
          all = all.filter((a) => a.quiz?.genre === genre);
        }

        const quizQuestions: { id: string; quiz: QuizData }[] = all
          .filter((a) => a.quiz)
          .map((a) => ({
            id: a.id,
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
            }
          }));

        setQuestions(shuffleArray(quizQuestions));
      } catch (e: any) {
        if (e?.name === "AbortError") return; // ✅ 中断は無視
        console.error("クイズ問題の取得に失敗しました:", e);
      }
    };

    fetchArticles();
    return () => controller.abort(); // ✅ キャラ変更/アンマウント時に中断
  }, [mode, genre, character]);

  // useEffect(() => {
  //   if (character) {
  //     const char = characters.find((c) => c.id === character);
  //     if (char) setCharacterHP(char.hp);
  //     setEnemyHP(getEnemyForStage(1, course, boss, variant).hp);
  //   }
  // }, [character]);

  useEffect(() => {
    if (!character) return;

    const char = getPlayerStats(character);
    if (char) setCharacterHP(char.hp);

    setEnemyHP(getEnemyForStage(1, course, boss, variant).hp);
  }, [character, isSecret, course, boss, variant]);

  useEffect(() => {
    setShowStageIntro(true);
    setTimeout(() => setShowStageIntro(false), 4000);
  }, [currentStage]);
  
  useEffect(() => {
    if (character === "wizard") {
      setShowMagicButtons(true);
    } else {
      setShowMagicButtons(false);
    }
    setHintText(null); // 次の問題でヒント非表示
  }, [currentIndex, character]);

  const shuffleArray = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);

  const startedRef = useRef(false);

  useEffect(() => {
    if (!questionsReady) return;

    // ✅ questions が入った“初回だけ”同時スタート
    if (!startedRef.current) {
      startedRef.current = true;

      setTimeLeft(30);
      setShowCorrectMessage(false);
      setIncorrectMessage(null);
      setIsAttacking(false);

      // ref同期（タイマー停止条件に使ってるので）
      showCorrectRef.current = false;
      incorrectRef.current = null;
      isAttackingRef.current = false;
      finishedRef.current = false;
    }
  }, [questionsReady]);


  useEffect(() => {
    if (!character) return;
    if (!questionsReady) return;

    const timer = setInterval(() => {
      if (finishedRef.current) return;
      if (showCorrectRef.current) return;
      if (incorrectRef.current) return;      // 不正解表示中は止める
      if (isAttackingRef.current) return;    // 攻撃演出中は止める

      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          timeoutAsIncorrect();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [character, currentIndex, questionsReady]); 

  const checkAnswer = () => {
    const correctAnswer = questions[currentIndex].quiz?.answer;
    const displayAnswer = questions[currentIndex].quiz?.displayAnswer;

    if (userAnswer === correctAnswer) {
      setShowCorrectMessage(true);
      setQuizCorrectCount((c) => c + 1);
    } else {
      setIncorrectMessage(`ざんねん！\n答えは" ${displayAnswer} "でした！`);
    }

    setUserAnswer(null);
    setTimeLeft(0);
  };

  const timeoutAsIncorrect = () => {
    const displayAnswer = questions[currentIndex].quiz?.displayAnswer;
    setIncorrectMessage(`時間切れ！\n答えは" ${displayAnswer} "でした！`);
    setUserAnswer(null);
  };

  const nextQuestion = () => {
    setShowCorrectMessage(false);
    setLevelUp(null);
    setHealing(null);
    setTimeLeft(30);

    if (currentIndex + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  const getTitle = () => {
    let title = "見習い冒険者";
    titles.forEach((t) => {
      if (correctCount >= t.threshold) title = t.title;
    });
    return title;
  };

  const finishQuiz = () => {
    setFinished(true);
  };

  const animateHP = (
    startHP: number, 
    damage: number, 
    setHP: React.Dispatch<React.SetStateAction<number | null>>, 
    callback: () => void,
    speed: number
  ) => {
    let currentHP = startHP;
    const targetHP = Math.max(startHP - damage, 0); // ここで0未満にならないように

    const interval = setInterval(() => {
      currentHP = Math.max(currentHP - 1, targetHP);
      setHP(currentHP);

      if (currentHP <= targetHP) {
        clearInterval(interval);
        callback();
      }
    }, speed); // 1減少ごとに10ms→ステージによって変化する
  };

  const attackEnemy = () => {
    const player = characters.find((c) => c.id === character);
    if (!player || enemyHP === null) return;

    // ⭐ 攻撃エフェクト表示！
    setShowAttackEffect(true);

    setShowCorrectMessage(false);
    setIncorrectMessage(null);

    setIsAttacking(true);
    const attackPower = getCharacterAttack();

    // アニメーション開始前に startHP をキャプチャ
    const startHP = enemyHP ?? 0;
    setAttackMessage(`${player.name}の攻撃！${getEnemyForStage(currentStage + 1, course, boss, variant).name}に${attackPower}のダメージ！`);

    const speed = getSpeedByStage(currentStage);

    // ⭐ AttackEffect が終わってから HP を減らす
    setTimeout(() => {
      // エフェクト消す
      setShowAttackEffect(false);

      setIsBlinkingEnemy(true);
      animateHP(startHP, attackPower, setEnemyHP, () => {
        const remainingHP = startHP - attackPower;

        if (remainingHP <= 0) {
          setIsBlinkingEnemy(false);

          // フェードアウト開始
          setEnemyVisible(false);

          // 敵を倒したメッセージをセット
          const enemyName = getEnemyForStage(currentStage + 1, course, boss, variant).name;
          setEnemyDefeatedMessage(`🎉 ${enemyName} を倒した！`);
          setAttackMessage(null);

          setCorrectCount((c) => c + 1);
          
          // ★★★ 最終ステージなら強制終了 ★★★
          const finalStage = course === "secret" ? 1 : 22;

          if (currentStage + 1 >= finalStage) {
            setTimeout(() => {
              setFinished(true);
            }, 3000); // メッセージをちょっと見せるために2秒待ち（好みで変更可）
            return; // ここで終了して次の処理をしない
          }

          // ドロップ判定（10分の1）
          const dropChance = Math.random();
          if (dropChance < 0.005) {
            setMiracleSeedCount((prev) => prev + 1);
            setMiracleSeedMessage("伝説の果実🍏を手に入れた！✨");
          }

          // 現在のレベルを変数に保持（レベルアップ表示用）
          const newLevel = characterLevel + currentStage + 1;

          // 🎉 ステージごとにレベル +ステージの数
          setCharacterLevel(newLevel);
          setCharacterHP((prevHP) => {
            const baseHP = characters.find((c) => c.id === character)?.hp ?? 0;
            return (prevHP ?? 0) + baseHP * (currentStage + 1);
          });

          // ⭐ レベルアップメッセージをセット！
          setLevelUpMessage(`✨レベル ${newLevel} に上がった！`);

          // 次のステージに進むボタンを表示
          setShowNextStageButton(true);
        }else{
          setIsBlinkingEnemy(false);
          // 攻撃アニメ終了後にメッセージを消して次の問題へ
          setTimeout(() => {
            setIsAttacking(false);
            setAttackMessage(null);
            nextQuestion();
          }, 1000); // 1秒表示
        }
      }, speed);
    }, 1500); // ← この間 AttackEffect を見せたい時間（1.2秒など好みで）
  };

  // ✅ no を渡すだけで「獲得モーダル表示」→「DB登録」までやる
  const acquireBossCharacterByNo = async (bossNo: string) => {
    if (!user) return;

    // ① characters.id を取得（noで紐付け）
    const { data: characterRow, error: findError } = await supabase
      .from("characters")
      .select("id, name, image_url, rarity, no")
      .eq("no", bossNo)
      .maybeSingle();

    if (findError || !characterRow?.id) {
      console.error("character lookup error:", findError, bossNo);
      return;
    }

    // ② NEW判定
    const isNew = !ownedCharacterIds.has(characterRow.id);

    // ③ モーダル用 item（ガチャと同じ形）
    if (
      !characterRow?.name ||
      !characterRow?.image_url ||
      !characterRow?.rarity ||
      !characterRow?.no
    ) {
      console.error("characterRow has null fields:", characterRow);
      return;
    }

    if (!isRarity(characterRow.rarity)) {
      console.error("invalid rarity:", characterRow.rarity);
      return;
    }

    const item: CharacterItem = {
      name: characterRow.name,
      image: characterRow.image_url,
      rarity: characterRow.rarity,
      no: characterRow.no,
      characterId: characterRow.id,
      isNew,
    };

    // ④ 先にモーダル表示（演出優先）
    setAcquired(item);
    setAcquireOpen(true);

    // ⑤ DB登録（ガチャと同じRPC）
    const { error: rpcError } = await supabase.rpc("increment_user_character", {
      p_user_id: user.id,
      p_character_id: characterRow.id,
    });
    if (rpcError) console.error("increment_user_character rpc error:", rpcError);

    // ⑥ owned更新（次回NEWにならない）
    if (isNew) {
      setOwnedCharacterIds((prev) => {
        const next = new Set(prev);
        next.add(characterRow.id);
        return next;
      });
    }
  };

  const attackCharacter = () => {
    const enemy = getEnemyForStage(currentStage + 1, course, boss, variant);
    if (characterHP === null || enemyHP === null) return;

    // ⭐ 敵攻撃エフェクト表示！
    setShowEnemyAttackEffect(true);

    setShowCorrectMessage(false);
    setIncorrectMessage(null);

    setIsAttacking(true);
    setAttackMessage(`${enemy.name}の攻撃！${characters.find((c) => c.id === character)?.name}に${enemy.attack}のダメージ！`);

    const speed = getSpeedByStage(currentStage);

    // ⭐ EnemyAttackEffect が終わってから HP を減らす
    setTimeout(() => {
      // エフェクト消す
      setShowEnemyAttackEffect(false);

      setIsBlinking(true);
      animateHP(characterHP, enemy.attack, setCharacterHP, () => {
        const remainingHP = (characterHP ?? 0) - enemy.attack;

        if (remainingHP <= 0) {
          setIsBlinking(false);
          // メッセージをセット
          setDeathMessage(`力尽きてしまった…`);
          setAttackMessage(null);

          setTimeout(() => {
            setFinished(true);
          }, 3500); // 1.5秒表示
        } else {
          setIsBlinking(false);
          setCharacterHP(remainingHP);
          setTimeout(() => {
            setIsAttacking(false);
            setAttackMessage(null);
            nextQuestion();
          }, 1000);
        }
      }, speed);
    }, 1500); // ← この間 EnemyAttackEffect を見せたい時間（1.2秒など好みで）
  };

  const hintCooldown = lastHintUsedIndex !== null && currentIndex - lastHintUsedIndex < 3;
  const healCooldown = lastHealUsedIndex !== null && currentIndex - lastHealUsedIndex < 3;

  const StageIntro = ({ enemy }: { enemy: typeof enemies[0] }) => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-50">
        <img src={enemy.image} alt={enemy.name} className="w-40 h-40 md:w-60 md:h-60 mb-4 animate-bounce" />
        <p className="max-w-[340px] md:max-w-full text-4xl md:text-6xl font-extrabold text-yellow-300 drop-shadow-lg animate-pulse">
          {enemy.name}が現れた！
        </p>
      </div>
    );
  };

  const AttackEffect = ({ chara }: { chara?: (typeof characters)[number] }) => {
    if (!chara) return null;

    const isWarrior = chara.id === "warrior";
    const isFighter = chara.id === "fighter";
    const isWizard = chara.id === "wizard";

    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center z-50 overflow-hidden">

        {/* === 背景エフェクト === */}
        {isWarrior && (
          <div className="absolute inset-0 bg-gradient-to-r from-blue-800 via-blue-500 to-cyan-400 animate-bg-fade"></div>
        )}
        {isFighter && (
          <div className="absolute inset-0 bg-gradient-to-r from-red-700 via-orange-600 to-yellow-400 animate-bg-fade"></div>
        )}
        {isWizard && (
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900 via-indigo-700 to-pink-500 animate-bg-fade"></div>
        )}

        {/* === 技エフェクト === */}

        {/* 剣士：斬撃エフェクト */}
        {isWarrior && (
          <>
            <div className="absolute slash-line rotate-45 animate-slash-1"></div>
            <div className="absolute slash-line rotate-135 animate-slash-2"></div>
            <div className="absolute slash-line rotate-90 animate-slash-3"></div>
            <div className="absolute slash-line rotate-0 animate-slash-4"></div>
          </>
        )}

        {/* 武闘家：拳圧（衝撃波） */}
        {isFighter && (
          <>
            {/* 上の円 */}
            <div className="absolute w-40 h-40 bg-orange-100 rounded-full opacity-0 animate-fist-1"
                style={{ top: "20%", left: "30%", transform: "translateX(-50%)" }}></div>

            {/* 左下の円 */}
            <div className="absolute w-40 h-40 bg-orange-100 rounded-full opacity-0 animate-fist-2"
                style={{ top: "50%", left: "10%", transform: "translate(-50%, -50%)" }}></div>

            {/* 右下の円 */}
            <div className="absolute w-40 h-40 bg-orange-100 rounded-full opacity-0 animate-fist-3"
                style={{ top: "30%", left: "65%", transform: "translate(-50%, -50%)" }}></div>

            {/* 左下の円 */}
            <div className="absolute w-40 h-40 bg-orange-100 rounded-full opacity-0 animate-fist-4"
                style={{ top: "40%", left: "20%", transform: "translate(-50%, -50%)" }}></div>

            {/* 右下の円 */}
            <div className="absolute w-40 h-40 bg-orange-100 rounded-full opacity-0 animate-fist-5"
                style={{ top: "60%", left: "50%", transform: "translate(-50%, -50%)" }}></div>

            {/* 真ん中の円 */}
            <div className="absolute w-40 h-40 bg-orange-100 rounded-full opacity-0 animate-fist-6"
                style={{ top: "38%", left: "33%", transform: "translate(-50%, -50%)" }}></div>
          </>
        )}

        {/* 魔法使い：魔方陣 */}
        {isWizard && (
          <div className="absolute w-56 h-56 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            {/* 外円 */}
            <div className="absolute w-full h-full border-4 border-purple-400 rounded-full animate-rotate-clockwise"></div>
            
            {/* 内側の模様を大きめに */}
            <div className="absolute w-30 h-30 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-t-2 border-r-2 border-purple-300 rotate-0 animate-rotate-counterclockwise"></div>
            <div className="absolute w-30 h-30 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-t-2 border-r-2 border-purple-300 rotate-60 animate-rotate-counterclockwise"></div>
            <div className="absolute w-30 h-30 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-t-2 border-r-2 border-purple-300 rotate-120 animate-rotate-counterclockwise"></div>
            <div className="absolute w-30 h-30 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-t-2 border-r-2 border-purple-300 rotate-180 animate-rotate-counterclockwise"></div>
            <div className="absolute w-30 h-30 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-t-2 border-r-2 border-purple-300 rotate-240 animate-rotate-counterclockwise"></div>
            <div className="absolute w-30 h-30 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-t-2 border-r-2 border-purple-300 rotate-300 animate-rotate-counterclockwise"></div>
          
            {/* 外側に広がる円 */}
            <div className="absolute w-56 h-56 border-2 border-purple-200 rounded-full opacity-50 animate-expand-circle top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
          </div>
        )}


        {/* === キャラ画像（右からスライドイン） === */}
        <img
          src={chara.image}
          alt={chara.name}
          className="w-40 h-40 md:w-60 md:h-60 animate-slide-in"
        />

        {/* === 攻撃文字 === */}
        <p
          className={`mt-4 text-5xl md:text-7xl font-extrabold drop-shadow-2xl animate-swing
            ${isWarrior ? "text-blue-100" : ""}
            ${isFighter ? "text-orange-100" : ""}
            ${isWizard ? "text-purple-100" : ""}
          `}
        >
          {chara.name}の攻撃！
        </p>
      </div>
    );
  };

  const EnemyAttackEffect = ({ enemy }: { enemy: typeof enemies[0] }) => {
    if (!enemy) return null;

    // === ここで敵の種類によって演出を決定 ===
    const id = enemy.id;

    const bgColor =
      id === "slime" ? "bg-gradient-to-r from-red-700 via-purple-800 to-black" :
      id === "goblin" ? "bg-gradient-to-r from-red-700 via-purple-800 to-black" :
      id === "skeleton" ? "bg-gradient-to-r from-red-700 via-purple-800 to-black" :
      id === "mimic" ? "bg-gradient-to-r from-red-700 via-purple-800 to-black" :
      id === "lizardman" ? "bg-gradient-to-r from-red-700 via-purple-800 to-black" :
      id === "golem" ? "bg-gradient-to-r from-red-700 via-purple-800 to-black" :
      id === "cerberus" ? "bg-gradient-to-r from-red-700 via-purple-800 to-black" :
      id === "berserker" ? "bg-gradient-to-r from-red-700 via-purple-800 to-black" :
      id === "dragon" ? "bg-gradient-to-r from-red-800 via-orange-600 to-yellow-400" :
      id === "fenikkusu" ? "bg-gradient-to-r from-red-800 via-orange-600 to-yellow-400" :
      id === "leviathan" ? "bg-gradient-to-r from-blue-900 via-blue-600 to-cyan-400" :
      id === "blackdragon" ? "bg-gradient-to-r from-black via-purple-900 to-red-800" :
      id === "kingdemon" ? "bg-gradient-to-r from-black via-purple-900 to-red-800" :
      id === "kinghydra" ? "bg-gradient-to-r from-black via-purple-900 to-red-800" :
      id === "ordin" ? "bg-gradient-to-r from-gray-900 via-purple-700 to-yellow-400" :
      id === "poseidon" ? "bg-gradient-to-r from-blue-900 via-blue-500 to-yellow-400" :
      id === "hades" ? "bg-gradient-to-r from-indigo-900 via-purple-800 to-black" :
      id === "zeus" ? "bg-gradient-to-r from-blue-800 via-cyan-400 to-white" :
      id === "gundarimyouou" ? "bg-gradient-to-r from-red-800 via-orange-600 to-purple-900" :
      id === "maou" ? "bg-gradient-to-r from-black via-purple-900 to-red-800" :
      id === "yuusya_game" ? "bg-gradient-to-r from-purple-700 via-red-700 to-yellow-400 bg-opacity-80" :
      id === "quizou" ? "bg-gradient-to-r from-red-500 via-orange-400 via-yellow-300 via-green-400 via-blue-500 via-indigo-500 to-purple-600 bg-opacity-90" :
      id === "ancient_dragon" ? "bg-gradient-to-r from-black via-purple-900 to-red-800" :
      id === "dark_knight" ? "bg-gradient-to-r from-black via-purple-900 to-red-800" :
      id === "susanoo" ? "bg-gradient-to-r from-black via-purple-900 to-red-800" :
      id === "takemikazuchi" ? "bg-gradient-to-r from-black via-purple-900 to-red-800" :
      id === "ultimate_dragon" ? "bg-gradient-to-r from-black via-purple-900 to-red-800" :
      id === "fujin" ? "bg-gradient-to-r from-black via-purple-900 to-red-800" :
      id === "raijin" ? "bg-gradient-to-r from-black via-purple-900 to-red-800" :
      id === "quiz_demon_king" ? "bg-gradient-to-r from-black via-purple-900 to-red-800" :
      id === "quiz_emperor" ? "bg-gradient-to-r from-red-500 via-orange-400 via-yellow-300 via-green-400 via-blue-500 via-indigo-500 to-purple-600 bg-opacity-90" :
      "bg-gray-900 bg-opacity-60";

    // 攻撃用カラー
    const textColor =
      id === "slime" ? "text-blue-100" :
      id === "goblin" ? "text-purple-100" :
      id === "skeleton" ? "text-purple-100" :
      id === "mimic" ? "text-purple-100" :
      id === "lizardman" ? "text-purple-100" :
      id === "golem" ? "text-red-100" :
      id === "cerberus" ? "text-red-100" :
      id === "berserker" ? "text-red-100" :
      id === "dragon" ? "text-red-100" :
      id === "fenikkusu" ? "text-red-100" :
      id === "leviathan" ? "text-blue-100" :
      id === "blackdragon" ? "text-purple-100" :
      id === "kingdemon" ? "text-purple-100" :
      id === "kinghydra" ? "text-red-100" :
      id === "ordin" ? "text-gray-100" :
      id === "poseidon" ? "text-blue-100" :
      id === "hades" ? "text-indigo-100" :
      id === "zeus" ? "text-yellow-100" :
      id === "gundarimyouou" ? "text-blue-100" :
      id === "maou" ? "text-purple-100" :
      id === "yuusya_game" ? "text-yellow-100" :
      id === "quizou" ? "text-yellow-100" :
      id === "ancient_dragon" ? "text-purple-100" :
      id === "dark_knight" ? "text-purple-100" :
      id === "susanoo" ? "text-purple-100" :
      id === "takemikazuchi" ? "text-purple-100" :
      id === "ultimate_dragon" ? "text-purple-100" :
      id === "fujin" ? "text-purple-100" :
      id === "raijin" ? "text-purple-100" :
      id === "quiz_demon_king" ? "text-purple-100" :
      id === "quiz_emperor" ? "text-yellow-100" :
      "text-white";

    return (
      <div className={`fixed inset-0 flex flex-col items-center justify-center z-50 overflow-hidden`}>
        
        {/* === 背景（敵ごとに色変更） === */}
        <div className={`absolute inset-0 animate-bg-fade ${bgColor}`}></div>

        {/* === 敵ごとの攻撃エフェクト === */}

        {/* スライム：かわいい水しぶき */}
        {id === "slime" && (
          <div className="absolute z-40 w-50 h-50 bg-blue-300 rounded-full opacity-40 animate-enemy-slime-wave"></div>
        )}

        {/* ゴーレム：パンチ */}
        {id === "golem" && (
          <div className="absolute z-40 w-50 h-50 bg-gray-300 rounded-full opacity-40 animate-enemy-slime-wave"></div>
        )}

        {/* ゴブリン：切りつけ */}
        {(id === "goblin" || id === "skeleton" || id === "lizardman") && (
          <div className="absolute z-40 animate-enemy-slash"></div>
        )}

        {/* ミミック：かみつき */}
        {(id === "mimic" || id === "cerberus") && (
          <>
            {/* 上の歯 */}
            <div className="absolute z-40 w-64 h-34 top-1/2 left-1/2 -translate-x-1/2 -translate-y-[70%] flex justify-center items-start gap-12 z-50">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={`top-${i}`}
                  className="w-3 h-32 bg-white animate-enemy-bite"
                  style={{ animationDelay: "0.5s" }}
                ></div>
              ))}
            </div>

            {/* 下の歯（上下反転＆位置変更） */}
            <div className="absolute z-40 w-64 h-38 top-1/2 left-1/2 -translate-x-1/2 -translate-y-[-10%] flex justify-center items-end gap-12 z-50 rotate-180">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={`bottom-${i}`}
                  className="w-3 h-32 bg-white animate-enemy-bite"
                  style={{ animationDelay: "0.5s" }}
                ></div>
              ))}
            </div>
          </>
        )}

        {/* バーサーカー：切りつけ */}
        {id === "berserker" || id === "susanoo" || id === "takemikazuchi" && (
          <>
            <div className="absolute z-40 w-[150%] h-[4px] bg-white rotate-45 animate-slashb-1"></div>
            <div className="absolute z-40 w-[150%] h-[4px] bg-white rotate-135 animate-slashb-2"></div>
            <div className="absolute z-40 w-[150%] h-[4px] bg-white rotate-90 animate-slashb-3"></div>
          </>
        )}

        {/* フェニックス：炎の波動 */}
        {id === "fenikkusu" && (
          <div className="absolute z-40 w-56 h-56 bg-red-300 opacity-40 rounded-full animate-enemy-fire"></div>
        )}

        {/* フェニックス：炎の波動 */}
        {id === "fenikkusu" && (
          <div className="absolute z-40 w-56 h-56 bg-red-300 opacity-40 rounded-full animate-enemy-fire"></div>
        )}

        {/* リヴァイアサン：水の波動 */}
        {id === "leviathan" && (
          <div className="absolute z-40 w-56 h-56 bg-blue-300 opacity-40 rounded-full animate-enemy-fire"></div>
        )}

        {/* ドラゴン：火炎ブレス */}
        {(id === "dragon" || id === "kinghydra" || id === "ultimate_dragon") && (
          <>
            {/* 前に出る薄い赤の小爆発 */}
            <div className="absolute z-40 w-48 h-48 bg-red-200 opacity-40 rounded-full animate-fire-front z-20"></div>

            {/* 後ろに出る濃い赤の大爆発 */}
            <div className="absolute z-40 w-72 h-72 bg-red-500 opacity-70 rounded-full animate-fire-back z-10"></div>
          </>
        )}

        {/* ブラックドラゴン：闇の爆発 */}
        {(id === "blackdragon" || id === "kingdemon" || id === "maou" || id === "ancient_dragon" || id === "dark_knight") && (
          <>
            {/* 前に出る薄い紫の小爆発 */}
            <div className="absolute z-40 w-48 h-48 bg-purple-200 opacity-40 rounded-full animate-fire-front z-20"></div>

            {/* 後ろに出る紫の大爆発 */}
            <div className="absolute z-40 w-72 h-72 bg-purple-500 opacity-60 rounded-full animate-fire-back z-10"></div>

            {/* 後ろに出る黒の大爆発 */}
            <div className="absolute z-40 w-72 h-72 bg-black opacity-90 rounded-full animate-fire-back2 z-10"></div>
          </>
        )}

        {/* ポセイドン：雷＋津波 */}
        {id === "poseidon" && (
          <>
            <div className="absolute z-40 w-56 h-56 bg-blue-400 opacity-0 rounded-full animate-enemy-tsunami"></div>
            <div className="absolute z-40 w-48 h-48 top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2">
            {/* 三角形の角の位置に落とす稲妻 */}
              <div
                className="absolute z-40 w-5 h-200 bg-yellow-300 opacity-0 animate-enemy-lightning"
                style={{ left: '50%', transform: 'translateX(-50%)', animationDelay: '0s' }}
              ></div>
              <div
                className="absolute z-40 w-5 h-200 bg-yellow-300 opacity-0 animate-enemy-lightning"
                style={{ left: '0%', top: '-40%', animationDelay: '0.2s' }}
              ></div>
              <div
                className="absolute z-40 w-5 h-200 bg-yellow-300 opacity-0 animate-enemy-lightning"
                style={{ left: '100%', top: '-40%', animationDelay: '0.4s' }}
              ></div>
            </div>
            <div className="absolute z-40 w-156 h-156 bg-yellow-300 opacity-0 rounded-full animate-enemy-tsunami" style={{ animationDelay: '0.4s' }}></div>
            <div className="absolute z-40 w-156 h-156 bg-yellow-300 opacity-0 rounded-full animate-enemy-tsunami" style={{ animationDelay: '0.8s' }}></div>
            <div className="absolute z-40 w-156 h-156 bg-blue-300 opacity-0 rounded-full animate-enemy-tsunami" style={{ animationDelay: '1.2s' }}></div>
          </>
        )}

        {/* 軍荼利明王：炎の爆発 */}
        {id === "gundarimyouou" && (
          <>
            {/* 前に出る薄い紫の小爆発 */}
            <div className="absolute z-40 w-48 h-48 bg-purple-200 opacity-40 rounded-full animate-fire-front z-20"></div>

            {/* 後ろに出る紫の大爆発 */}
            <div className="absolute z-40 w-72 h-72 bg-blue-500 opacity-60 rounded-full animate-fire-back z-10"></div>

            {/* 後ろに出る黒の大爆発 */}
            <div className="absolute z-40 w-72 h-72 bg-black opacity-90 rounded-full animate-fire-back2 z-10"></div>
          </>
        )}

        {/* ハデス：冥界の黒炎 */}
        {id === "hades" || id === "quiz_demon_king" || id === "fujin" && (
          <>
            {/* 前に出る薄い紫の小爆発 */}
            <div className="absolute z-40 w-48 h-48 bg-purple-700 opacity-40 rounded-full animate-fire-front z-20"></div>

            {/* 後ろに出る紫の大爆発 */}
            <div className="absolute z-40 w-72 h-72 bg-purple-900 opacity-60 rounded-full animate-fire-back z-10"></div>

            {/* 後ろに出る黒の大爆発 */}
            <div className="absolute z-40 w-72 h-72 bg-black opacity-90 rounded-full animate-fire-back2 z-10"></div>
          </>
        )}

        {/* ゼウス：雷 */}
        {id === "zeus" || id === "raijin" && (
          <>
            <div className="absolute z-40 w-48 h-48 top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2">
            {/* 三角形の角の位置に落とす稲妻 */}
              <div
                className="absolute z-40 w-5 h-200 bg-yellow-300 opacity-0 animate-enemy-lightning"
                style={{ left: '50%', transform: 'translateX(-50%)', animationDelay: '0s' }}
              ></div>
              <div
                className="absolute z-40 w-5 h-200 bg-yellow-300 opacity-0 animate-enemy-lightning"
                style={{ left: '0%', top: '-40%', animationDelay: '0.2s' }}
              ></div>
              <div
                className="absolute z-40 w-5 h-200 bg-yellow-300 opacity-0 animate-enemy-lightning"
                style={{ left: '100%', top: '-40%', animationDelay: '0.4s' }}
              ></div>
              <div
                className="absolute z-40 w-5 h-200 bg-yellow-300 opacity-0 animate-enemy-lightning"
                style={{ left: '-50%', top: '0%', animationDelay: '0.6s' }}
              ></div>
              <div
                className="absolute z-40 w-5 h-200 bg-yellow-300 opacity-0 animate-enemy-lightning"
                style={{ left: '150%', top: '0%', animationDelay: '0.8s' }}
              ></div>
              <div
                className="absolute z-40 w-5 h-200 bg-yellow-300 opacity-0 animate-enemy-lightning"
                style={{ left: '-100%', top: '-40%', animationDelay: '1.0s' }}
              ></div>
              <div
                className="absolute z-40 w-5 h-200 bg-yellow-300 opacity-0 animate-enemy-lightning"
                style={{ left: '200%', top: '-40%', animationDelay: '1.2s' }}
              ></div>
            </div>
            <div className="absolute z-40 w-156 h-156 bg-yellow-300 opacity-0 rounded-full animate-enemy-tsunami" style={{ animationDelay: '0.4s' }}></div>
            <div className="absolute z-40 w-156 h-156 bg-yellow-300 opacity-0 rounded-full animate-enemy-tsunami" style={{ animationDelay: '0.8s' }}></div>
            <div className="absolute z-40 w-156 h-156 bg-yellow-300 opacity-0 rounded-full animate-enemy-tsunami" style={{ animationDelay: '1.2s' }}></div>
          </>
        )}

        {/* オーディン：魔法陣＋剣気 */}
        {id === "ordin" && (
          <>
            <div className="absolute z-40 w-56 h-56 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              {/* 外円 */}
              <div className="absolute z-40 w-full h-full border-4 border-yellow-400 rounded-full animate-rotate-clockwise"></div>
              
              {/* 内側の模様を大きめに */}
              <div className="absolute z-40 w-60 h-60 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-t-2 border-r-2 border-yellow-300 rotate-0 animate-rotate-counterclockwise"></div>
              <div className="absolute z-40 w-60 h-60 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-t-2 border-r-2 border-yellow-300 rotate-60 animate-rotate-counterclockwise"></div>
              <div className="absolute z-40 w-60 h-60 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-t-2 border-r-2 border-yellow-300 rotate-120 animate-rotate-counterclockwise"></div>
              <div className="absolute z-40 w-60 h-60 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-t-2 border-r-2 border-yellow-300 rotate-180 animate-rotate-counterclockwise"></div>
              <div className="absolute z-40 w-60 h-60 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-t-2 border-r-2 border-yellow-300 rotate-240 animate-rotate-counterclockwise"></div>
              <div className="absolute z-40 w-60 h-60 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-t-2 border-r-2 border-yellow-300 rotate-300 animate-rotate-counterclockwise"></div>
            </div>
            <div className="absolute z-40 w-[150%] h-[8px] bg-yellow-300 rotate-45 animate-slashb-1" style={{ animationDelay: '0.6s' }}></div>
            <div className="absolute z-40 w-156 h-156 bg-yellow-300 opacity-0 rounded-full animate-enemy-tsunami" style={{ animationDelay: '0.8s' }}></div>
          </>
        )}

        {/* 初代クイズマスター最強勇者：光の爆発 */}
        {id === "yuusya_game" && (
          <>
            <div className="absolute z-40 w-[150%] h-[8px] bg-yellow-300 rotate-45 animate-slash-1"></div>
            <div className="absolute z-40 w-[150%] h-[8px] bg-yellow-300 rotate-135 animate-slash-2"></div>
            <div className="absolute z-40 w-[150%] h-[8px] bg-yellow-300 rotate-90 animate-slash-3"></div>
            <div className="absolute z-40 w-[150%] h-[8px] bg-yellow-300 rotate-0 animate-slash-4"></div>
            <div className="absolute z-40 w-72 h-72 bg-yellow-300 opacity-40 rounded-full animate-enemy-ultimate" style={{ animationDelay: '1.0s' }}></div>
          </>
        )}

        {/* クイズ王：光の爆発 */}
        {id === "quizou" || id === "quiz_emperor" && (
          <>
            <div className="absolute z-40 w-72 h-72 bg-yellow-300 opacity-40 rounded-full animate-enemy-ultimate" style={{ animationDelay: '0.8s' }}></div>
          </>
        )}

        {/* === 敵画像（左からスライドイン） === */}
        <img
          src={enemy.image}
          alt={enemy.name}
          className="relative z-20 w-40 h-40 md:w-60 md:h-60 animate-enemy-slide-in"
        />

        {/* === 敵攻撃文字 === */}
        <p className={`mt-4 text-5xl md:text-7xl font-extrabold drop-shadow-2xl animate-enemy-swing ${textColor}`}>
          {enemy.name}の攻撃！
        </p>
      </div>
    );
  };

  // ステージごとに減少スピードを返す関数
  const getSpeedByStage = (stage: number) => {
    if (stage <= 2) return 20;
    if (stage <= 4) return 10;
    if (stage <= 6) return 5;
    return 0; // 7以上
  };

  // const getCharacterAttack = () => {
  //   const base = characters.find(c => c.id === character)?.Attack ?? 0;
  //   return Math.floor(base * (1 + (characterLevel-1) * 0.2));
  // };

  const getCharacterAttack = () => {
    const base = characters.find(c => c.id === character)?.Attack ?? 0;

    // ✅ シークレットだけ「初期の2.5倍」で固定（レベル無視）
    if (isSecret) return base * 2.5;

    // ✅ 通常はレベルで伸びる
    return Math.floor(base * (1 + (characterLevel - 1) * 0.2));
  };

  // ★ 追加：finished になったタイミングで「獲得ポイント計算(ステージ別)」→「ログインなら加算」
  // ============================
  // ✅ finished 時：計算 → pending 保存 → 付与を試す
  // ============================
  useEffect(() => {
    if (!finished) return;
    if (userLoading) return; // ← userの揺れ対策（判定を安定させる）

    let points = calcEarnedPointsByClearedStage(correctCount);
    let exp = calcEarnedExpByCorrectCount(quizCorrectCount);

    // ✅ シークレットボスを倒した時だけ特別報酬
    const isSecretBossCleared = course === "secret" && correctCount >= 1;

    if (isSecretBossCleared) {
      const r = calcSecretRewardByBoss(boss, variant);
      points = r.points;
      exp = r.exp;
    }

    setEarnedPoints(points);
    setEarnedExp(exp);

    // ✅ finished になったら必ず “保留” を作る（取りこぼしゼロ）
    savePendingAward({ correctCount, points, exp });

    // ✅ そのまま付与を試す（ログインできてれば即付与、できなければ need_login）
    awardPointsAndExp({ correctCount, points, exp });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished, correctCount, quizCorrectCount, userLoading]);

  // ============================
  // ✅ 取りこぼし防止：マウント時に pending を拾う
  // ============================
  useEffect(() => {
    (async () => {
      const pending = loadPendingAward();
      if (!pending) return;
      await awardPointsAndExp(pending);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onVisibility = async () => {
      if (document.visibilityState !== "visible") return;
      await supabase.auth.refreshSession();

      if (finishedRef.current && !awardedOnceRef.current) {
        await awardPointsAndExp();
      }
    };

    const onFocus = async () => {
      await supabase.auth.refreshSession();

      if (finishedRef.current && !awardedOnceRef.current) {
        await awardPointsAndExp();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // ★ クイズダンジョン：成績(到達ステージ)＆称号を保存 → 新記録/新称号ならモーダル
  useEffect(() => {
    if (!finished) return;
    if (sentRef.current) return;
    sentRef.current = true;

    // 未ログインなら送らない（任意）
    if (!userLoading && !user) return;

    (async () => {
      try {
        const weekStart = getWeekStartJST();
        const monthStart = getMonthStartJST();

        // ✅ 週間ランキングに反映したい値を決める
        // score: 今回獲得ポイントを加算、correct: 正解数、play: 1回、best_streak: max更新
        const { error: weeklyErr } = await supabase.rpc("upsert_weekly_stats", {
          p_user_id: user!.id,
          p_week_start: weekStart,
          p_score_add: 0,
          p_correct_add: correctCount,
          p_play_add: 1,
          p_best_streak: 0,
        });

        if (weeklyErr) {
          console.log("upsert_weekly_stats error:", weeklyErr);
          // ランキング保存失敗してもゲームは止めない
        }

        // ✅ 月
        const { error: monthlyErr } = await supabase.rpc("upsert_monthly_stats", {
          p_user_id: user!.id,
          p_month_start: monthStart,
          p_score_add: 0,
          p_correct_add: correctCount,
          p_play_add: 1,
          p_best_streak: 0,
        });
        if (monthlyErr) console.log("upsert_monthly_stats error:", monthlyErr);

        // 到達ステージ（= 倒した数 = correctCount）
        const clearedStage = correctCount;

        // ステージに応じた称号を計算
        const title = (course === "secret" && correctCount >= 1)
          ? getSecretResult(boss || "ancient_dragon", variant).title
          : calcTitle(titles, clearedStage);

        const res = await submitGameResult(supabase, {
          game: "dungeon",      // ← あなたのDB設計に合わせた識別子
          stage: clearedStage,  // ← “最高到達ステージ” を score に入れる
          title,
          writeLog: true,
        });

        const modal = buildResultModalPayload("dungeon", res);
        if (modal) pushModal(modal);

        const refetchRankingTop10 = async () => {
          const { data, error } = await supabase
            .from("user_public_profiles")
            .select("user_id, username, avatar_url, best_stage")
            .order("best_stage", { ascending: false })
            .limit(10);

          if (!error) setRankingRows((data ?? []) as any);
        };

        const { error: bsErr } = await supabase.rpc("update_best_stage", {
          p_user_id: user!.id,
          p_best_stage: clearedStage,
        });

        if (!bsErr) {
          await refetchRankingTop10(); // ✅ これで即反映
        }
      } catch (e) {
        console.error("[dungeon] submitGameResult error:", e);
      }
    })();
  }, [finished, userLoading, user, correctCount, titles, supabase, pushModal]);

  
  // ✅ リザルト突入時（finished=true）に、シークレットクリアなら獲得モーダルを出す
  useEffect(() => {
    if (!finished) return;

    // リトライ等でfinishedになっても1回だけにする
    if (acquiredOnceRef.current) return;

    // シークレット以外/未クリアなら何もしない
    if (!(course === "secret" && correctCount >= 1)) return;

    // 未ログインなら（あなたの方針次第）…今回は「何もしない」にしておく
    if (!user) return;

    const bossNo = getBossNoById(boss, variant);
    if (!bossNo) return;

    acquiredOnceRef.current = true;

    // 「モーダル表示 → RPC登録」
    acquireBossCharacterByNo(bossNo);
  }, [finished, course, correctCount, user, boss, variant]);

  // キャラクター選択前は CharacterSelect を表示
  if (!character) {
    return <CharacterSelect onSelect={setCharacter} />;
  }

  // if (questions.length === 0) return <p></p>;

  if (!character) return <CharacterSelect onSelect={setCharacter} />;

  if (!questionsReady) {
    return (
      <div className="container mx-auto p-8 text-center">
        <p className="text-xl font-bold">問題を読み込み中...</p>
      </div>
    );
  }

  // Xシェア機能
  const handleShareX = () => {
    const text = [
      "【ひまQ｜クイズダンジョン⚔】",
      `クリアステージ：ステージ${correctCount}`,
      `称号：${getTitle()}`,
      `獲得：${earnedPoints}P / ${earnedExp}EXP`,
      "",
      "👇ひまQ（みんなで遊べるクイズ）",
      "#ひまQ #クイズ #クイズゲーム",
    ].join("\n");

    openXShare({ text, url: buildTopUrl() }); // ✅トップへ
  };

  const secretCleared = isSecret && correctCount >= 1;

  return (
    <>
      <ConfirmExitModal
        open={exitOpen}
        onClose={() => setExitOpen(false)}
        onConfirm={() => {
          setExitOpen(false);
          finishQuiz();
        }}
      />
      <CharacterAcquireModal
        open={acquireOpen}
        item={acquired}
        verb="手に入れた！"
        onClose={() => {
          setAcquireOpen(false);
          setAcquired(null);
        }}
      />
      {showStageIntro && <StageIntro enemy={getEnemyForStage(currentStage + 1, course, boss, variant)} />}
      {showAttackEffect && (
        <AttackEffect chara={characters.find((c) => c.id === character)} />
      )}
      {showEnemyAttackEffect && (
        <EnemyAttackEffect enemy={getEnemyForStage(currentStage + 1, course, boss)} />
      )}
      <div className="container mx-auto p-8 text-center bg-gradient-to-b from-purple-50 via-purple-100 to-purple-200">
        {!finished ? (
          <>
            <h2 className="text-5xl md:text-6xl font-extrabold mb-6 text-purple-500 drop-shadow-lg">
              STAGE {currentStage + 1}
            </h2>

            <div className="mb-3 bg-white p-3 border-2 border-purple-300 rounded-xl mx-auto w-full max-w-md md:max-w-xl">
              <p className="text-xl md:text-2xl text-center mb-2">{getEnemyForStage(currentStage + 1, course, boss, variant).name}が現れた！クイズに正解して倒そう！</p>
              {/* 横並び */}
              <div className="flex flex-col items-center md:flex-row justify-center md:gap-12">
                {/* 自分のキャラクター */}
                {character && (
                  <div
                    className={`flex items-center gap-4 mb-2 md:mb-0 p-3 rounded-xl ${
                      isBlinking ? "red-blink" : "border-purple-300"
                    } ${
                      character === "warrior"
                        ? "bg-gradient-to-r from-blue-400 via-blue-200 to-cyan-300"
                        : character === "fighter"
                        ? "bg-gradient-to-r from-red-400 via-orange-200 to-yellow-300"
                        : character === "wizard"
                        ? "bg-gradient-to-r from-purple-400 via-pink-200 to-pink-300"
                        : "bg-gray-200"
                    }`}
                  >
                    <img
                      src={characters.find(c => c.id === character)?.image}
                      alt={characters.find(c => c.id === character)?.name}
                      className="w-20 h-20 md:w-24 md:h-24"
                    />
                    <div className="flex flex-col items-start">
                      <p className="text-xl md:text-2xl font-bold">
                        {characters.find((c) => c.id === character)?.name}
                      </p>
                      <p className="text-sm md:text-xl font-semibold">
                        レベル：{characterLevel}
                      </p>
                      <p className="text-sm md:text-xl font-semibold">
                        HP：{characterHP}
                      </p>
                      <p className="text-sm md:text-xl font-semibold">
                        攻撃力：{getCharacterAttack()}
                      </p>
                    </div>
                  </div>
                )}

                {/* 敵キャラクター */}
                <div className="flex flex-col gap-1 md:gap-2">
                  <div className={`flex items-center gap-4 bg-gradient-to-r from-red-700 via-purple-800 to-black p-3 rounded-xl ${isBlinkingEnemy ? "red-blink" : "border-purple-300"} transition-opacity duration-1000 ${enemyVisible ? "opacity-100" : "opacity-0"}`}>
                    <img
                      src={getEnemyForStage(currentStage + 1, course, boss, variant).image}
                      alt={getEnemyForStage(currentStage + 1, course, boss, variant).name}
                      className="w-20 h-20 md:w-24 md:h-24"
                    />
                    <div className="flex flex-col items-start">
                      <p className="text-xl md:text-2xl font-bold text-purple-200 max-w-[100px]">
                        {getEnemyForStage(currentStage + 1, course, boss, variant).name}
                      </p>
                      <p className="text-sm md:text-xl font-semibold text-purple-200">
                        HP： {enemyHP}
                      </p>
                      <p className="text-sm md:text-xl font-semibold text-purple-200">
                        攻撃力：{getEnemyForStage(currentStage + 1, course, boss, variant).attack}
                      </p>
                    </div>
                  </div>
                  <p className="text-lg md:text-xl font-semibold text-gray-600 w-50 md:w-55">
                    {getEnemyForStage(currentStage + 1, course, boss, variant).description}
                  </p>
                </div>
              </div>
            </div>

            {attackMessage && (
              <p className="text-2xl md:text-4xl font-bold mb-4">
                {attackMessage}
              </p>
            )}

            {enemyDefeatedMessage && (
              <p className="text-2xl md:text-4xl font-bold text-blue-500 mb-1 md:mb-4 animate-bounce">
                {enemyDefeatedMessage}
              </p>
            )}

            {levelUpMessage && (
              <div className="flex flex-col items-center gap-2 mb-4">
                <p className="text-2xl md:text-4xl font-bold md:mb-4 animate-bounce 
                              bg-gradient-to-r from-blue-500 via-red-500 to-yellow-500 
                              text-transparent bg-clip-text drop-shadow-lg">
                  {levelUpMessage}
                </p>
                <p className="text-2xl md:text-4xl font-bold md:mb-4 animate-bounce 
                              bg-red-500
                              text-transparent bg-clip-text drop-shadow-md">
                  攻撃力が上がった！
                </p>
                <p className="text-2xl md:text-4xl font-bold md:mb-4 animate-bounce 
                              bg-green-500
                              text-transparent bg-clip-text drop-shadow-md">
                  HPが上がった！
                </p>
              </div>
            )}

            {miracleSeedMessage && (
              <p className="
                text-center 
                text-2xl md:text-4xl 
                font-extrabold 
                mb-3 
                bg-gradient-to-r from-yellow-400 via-red-400 to-pink-500 
                text-transparent 
                bg-clip-text 
                drop-shadow-[0_0_10px_yellow] 
                animate-bounce
              ">
                {miracleSeedMessage}
              </p>
            )}

            {/* 次のステージへ進むボタン */}
            {showNextStageButton && (
              <button
                className="px-5 py-3 md:px-6 md:py-4 mb-3 text-white text-xl md:text-2xl font-bold rounded-xl 
                          bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600
                          hover:from-purple-500 hover:via-purple-600 hover:to-purple-600
                          shadow-lg shadow-pink-300 cursor-pointer animate-pulse"
                onClick={() => {
                  const nextStage = currentStage + 1;
                  setCurrentStage(nextStage);

                  const nextEnemy = getEnemyForStage(nextStage + 1, course, boss, variant);
                  setEnemyHP(nextEnemy.hp);

                  // メッセージを消す
                  setEnemyDefeatedMessage(null);
                  setLevelUpMessage(null);
                  setIsAttacking(false);
                  setShowNextStageButton(false);
                  setEnemyVisible(true);
                  setMiracleSeedMessage(null);

                  nextQuestion();
                }}
              >
                次のステージへ進む
              </button>
            )}

            {deathMessage && (
              <p className="text-2xl md:text-4xl font-bold text-red-500 mb-4 animate-bounce">
                {deathMessage}
              </p>
            )}

            {questions[currentIndex].quiz && (
              <>
                {(showCorrectMessage || incorrectMessage) && (
                  <>
                    {showCorrectMessage && (
                      <p className="text-4xl md:text-6xl font-extrabold mb-2 text-green-600 drop-shadow-lg animate-bounce animate-pulse">
                        ◎正解！🎉
                      </p>
                    )}
                    {incorrectMessage && (
                      <p className="text-3xl md:text-4xl font-extrabold mb-2 text-red-500 drop-shadow-lg animate-shake whitespace-pre-line">
                        {incorrectMessage}
                      </p>
                    )}
                    {(() => {
                      const currentQuiz = questions[currentIndex].quiz;
                      const answerExplanation = currentQuiz?.answerExplanation;
                      const trivia = currentQuiz?.trivia;

                      return (
                        <>
                          {answerExplanation && (
                            <div className="mt-5 md:mt-15 text-center">
                              <p className="text-xl md:text-2xl font-bold text-blue-600">解説📖</p>
                              <p className="mt-1 md:mt-2 text-lg md:text-xl text-gray-700">{answerExplanation}</p>
                            </div>
                          )}

                          {trivia && (
                            <div className="mt-5 md:mt-10 text-center">
                              <p className="text-xl md:text-2xl font-bold text-yellow-600">知って得する豆知識💡</p>
                              <p className="mt-1 md:mt-2 text-lg md:text-xl text-gray-700">{trivia}</p>
                            </div>
                          )}
                        </>
                      );
                    })()}

                    <div className="mt-10">
                      {showCorrectMessage && (
                        <button
                          className="px-5 py-3 md:px-6 md:py-3 border border-gray-600 text-white text-lg md:text-xl font-medium rounded bg-gradient-to-r from-red-500 via-yellow-500 to-pink-500 hover:from-pink-600 hover:via-red-600 hover:to-yellow-600 cursor-pointer"
                          onClick={attackEnemy}
                        >
                          自分の攻撃！🔥
                        </button>
                      )}
                      {incorrectMessage && (
                        <button
                          className="px-5 py-3 md:px-6 md:py-3 text-white text-lg md:text-xl font-medium rounded border border-black
                                    bg-gradient-to-r from-red-700 via-purple-800 to-black
                                    hover:from-purple-700 hover:via-red-800 hover:to-black
                                    shadow-lg shadow-red-800 cursor-pointer"
                          onClick={attackCharacter}
                        >
                          相手からの攻撃！💀
                        </button>
                      )}
                    </div>
                  </>
                )}

                {!showCorrectMessage && !incorrectMessage && !isAttacking && (
                  <p className="text-2xl md:text-3xl font-bold mb-4 text-red-500">
                    回答タイマー: {timeLeft} 秒
                  </p>
                )}

                {/* 選択肢表示 */}
                {!showCorrectMessage && !incorrectMessage && !isAttacking && (
                  <QuizQuestion
                    key={questions[currentIndex].id} 
                    quiz={questions[currentIndex].quiz}
                    userAnswer={userAnswer}
                    setUserAnswer={setUserAnswer}
                  />
                )}

                {!showCorrectMessage && !incorrectMessage && !isAttacking && (
                  <>
                    {/* 魔法使い専用ボタン */}
                    {showMagicButtons && (
                      <div>
                        <p className="text-lg md:text-xl">能力を使用するとその能力は2ターン使用できません</p>
                        <div className="flex justify-center gap-2 md:gap-4 mt-2 mb-2">
                          <button
                            disabled={hintCooldown}
                            className={`
                              flex-1 md:max-w-[220px] px-4 py-2 text-lg md:text-xl font-bold rounded-lg shadow-md border transition-all
                              ${hintCooldown
                                ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                                : "bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 text-black hover:from-yellow-500 hover:via-yellow-400 hover:to-yellow-600 border-yellow-600"
                              }
                            `}
                            onClick={() => {
                              if (hintCooldown) return;
                              setHintText(questions[currentIndex].quiz?.hint || "ヒントはありません");
                              setLastHintUsedIndex(currentIndex); // ★ 使用した問題番号を記録
                            }}
                          >
                            ヒントを見る🔮
                          </button>

                          <button
                            disabled={healCooldown}
                            className={`
                              flex-1 md:max-w-[220px] px-4 py-2 text-lg md:text-xl font-bold rounded-lg shadow-md border transition-all
                              ${healCooldown
                                ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                                : "bg-gradient-to-r from-green-400 via-green-300 to-green-500 text-black hover:from-green-500 hover:via-green-400 hover:to-green-600 border-green-600"
                              }
                            `}
                            onClick={() => {
                              if (healCooldown) return;

                              const mul = isSecret ? 10 : 1;          // ✅ secretだけ10倍
                              const healHp = characterLevel * 30 * mul;
                              const healText = characterLevel * 30 * mul;

                              setCharacterHP(prev => (prev ?? 0) + healHp);
                              setHealing(healText);
                              setLastHealUsedIndex(currentIndex);
                            }}
                          >
                            HP回復✨
                          </button>
                        </div>
                      </div>
                    )}
                    {/* ヒント表示 */}
                    {hintText && (
                      <div className="bg-white border-2 border-gray-400 p-2 rounded-xl max-w-md mx-auto">
                        <p className="text-center text-xl md:text-2xl font-semibold text-black mb-2">
                          ヒント💡
                        </p>
                        <p className="text-center text-xl md:text-2xl font-semibold text-blue-600 mb-2">
                          {hintText}
                        </p>
                      </div>
                    )}
                    {/* レベルアップ表示 */}
                    {levelUp && (
                      <p className="text-center text-xl md:text-2xl 
                                    font-semibold mb-1 
                                    bg-gradient-to-r from-blue-500 via-red-400 to-yellow-500 
                                    text-transparent bg-clip-text animate-pulse">
                        レベルが {levelUp} 上がった！
                      </p>
                    )}
                    {/* 攻撃力アップ表示 */}
                    {levelUp && (
                      <p className="text-center text-xl md:text-2xl text-red-500 font-semibold text-black mb-1 animate-pulse">
                        攻撃力が上がった！
                      </p>
                    )}
                    {/* 回復表示 */}
                    {healing && (
                      <p className="text-center text-xl md:text-2xl text-green-500 font-semibold text-black mb-1 animate-pulse">
                        HPが {healing} 上がった！✨
                      </p>
                    )}
                  </>
                )}

                {miracleSeedCount > 0 && !isAttacking && !showCorrectMessage && !incorrectMessage && (
                  <>
                    <div>
                      <p className="text-lg md:text-xl">能力が上がるといわれている伝説の果実</p>
                      <div className="flex justify-center gap-2 md:gap-4 mt-2 mb-2">
                        <button
                          className="px-5 py-3 md:px-6 border-2 border-pink-200 bg-gradient-to-r from-yellow-400 via-red-400 to-pink-500 text-white text-lg md:text-xl font-bold  rounded-lg shadow-md hover:from-yellow-500 hover:via-red-500 hover:to-pink-600 transition-all cursor-pointer"
                          onClick={() => {
                            setCharacterHP(prev => (prev ?? 0) + 5000);
                            setCharacterLevel(prev => prev + 50); // 攻撃力にもレベル依存して加算されます
                            setMiracleSeedCount(prev => prev - 1);
                            setLevelUp(50); // レベルアップ表示
                            setHealing(5000); // 回復表示
                          }}
                        >
                          伝説の果実🍏を使う
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* 回答ボタン */}
                {!showCorrectMessage && !incorrectMessage && !isAttacking && (
                  <button
                    className="px-5 py-3 md:px-6 bg-blue-500 text-white text-lg md:text-xl font-medium rounded mt-2 hover:bg-blue-600 cursor-pointer font-extrabold"
                    onClick={checkAnswer}
                    disabled={userAnswer === null}
                  >
                    回答
                  </button>
                )}

                {!showCorrectMessage && !incorrectMessage && !isAttacking && (
                  <div>
                    <button
                      className="
                        px-5 py-2.5 md:px-6 md:py-3
                        mt-20
                        rounded-full
                        font-extrabold text-white text-lg md:text-xl
                        bg-gradient-to-r from-sky-800 via-blue-800 to-indigo-800
                        hover:shadow-2xl hover:scale-[1.03]
                        active:scale-95
                        transition-all duration-200
                        cursor-pointer
                      "
                      onClick={() => setExitOpen(true)}
                    >
                      冒険を終了する
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <QuizResult
            correctCount={correctCount}
            getTitle={getTitle}
            titles={titles}
            earnedPoints={earnedPoints}
            earnedExp={earnedExp} 
            isLoggedIn={!!user}
            awardStatus={awardStatus}
            onGoLogin={() => router.push("/user/login")}
            onShareX={handleShareX}
            onRetry={resetGame}
            isSecret={isSecret}
            secretBossName={secretEnemy?.name}
            secretTitle={secretRes?.title}
            secretComment={secretRes?.comment}
            secretCleared={secretCleared}
            rankingRows={rankingRows}
          />
        )}
      </div>
    </>
  );
}
