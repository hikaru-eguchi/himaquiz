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
import confetti from "canvas-confetti";
import RecommendedSoloGames from "@/app/components/RecommendedSoloGames";

const fireConfetti = () => {
  // 低負荷設定：粒数少なめ・短時間・一回だけ
  confetti({
    particleCount: 60,     // ここ増やすと重くなる
    spread: 70,
    startVelocity: 35,
    ticks: 140,            // 表示時間（短いほど軽い）
    gravity: 0.9,
    scalar: 0.9,           // 粒サイズ（小さいほど軽い）
    origin: { y: 0.6 },
  });

  // ちょい追加で気持ちよさUP（でも軽い）
  confetti({
    particleCount: 25,
    spread: 120,
    startVelocity: 20,
    ticks: 120,
    gravity: 1.1,
    scalar: 0.8,
    origin: { y: 0.6 },
  });
};


// =====================
// ポイント仕様（ステージ到達に応じて付与）
// =====================
const stagePointMap: Record<number, number> = {
  1: 20,
  2: 40,
  3: 60,
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


function calcEarnedPointsByClearedStage(clearedStage: number) {
  return stagePointMap[clearedStage] ?? 0;
}

function calcEarnedExpByCorrectCount(correctCount: number) {
  return correctCount * 20;
}

type AwardStatus = "idle" | "awarding" | "awarded" | "need_login" | "error";

// =====================

// 敵情報
const enemies = [
  { no: "107", name: "きまぐれモンスター【いぬ】", image: "/images/きまぐれモンスター【いぬ】.png", description: "犬の姿をした気まぐれなモンスター。しっぽを振っているが、誰に向けているのかは不明。たまに走り回るが、戦う気はない。" },
  { no: "108", name: "きまぐれモンスター【ねこ】", image: "/images/きまぐれモンスター【ねこ】.png", description: "猫の姿をした気まぐれなモンスター。気が向いたときだけ近づいてくるが、すぐにどこかへ行ってしまう。攻撃はしない。" },
  { no: "109", name: "きまぐれモンスター【うし】", image: "/images/きまぐれモンスター【うし】.png", description: "牛の姿をした気まぐれなモンスター。のんびり草を眺めているだけで、特に何もしない。争いには興味がない。" },
  { no: "110", name: "きまぐれモンスター【うま】", image: "/images/きまぐれモンスター【うま】.png", description: "馬の姿をした気まぐれなモンスター。遠くを見つめながらゆっくり歩いているが、目的地はない。戦うことはない。" },
  { no: "111", name: "きまぐれモンスター【うさぎ】", image: "/images/きまぐれモンスター【うさぎ】.png", description: "うさぎの姿をした気まぐれなモンスター。ぴょんぴょん跳ねているが、本人は眠そう。戦いには興味がない。" },
  { no: "112", name: "きまぐれモンスター【くま】", image: "/images/きまぐれモンスター【くま】.png", description: "くまの姿をした気まぐれなモンスター。強そうに見えるが、実際はぼーっとしているだけ。攻撃はしない。" },
  { no: "113", name: "きまぐれモンスター【とら】", image: "/images/きまぐれモンスター【とら】.png", description: "虎の姿をした気まぐれなモンスター。鋭い目をしているが、実は何も考えていない。戦う気はない。" },
  { no: "114", name: "きまぐれモンスター【ライオン】", image: "/images/きまぐれモンスター【ライオン】.png", description: "ライオンの姿をした気まぐれなモンスター。王者の風格を漂わせるが、ただ昼寝しているだけ。攻撃はしない。" },
  { no: "115", name: "きまぐれモンスター【オオカミ】", image: "/images/きまぐれモンスター【オオカミ】.png", description: "オオカミの姿をした気まぐれなモンスター。遠吠えをすることもあるが、意味はない。戦いには興味がない。" },
  { no: "116", name: "きまぐれモンスター【たつ】", image: "/images/きまぐれモンスター【たつ】.png", description: "竜の姿をした気まぐれなモンスター。伝説級の雰囲気を持つが、本人はただ浮かんでいるだけ。攻撃はしない。" },
  { no: "117", name: "きまぐれモンスター【ペンギン】", image: "/images/きまぐれモンスター【ペンギン】.png", description: "ペンギンの姿をした気まぐれなモンスター。氷の上を歩いているが、どこへ行くかは不明。戦う気はない。" },
  { no: "118", name: "きまぐれモンスター【アザラシ】", image: "/images/きまぐれモンスター【アザラシ】.png", description: "アザラシの姿をした気まぐれなモンスター。ごろごろ転がっているだけで、特に何もしない。攻撃はしない。" },
  { no: "119", name: "きまぐれモンスター【イルカ】", image: "/images/きまぐれモンスター【イルカ】.png", description: "イルカの姿をした気まぐれなモンスター。楽しそうに跳ねているが、本人は深く考えていない。戦う気はない。" },
  { no: "120", name: "きまぐれモンスター【サメ】", image: "/images/きまぐれモンスター【サメ】.png", description: "サメの姿をした気まぐれなモンスター。危険そうに見えるが、実はのんびり屋。攻撃はしない。" },
  { no: "121", name: "きまぐれモンスター【カジキ】", image: "/images/きまぐれモンスター【カジキ】.png", description: "カジキの姿をした気まぐれなモンスター。高速で泳いでいるが、どこへ行くかは気分次第。戦わない。" },

  { no: "122", name: "きまぐれモンスター【おにぎり】", image: "/images/きまぐれモンスター【おにぎり】.png", description: "おにぎりの姿をした気まぐれなモンスター。おいしそうに見えるが、自分では食べない。攻撃はしない。" },
  { no: "123", name: "きまぐれモンスター【寿司】", image: "/images/きまぐれモンスター【寿司】.png", description: "寿司の姿をした気まぐれなモンスター。輝くネタを持つが、本人は無関心。戦う気はない。" },
  { no: "124", name: "きまぐれモンスター【ラーメン】", image: "/images/きまぐれモンスター【ラーメン】.png", description: "ラーメンの姿をした気まぐれなモンスター。湯気を出しているが、ただぼーっとしているだけ。攻撃はしない。" },
  { no: "125", name: "きまぐれモンスター【ハンバーガー】", image: "/images/きまぐれモンスター【ハンバーガー】.png", description: "ハンバーガーの姿をした気まぐれなモンスター。豪華に見えるが、本人は眠そう。戦いには興味がない。" },
  { no: "126", name: "きまぐれモンスター【カレーライス】", image: "/images/きまぐれモンスター【カレーライス】.png", description: "カレーライスの姿をした気まぐれなモンスター。スパイスの香りを漂わせるが、本人は何もしない。攻撃はしない。" },
  { no: "127", name: "きまぐれモンスター【フライドチキン】", image: "/images/きまぐれモンスター【フライドチキン】.png", description: "フライドチキンの姿をした気まぐれなモンスター。香ばしい見た目だが、本人は無気力。戦う気はない。" },
  { no: "128", name: "きまぐれモンスター【ピザ】", image: "/images/きまぐれモンスター【ピザ】.png", description: "ピザの姿をした気まぐれなモンスター。色とりどりの具材を持つが、特に意味はない。攻撃はしない。" },
  { no: "129", name: "きまぐれモンスター【たこ焼き】", image: "/images/きまぐれモンスター【たこ焼き】.png", description: "たこ焼きの姿をした気まぐれなモンスター。ころころ転がっているが、目的はない。戦う気はない。" },
  { no: "130", name: "きまぐれモンスター【たい焼き】", image: "/images/きまぐれモンスター【たい焼き】.png", description: "たい焼きの姿をした気まぐれなモンスター。甘い香りを漂わせるが、本人は無関心。攻撃はしない。" },
  { no: "131", name: "きまぐれモンスター【メロンパン】", image: "/images/きまぐれモンスター【メロンパン】.png", description: "メロンパンの姿をした気まぐれなモンスター。ふわふわ浮かんでいるが、特に何もしない。戦わない。" },
  { no: "132", name: "きまぐれモンスター【パンケーキ】", image: "/images/きまぐれモンスター【パンケーキ】.png", description: "パンケーキの姿をした気まぐれなモンスター。甘い雰囲気をまとっているが、本人はぼーっとしているだけ。" },
  { no: "133", name: "きまぐれモンスター【ショートケーキ】", image: "/images/きまぐれモンスター【ショートケーキ】.png", description: "ショートケーキの姿をした気まぐれなモンスター。華やかに見えるが、本人はやる気ゼロ。攻撃はしない。" },
  { no: "134", name: "きまぐれモンスター【ドーナツ】", image: "/images/きまぐれモンスター【ドーナツ】.png", description: "ドーナツの姿をした気まぐれなモンスター。くるくる回っているが、意味はない。戦う気はない。" },
  { no: "135", name: "きまぐれモンスター【マカロン】", image: "/images/きまぐれモンスター【マカロン】.png", description: "マカロンの姿をした気まぐれなモンスター。カラフルだが、本人は無気力。攻撃はしない。" },
  { no: "136", name: "きまぐれモンスター【パフェ】", image: "/images/きまぐれモンスター【パフェ】.png", description: "パフェの姿をした気まぐれなモンスター。豪華に見えるが、本人はただ立っているだけ。戦う気はない。" },

  { no: "137", name: "きまぐれモンスター【探偵】", image: "/images/きまぐれモンスター【探偵】.png", description: "探偵の姿をした気まぐれなモンスター。難事件を解けそうな雰囲気だが、実際は昼寝しているだけ。推理も戦いもしない。" },
  { no: "138", name: "きまぐれモンスター【画家】", image: "/images/きまぐれモンスター【画家】.png", description: "画家の姿をした気まぐれなモンスター。名画を描けそうに見えるが、キャンバスを眺めているだけ。戦う気はない。" },
  { no: "139", name: "きまぐれモンスター【ミュージシャン】", image: "/images/きまぐれモンスター【ミュージシャン】.png", description: "ミュージシャンの姿をした気まぐれなモンスター。世界を震わせる音を出しそうだが、実際は適当に音を鳴らしているだけ。攻撃はしない。" },
  { no: "140", name: "きまぐれモンスター【宇宙飛行士】", image: "/images/きまぐれモンスター【宇宙飛行士】.png", description: "宇宙飛行士の姿をした気まぐれなモンスター。宇宙の謎を知っていそうだが、ただ漂っているだけ。戦う気はない。" },
  { no: "141", name: "きまぐれモンスター【ハッカー】", image: "/images/きまぐれモンスター【ハッカー】.png", description: "ハッカーの姿をした気まぐれなモンスター。世界を操れそうな雰囲気だが、実際は画面を眺めているだけ。攻撃はしない。" },
  { no: "142", name: "きまぐれモンスター【魔法使い】", image: "/images/きまぐれモンスター【魔法使い】.png", description: "魔法使いの姿をした気まぐれなモンスター。強力な魔法を使えそうだが、杖を持っているだけ。戦う気はない。" },
  { no: "143", name: "きまぐれモンスター【忍者】", image: "/images/きまぐれモンスター【忍者】.png", description: "忍者の姿をした気まぐれなモンスター。影に溶け込んでいるが、特に何もしていない。攻撃はしない。" },
  { no: "144", name: "きまぐれモンスター【戦国武将】", image: "/images/きまぐれモンスター【戦国武将】.png", description: "戦国武将の姿をした気まぐれなモンスター。天下を取れそうな風格だが、ただ座っているだけ。戦う気はない。" },
  { no: "145", name: "きまぐれモンスター【海賊】", image: "/images/きまぐれモンスター【海賊】.png", description: "海賊の姿をした気まぐれなモンスター。宝を探していそうだが、実際は波を眺めているだけ。攻撃はしない。" },
  { no: "146", name: "きまぐれモンスター【怪獣】", image: "/images/きまぐれモンスター【怪獣】.png", description: "怪獣の姿をした気まぐれなモンスター。都市を破壊できそうだが、ただ立っているだけ。戦う気はない。" },
  { no: "147", name: "きまぐれモンスター【おばけ】", image: "/images/きまぐれモンスター【おばけ】.png", description: "おばけの姿をした気まぐれなモンスター。人を驚かせそうだが、本人は眠そう。攻撃はしない。" },
  { no: "148", name: "きまぐれモンスター【ロボット】", image: "/images/きまぐれモンスター【ロボット】.png", description: "ロボットの姿をした気まぐれなモンスター。高性能に見えるが、ほとんど動かない。戦う気はない。" },
  { no: "149", name: "きまぐれモンスター【フライドポテト】", image: "/images/きまぐれモンスター【フライドポテト】.png", description: "フライドポテトの姿をした気まぐれなモンスター。山盛りで豪華に見えるが、本人は無気力。攻撃はしない。" },
  { no: "150", name: "きまぐれモンスター【プリンス】", image: "/images/きまぐれモンスター【プリンス】.png", description: "王子の姿をした気まぐれなモンスター。物語の主役のようだが、実際はぼーっとしているだけ。戦う気はない。" },
  { no: "151", name: "きまぐれモンスター【プリンセス】", image: "/images/きまぐれモンスター【プリンセス】.png", description: "姫の姿をした気まぐれなモンスター。華やかに見えるが、本人は何も考えていない。攻撃はしない。" },

  { no: "152", name: "きまぐれモンスター【まねき猫】", image: "/images/きまぐれモンスター【まねき猫】.png", description: "招き猫の姿をした気まぐれなモンスター。幸運を呼びそうだが、本人は適当に手を振っているだけ。世界の運命には興味がない。" },
  { no: "153", name: "きまぐれモンスター【ヒーロー】", image: "/images/きまぐれモンスター【ヒーロー】.png", description: "ヒーローの姿をした気まぐれなモンスター。世界を救えそうだが、実際は休憩中。戦う気はほとんどない。" },
  { no: "154", name: "きまぐれモンスター【妖精】", image: "/images/きまぐれモンスター【妖精】.png", description: "妖精の姿をした気まぐれなモンスター。奇跡を起こせそうだが、ただ空を漂っているだけ。戦う気はない。" },
  { no: "155", name: "きまぐれモンスター【エイリアン】", image: "/images/きまぐれモンスター【エイリアン】.png", description: "宇宙人の姿をした気まぐれなモンスター。未知の力を持っていそうだが、地球観光をしているだけ。攻撃はしない。" },
  { no: "156", name: "きまぐれモンスター【天使】", image: "/images/きまぐれモンスター【天使】.png", description: "天使の姿をした気まぐれなモンスター。世界を導けそうな雰囲気だが、実際は雲の上で寝ているだけ。戦う気はない。" },

  { no: "157", name: "きまぐれモンスター【トマト】", image: "/images/きまぐれモンスター【トマト】.png", description: "トマトの姿をした気まぐれなモンスター。つやつやしているが、特に何もしない。攻撃はしない。" },
  { no: "158", name: "きまぐれモンスター【キャベツ】", image: "/images/きまぐれモンスター【キャベツ】.png", description: "キャベツの姿をした気まぐれなモンスター。何枚も重なっているが、本人は気にしていない。戦う気はない。" },
  { no: "159", name: "きまぐれモンスター【レタス】", image: "/images/きまぐれモンスター【レタス】.png", description: "レタスの姿をした気まぐれなモンスター。ふわふわしているが、風に乗るだけ。攻撃はしない。" },
  { no: "160", name: "きまぐれモンスター【はくさい】", image: "/images/きまぐれモンスター【はくさい】.png", description: "はくさいの姿をした気まぐれなモンスター。大きいが動きはゆっくり。戦いには興味がない。" },
  { no: "161", name: "きまぐれモンスター【にんじん】", image: "/images/きまぐれモンスター【にんじん】.png", description: "にんじんの姿をした気まぐれなモンスター。土の匂いを漂わせるが、ただ立っているだけ。攻撃はしない。" },
  { no: "162", name: "きまぐれモンスター【ナス】", image: "/images/きまぐれモンスター【ナス】.png", description: "ナスの姿をした気まぐれなモンスター。つやつや光っているが、本人は眠そう。戦う気はない。" },
  { no: "163", name: "きまぐれモンスター【ピーマン】", image: "/images/きまぐれモンスター【ピーマン】.png", description: "ピーマンの姿をした気まぐれなモンスター。苦そうに見えるが、特に何も考えていない。攻撃はしない。" },
  { no: "164", name: "きまぐれモンスター【たまねぎ】", image: "/images/きまぐれモンスター【たまねぎ】.png", description: "たまねぎの姿をした気まぐれなモンスター。近づくと目がしみそうだが、実際は何も起こらない。戦う気はない。" },
  { no: "165", name: "きまぐれモンスター【じゃがいも】", image: "/images/きまぐれモンスター【じゃがいも】.png", description: "じゃがいもの姿をした気まぐれなモンスター。ごつごつしているが、とてもおだやか。攻撃はしない。" },
  { no: "166", name: "きまぐれモンスター【さつまいも】", image: "/images/きまぐれモンスター【さつまいも】.png", description: "さつまいもの姿をした気まぐれなモンスター。甘い香りを漂わせるが、ぼーっとしているだけ。戦う気はない。" },
  { no: "167", name: "きまぐれモンスター【ブロッコリー】", image: "/images/きまぐれモンスター【ブロッコリー】.png", description: "ブロッコリーの姿をした気まぐれなモンスター。頭がもこもこしているが、何も考えていない。攻撃はしない。" },
  { no: "168", name: "きまぐれモンスター【だいこん】", image: "/images/きまぐれモンスター【だいこん】.png", description: "だいこんの姿をした気まぐれなモンスター。長い体をしているが、動く気配はない。戦う気はない。" },
  { no: "169", name: "きまぐれモンスター【れんこん】", image: "/images/きまぐれモンスター【れんこん】.png", description: "れんこんの姿をした気まぐれなモンスター。穴から向こうを見ているが、特に意味はない。攻撃はしない。" },
  { no: "170", name: "きまぐれモンスター【かぼちゃ】", image: "/images/きまぐれモンスター【かぼちゃ】.png", description: "かぼちゃの姿をした気まぐれなモンスター。ずっしりしているが、ほとんど動かない。戦う気はない。" },
  { no: "171", name: "きまぐれモンスター【とうもろこし】", image: "/images/きまぐれモンスター【とうもろこし】.png", description: "とうもろこしの姿をした気まぐれなモンスター。粒がぎっしりだが、本人はのんびりしている。攻撃はしない。" },

  { no: "172", name: "きまぐれモンスター【りんご】", image: "/images/きまぐれモンスター【りんご】.png", description: "りんごの姿をした気まぐれなモンスター。赤く輝いているが、ただ転がっているだけ。戦う気はない。" },
  { no: "173", name: "きまぐれモンスター【みかん】", image: "/images/きまぐれモンスター【みかん】.png", description: "みかんの姿をした気まぐれなモンスター。いい香りを放つが、自分では気づいていない。攻撃はしない。" },
  { no: "174", name: "きまぐれモンスター【オレンジ】", image: "/images/きまぐれモンスター【オレンジ】.png", description: "オレンジの姿をした気まぐれなモンスター。まんまるだが、どこにも行かない。戦う気はない。" },
  { no: "175", name: "きまぐれモンスター【バナナ】", image: "/images/きまぐれモンスター【バナナ】.png", description: "バナナの姿をした気まぐれなモンスター。房になっていることもあるが、気分次第。攻撃はしない。" },
  { no: "176", name: "きまぐれモンスター【ぶどう】", image: "/images/きまぐれモンスター【ぶどう】.png", description: "ぶどうの姿をした気まぐれなモンスター。粒が集まっているが、まとまりはない。戦う気はない。" },
  { no: "177", name: "きまぐれモンスター【もも】", image: "/images/きまぐれモンスター【もも】.png", description: "ももの姿をした気まぐれなモンスター。つやつやしているが、ずっと眠そう。攻撃はしない。" },
  { no: "178", name: "きまぐれモンスター【イチゴ】", image: "/images/きまぐれモンスター【イチゴ】.png", description: "イチゴの姿をした気まぐれなモンスター。種が多いが、数えたことはない。戦う気はない。" },
  { no: "179", name: "きまぐれモンスター【パイナップル】", image: "/images/きまぐれモンスター【パイナップル】.png", description: "パイナップルの姿をした気まぐれなモンスター。トゲトゲしているが、とても温厚。攻撃はしない。" },
  { no: "180", name: "きまぐれモンスター【スイカ】", image: "/images/きまぐれモンスター【スイカ】.png", description: "スイカの姿をした気まぐれなモンスター。重そうだが、自分では気にしていない。戦う気はない。" },
  { no: "181", name: "きまぐれモンスター【メロン】", image: "/images/きまぐれモンスター【メロン】.png", description: "メロンの姿をした気まぐれなモンスター。網目を眺めているだけで満足している。攻撃はしない。" },
  { no: "182", name: "きまぐれモンスター【キウイ】", image: "/images/きまぐれモンスター【キウイ】.png", description: "キウイの姿をした気まぐれなモンスター。外は地味だが中は気にしていない。戦う気はない。" },
  { no: "183", name: "きまぐれモンスター【マンゴー】", image: "/images/きまぐれモンスター【マンゴー】.png", description: "マンゴーの姿をした気まぐれなモンスター。南国気分だが、どこにも行かない。攻撃はしない。" },
  { no: "184", name: "きまぐれモンスター【レモン】", image: "/images/きまぐれモンスター【レモン】.png", description: "レモンの姿をした気まぐれなモンスター。すっぱそうだが、本人は無表情。戦う気はない。" },
  { no: "185", name: "きまぐれモンスター【ブルーベリー】", image: "/images/きまぐれモンスター【ブルーベリー】.png", description: "ブルーベリーの姿をした気まぐれなモンスター。小さいが存在感はある。攻撃はしない。" },
  { no: "186", name: "きまぐれモンスター【さくらんぼ】", image: "/images/きまぐれモンスター【さくらんぼ】.png", description: "さくらんぼの姿をした気まぐれなモンスター。二つ並んでいるが、会話はしていない。戦う気はない。" }
]
;

// ステージに応じて敵を取得する
type Enemy = typeof enemies[number];

const pickRandomEnemy = (excludeNo?: string): Enemy => {
  const pool = excludeNo ? enemies.filter((e) => e.no !== excludeNo) : enemies;
  return pool[Math.floor(Math.random() * pool.length)];
};

const shouldEscape = () => Math.random() < 1 / 3; // 1/3で逃げる

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
  { threshold: 0, comment: "ほかのモンスターも探してみよう！🔍" },
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
  resultEnemy,
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
  resultEnemy: Enemy | null;
}) => {
  const [showRank, setShowRank] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    timers.push(setTimeout(() => setShowRank(true), 500));
    timers.push(setTimeout(() => setShowButton(true), 1000));

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="text-center mt-6">
      {showRank && (
        <>
          <div className="flex flex-col md:flex-row items-center justify-center mb-10">
            <img src="/images/きまぐれモンスター1.png" alt="きまぐれモンスター" className="w-0 h-0 md:w-48 md:h-48" />
            <div>
              <p className="text-3xl md:text-5xl font-extrabold text-yellow-600 mb-2">
                {resultEnemy ? `${resultEnemy.name}と` : ""}
              </p>
              <p
                className="text-3xl md:text-5xl font-bold drop-shadow-lg text-center animate-pulse"
              >
                ともだちになったよ！
              </p>
            </div>
            <div className="flex flex-row md:flex-row items-center justify-center gap-4 md:gap-8">
              <img src="/images/きまぐれモンスター1.png" alt="きまぐれモンスター" className="w-32 h-32 md:w-0 md:h-0" />
              <img src="/images/きまぐれモンスター4.png" alt="きまぐれモンスター" className="w-32 h-32 md:w-48 md:h-48" />
            </div>
          </div>

          {/* ★ 正解数に応じたコメント */}
          {(() => {
            const text = "ほかのモンスターも探してみよう🔍";

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
                  ※未ログインのため受け取れません。ログイン（無料）すると次からポイントとキャラクターアイコンを受け取れます！
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
                className="px-6 py-3 bg-yellow-500 text-white rounded-lg font-bold text-xl hover:bg-yellow-600 cursor-pointer"
                onClick={onRetry}
              >
                もういっかいやる
              </button>
            </div>
          </div>

          <RecommendedSoloGames
            title="次はどれで遊ぶ？🎮"
            count={4}
            excludeHref="/quiz-kimagure" // 今のページを出したくないなら
          />
        </>
      )}
    </div>
  );
};

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
          reason: `きまぐれクイズでポイント獲得（クリアステージ ${p.correctCount}${suffix}）`,
        });
      }

      // ログ（EXP）
      if (p.exp > 0) {
        await supabase.from("user_exp_logs").insert({
          user_id: uid,
          change: p.exp,
          reason: `きまぐれクイズでEXP獲得（正解数 ${p.correctCount} → ${p.exp}EXP）`,
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
  const [attackMessage, setAttackMessage] = useState<string | null>(null);
  const [isAttacking, setIsAttacking] = useState(false);
  const isAttackingRef = useRef(isAttacking);
  const [showStageIntro, setShowStageIntro] = useState(false);
  const [enemyDefeatedMessage, setEnemyDefeatedMessage] = useState<string | null>(null);
  const [deathMessage, setDeathMessage] = useState<string | null>(null);
  const [isBlinkingEnemy, setIsBlinkingEnemy] = useState(false);
  const [enemyVisible, setEnemyVisible] = useState(true);
  // ====== シークレット討伐：獲得モーダル用 ======
  const [ownedCharacterIds, setOwnedCharacterIds] = useState<Set<string>>(new Set());
  const [acquired, setAcquired] = useState<CharacterItem | null>(null);
  const [acquireOpen, setAcquireOpen] = useState(false);
  const [floatOnce, setFloatOnce] = useState(false);
  const [currentEnemy, setCurrentEnemy] = useState<Enemy>(() => pickRandomEnemy());
  const resultEnemyRef = useRef<Enemy | null>(null); // ✅ 正解時の敵を保持（リザルトで使う）
  const [resultEnemy, setResultEnemy] = useState<Enemy | null>(null);
  const [escapeMessage, setEscapeMessage] = useState<string | null>(null);
  const [isFriendEnding, setIsFriendEnding] = useState(false);
  const [hideAfterButton, setHideAfterButton] = useState(false);
  const [showSearchButton, setShowSearchButton] = useState(false);
  const searchBtnTimerRef = useRef<number | null>(null);
  const [openSearchConfirm, setOpenSearchConfirm] = useState(false);

  useEffect(() => {
    return () => {
      if (searchBtnTimerRef.current) window.clearTimeout(searchBtnTimerRef.current);
    };
  }, []);

  // ✅ イントロ表示（クリックで閉じる）
  const showEnemyIntro = () => {
    setShowStageIntro(true);
  };

  const closeEnemyIntro = () => {
    setShowStageIntro(false);
  };

  useEffect(() => {
    if (!showStageIntro) return;

    const t = window.setTimeout(() => {
      setShowStageIntro(false);
    }, 3000);

    return () => window.clearTimeout(t);
  }, [showStageIntro]);

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

  const finishedRef = useRef(finished);
  const showCorrectRef = useRef(showCorrectMessage);
  const questionsReady = questions.length > 0 && !!questions[currentIndex]?.quiz;

  const titles = [
    { threshold: 1, title: "くいずともだち" },
  ];

  const resetGame = () => {
    // 進行（questions は消さない）
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
    setEnemyDefeatedMessage(null);
    setDeathMessage(null);
    setIsBlinkingEnemy(false);
    setEnemyVisible(true);

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

    acquiredOnceRef.current = false;
    setAcquireOpen(false);
    setAcquired(null);

    // 友達/逃走の演出系
    setIsFriendEnding(false);
    setEscapeMessage(null);
    setHideAfterButton(false);
    setShowSearchButton(false);
    if (searchBtnTimerRef.current) window.clearTimeout(searchBtnTimerRef.current);
    searchBtnTimerRef.current = null;

    // 敵を新しく
    const nextEnemy = pickRandomEnemy();
    setCurrentEnemy(nextEnemy);
    resultEnemyRef.current = null;
    setResultEnemy(null);

    // ref同期（タイマー制御で見てるので重要）
    finishedRef.current = false;
    showCorrectRef.current = false;
    incorrectRef.current = null;
    isAttackingRef.current = false;

    // ✅ もう一回「初回スタート扱い」に戻す
    startedRef.current = false;

    // ✅ 問題をシャッフルして先頭から
    setQuestions((prev) => shuffleArray(prev));

    // ✅ イントロを出したいなら、ここで明示的に出してもOK
    showEnemyIntro();
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
    const id = window.setInterval(() => {
      setFloatOnce(true);
      window.setTimeout(() => setFloatOnce(false), 1600); // ふわふわ時間
    }, 6000); // 6秒に1回

    return () => window.clearInterval(id);
  }, []);

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
  }, [mode, genre]);


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

      showEnemyIntro();

      // ref同期（タイマー停止条件に使ってるので）
      showCorrectRef.current = false;
      incorrectRef.current = null;
      isAttackingRef.current = false;
      finishedRef.current = false;
    }
  }, [questionsReady]);


  const checkAnswer = () => {
    const correctAnswer = questions[currentIndex].quiz?.answer;
    const displayAnswer = questions[currentIndex].quiz?.displayAnswer;

    if (userAnswer === correctAnswer) {
      // ✅ 正解した瞬間の敵を確定保存（リザルトで付与する）
      resultEnemyRef.current = currentEnemy;
      setResultEnemy(currentEnemy);

      setShowCorrectMessage(true);
      setQuizCorrectCount((c) => c + 1);

      // 1問正解で終わりにするなら、ここで correctCount も決め打ちでOK
      setCorrectCount(1);
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
    setTimeLeft(30);

    if (currentIndex + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  const getTitle = () => {
    let title = "くいずともだち";
    titles.forEach((t) => {
      if (correctCount >= t.threshold) title = t.title;
    });
    return title;
  };

  const finishQuiz = () => {
    setFinished(true);
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


  const hintCooldown = lastHintUsedIndex !== null && currentIndex - lastHintUsedIndex < 3;
  const healCooldown = lastHealUsedIndex !== null && currentIndex - lastHealUsedIndex < 3;

  const StageIntro = ({ enemy }: { enemy: typeof enemies[0] }) => {
    return (
      <div className="fixed inset-0 bg-yellow-50 bg-opacity-70 flex flex-col items-center justify-center z-50">
        <img src={enemy.image} alt={enemy.name} className="w-40 h-40 md:w-60 md:h-60 mb-4 animate-bounce" />
        <p className="max-w-[340px] md:max-w-full text-4xl md:text-6xl font-extrabold text-yellow-500 drop-shadow-lg">
          {enemy.name} をみつけた！
        </p>
      </div>
    );
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
        const title = "";

        const res = await submitGameResult(supabase, {
          game: "dungeon",      // ← あなたのDB設計に合わせた識別子
          stage: clearedStage,  // ← “最高到達ステージ” を score に入れる
          title,
          writeLog: true,
        });

        const modal = buildResultModalPayload("dungeon", res);
        if (modal) pushModal(modal);
      } catch (e) {
        console.error("[dungeon] submitGameResult error:", e);
      }
    })();
  }, [finished, userLoading, user, correctCount, titles, supabase, pushModal]);

  
  // ✅ リザルト突入時（finished=true）に、クリアなら獲得モーダルを出す
  useEffect(() => {
    if (!finished) return;
    if (acquiredOnceRef.current) return;
    if (!user) return; // 未ログイン時は取得しない方針ならそのままでOK

    const enemy = resultEnemyRef.current;
    if (!enemy?.no) return;

    acquiredOnceRef.current = true;

    // ✅ 「この敵」を取得させる（モーダル表示→RPC登録まで）
    acquireBossCharacterByNo(enemy.no);
  }, [finished, user]);

  if (!questionsReady) {
    return (
      <div className="container mx-auto p-8 text-center">
        <p className="text-xl font-bold">問題を読み込み中...</p>
      </div>
    );
  }

  // ✅ 共通：次のモンスターを探す（逃げられた後と同じ挙動）
  const searchAnotherMonster = () => {
    setShowSearchButton(false);
    setHideAfterButton(false);

    // 次の敵へ
    const next = pickRandomEnemy(currentEnemy.no);
    setCurrentEnemy(next);
    setEnemyVisible(true);

    // 逃走状態リセット
    setEscapeMessage(null);

    // 表示リセット（不正解メッセージ等を消す）
    setIncorrectMessage(null);

    showEnemyIntro();
    nextQuestion();
  };

  // Xシェア機能
  const handleShareX = () => {
    const enemyName = resultEnemy?.name ?? "モンスター";

    const text = [
      "【ひまQ｜きまぐれクイズ☁】",
      `ともだちになったモンスター：${enemyName}`,
      `獲得：${earnedPoints}P / ${earnedExp}EXP`,
      "",
      "👇ひまQ（みんなで遊べるクイズ）",
      "#ひまQ #クイズ #クイズゲーム",
    ].join("\n");

    openXShare({ text, url: buildTopUrl() }); // ✅トップへ
  };

  return (
    <>
      {/* 他のモンスター探索：確認モーダル */}
      {openSearchConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          {/* 背景 */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpenSearchConfirm(false)}
          />
          {/* 本体 */}
          <div className="relative w-[92%] max-w-[460px] rounded-2xl border-2 border-black bg-white p-5 shadow-xl">
            <p className="text-2xl md:text-3xl font-extrabold text-yellow-600 drop-shadow mb-2 text-center">
              次のモンスターをさがす？
            </p>
            <p className="text-base md:text-lg text-gray-700 font-bold text-center">
              いまのモンスターとはお別れして、次のモンスターを探しにいくよ。
            </p>

            <div className="mt-5 flex gap-3 justify-center">
              <button
                className="px-5 py-3 rounded-lg font-extrabold text-lg border-2 border-black bg-gray-100 hover:opacity-90"
                onClick={() => setOpenSearchConfirm(false)}
              >
                やめる
              </button>
              <button
                className="px-6 py-3 rounded-lg font-extrabold text-lg border-2 border-black bg-yellow-400 hover:bg-yellow-500"
                onClick={() => {
                  setOpenSearchConfirm(false);
                  searchAnotherMonster(); // ✅ 逃げられた後と同じ処理
                }}
              >
                そうする
              </button>
            </div>
          </div>
        </div>
      )}

      <CharacterAcquireModal
        open={acquireOpen}
        item={acquired}
        verb="手に入れた！"
        onClose={() => {
          setAcquireOpen(false);
          setAcquired(null);
        }}
      />
      {showStageIntro && <StageIntro enemy={currentEnemy} />}
      <div className="container mx-auto p-8 text-center bg-yellow-50">
        {!finished ? (
          <>
            <div className="mb-3 bg-yellow-50 rounded-xl mx-auto w-full max-w-md md:max-w-xl">
              <p className="text-xl md:text-2xl text-center mb-2">【クイズに正解してともだちになろう！】</p>
              {/* 横並び */}
              <div className="flex flex-col items-center md:flex-row justify-center md:gap-12 border-2 border-gray-200 rounded-xl p-3 bg-white">
                {/* 敵キャラクター */}
                <div className="flex flex-col items-center  gap-1 md:gap-2">
                  <div className="flex flex-col items-center gap-2 to-black p-3 rounded-xl">
                    <div className="flex flex-col">
                      <p className="text-xl md:text-2xl font-bold text-yellow-500">
                        {escapeMessage
                          ? `${currentEnemy.name} は ${escapeMessage}`
                          : isFriendEnding
                            ? `${currentEnemy.name} と ともだちになった！🎉`
                            : `${currentEnemy.name} がこっちをみている！`}
                      </p>
                    </div>
                    <img
                      src={currentEnemy.image}
                      alt={currentEnemy.name}
                      className={[
                        "w-40 h-40 md:w-48 md:h-48 mt-2",
                        floatOnce ? "float-once" : "",
                        "transition-all duration-700 ease-in-out",
                        enemyVisible ? "opacity-100 blur-0 scale-100" : "opacity-0 blur-sm scale-95",
                      ].join(" ")}
                      style={{ willChange: "transform, opacity, filter", transform: "translateZ(0)" }}
                    />
                  </div>
                  <p className="text-lg md:text-xl font-semibold text-gray-600">
                    {currentEnemy.description}
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

            {deathMessage && (
              <p className="text-2xl md:text-4xl font-bold text-red-500 mb-4 animate-bounce">
                {deathMessage}
              </p>
            )}

            {questions[currentIndex].quiz && (
              <>
                {(showCorrectMessage || incorrectMessage) && !hideAfterButton && (
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
                          disabled={isFriendEnding}
                          className={[
                            "px-5 py-3 md:px-6 md:py-3 text-white text-lg md:text-xl font-medium rounded bg-yellow-500 cursor-pointer",
                            isFriendEnding ? "opacity-60 cursor-not-allowed" : "hover:opacity-90",
                          ].join(" ")}
                          onClick={() => {
                            setHideAfterButton(true);  
                            setIsFriendEnding(true);
                            fireConfetti();
                            window.setTimeout(() => {
                              setIsFriendEnding(false);
                              setHideAfterButton(false);
                              finishQuiz();
                            }, 5000);
                          }}
                        >
                          ともだちになる
                        </button>
                      )}
                      {incorrectMessage && (
                        <button
                          className="px-5 py-3 md:px-6 md:py-3 text-white text-lg md:text-xl font-medium rounded
                                    bg-blue-500 hover:bg-blue-600 cursor-pointer"
                          onClick={() => {
                            setHideAfterButton(true);

                            // 逃げるかどうか判定（1/3）
                            const escaped = shouldEscape();

                            // 共通：まずメッセージ出す
                            setEscapeMessage(escaped ? "逃げてしまった…" : "逃げなかった！まだこっちをみている…");

                            if (escaped) {
                              // ✅ 逃走：ゆっくり消す + 2秒後に「もういっかいさがす」表示
                              setEnemyVisible(false);

                              setShowSearchButton(false);
                              if (searchBtnTimerRef.current) window.clearTimeout(searchBtnTimerRef.current);

                              searchBtnTimerRef.current = window.setTimeout(() => {
                                setShowSearchButton(true);
                              }, 2000);
                            } else {
                              // ✅ 逃げない：敵は消さない、2秒だけ表示して元に戻す（ボタンは出さない）
                              setEnemyVisible(true);

                              if (searchBtnTimerRef.current) window.clearTimeout(searchBtnTimerRef.current);

                              searchBtnTimerRef.current = window.setTimeout(() => {
                                setEscapeMessage(null);   // 表示を消す
                                setIncorrectMessage(null); 
                                setHideAfterButton(false); // 次の操作に戻す（必要なら）
                                nextQuestion();
                              }, 3000);
                            }
                          }}
                        >
                          OK
                        </button>
                      )}
                    </div>
                  </>
                )}

                {showSearchButton && escapeMessage && (
                  <button
                    className="mt-4 px-6 py-3 bg-yellow-500 text-white rounded-lg font-bold text-xl hover:bg-yellow-600 cursor-pointer"
                    onClick={() => {
                      setShowSearchButton(false);
                      setHideAfterButton(false);

                      // 次の敵へ
                      const next = pickRandomEnemy(currentEnemy.no);
                      setCurrentEnemy(next);
                      setEnemyVisible(true);

                      // 逃走状態リセット
                      setEscapeMessage(null);

                      // 次の問題へ（あなたの仕様だと不正解でも次の問題に進む）
                      setIncorrectMessage(null);

                      showEnemyIntro();
                      nextQuestion();
                    }}
                  >
                    もういっかいさがす
                  </button>
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

                <div>
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
                </div>

                <div className="mt-3">
                  {/* 他のモンスターを探す（回答ボタンの下） */}
                  {!showCorrectMessage && !incorrectMessage && !isAttacking && (
                    <button
                      type="button"
                      className={[
                        "mt-3 px-6 py-3 rounded-full font-extrabold text-lg md:text-xl text-yellow-600",
                        "border-4 border-yellow-400",
                        "bg-gradient-to-b from-yellow-100 via-white to-yellow-200",
                        "hover:opacity-90 active:translate-y-[2px]",
                        "transition",
                      ].join(" ")}
                      onClick={() => setOpenSearchConfirm(true)}
                    >
                      次のモンスターをさがす
                    </button>
                  )}
                </div>
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
            resultEnemy={resultEnemy}
          />
        )}
      </div>
    </>
  );
}
