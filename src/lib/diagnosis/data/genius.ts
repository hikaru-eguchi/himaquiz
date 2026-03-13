// lib/diagnosis/data/genius.ts

import { DiagnosisGame } from "../types";

export const geniusDiagnosis: DiagnosisGame = {
  slug: "genius",
  title: "あなたの天才タイプ診断",
  description: "7つの質問で、あなたの天才タイプを診断！",
  questions: [
    {
      id: "genius-q1",
      question: "新しいことを考えるときのあなたは？",
      choices: [
        {
          text: "自由にアイデアを出す",
          points: { creative: 2, instant: 1 },
        },
        {
          text: "順序立てて考える",
          points: { logic: 2, balanced: 1 },
        },
        {
          text: "好きなことをとことん掘る",
          points: { obsessive: 2, balanced: 1 },
        },
      ],
    },
    {
      id: "genius-q2",
      question: "得意そうなのはどれ？",
      choices: [
        {
          text: "新しい発想を生み出す",
          points: { creative: 2, instant: 1 },
        },
        {
          text: "問題を論理的に解く",
          points: { logic: 2, balanced: 1 },
        },
        {
          text: "ひとつのことを極める",
          points: { obsessive: 2, balanced: 1 },
        },
      ],
    },
    {
      id: "genius-q3",
      question: "クイズやゲームをするときのあなたは？",
      choices: [
        {
          text: "ひらめきで答える",
          points: { instant: 2, creative: 1 },
        },
        {
          text: "じっくり考える",
          points: { logic: 2, balanced: 1 },
        },
        {
          text: "得意ジャンルなら強い",
          points: { obsessive: 2, balanced: 1 },
        },
      ],
    },
    {
      id: "genius-q4",
      question: "人から言われやすいのは？",
      choices: [
        {
          text: "発想が面白い",
          points: { creative: 2, instant: 1 },
        },
        {
          text: "頭いいね",
          points: { logic: 2, balanced: 1 },
        },
        {
          text: "集中力すごいね",
          points: { obsessive: 2, balanced: 1 },
        },
      ],
    },
    {
      id: "genius-q5",
      question: "難しい問題が出たら？",
      choices: [
        {
          text: "ひらめきを待つ",
          points: { instant: 2, creative: 1 },
        },
        {
          text: "順番に考える",
          points: { logic: 2, balanced: 1 },
        },
        {
          text: "調べて深く理解する",
          points: { obsessive: 2, balanced: 1 },
        },
      ],
    },
    {
      id: "genius-q6",
      question: "あなたの強みに近いのは？",
      choices: [
        {
          text: "発想力",
          points: { creative: 2, instant: 1 },
        },
        {
          text: "思考力",
          points: { logic: 2, balanced: 1 },
        },
        {
          text: "集中力",
          points: { obsessive: 2, balanced: 1 },
        },
      ],
    },
    {
      id: "genius-q7",
      question: "理想の能力は？",
      choices: [
        {
          text: "誰も思いつかない発想",
          points: { creative: 2, instant: 1 },
        },
        {
          text: "完璧な論理力",
          points: { logic: 2, balanced: 1 },
        },
        {
          text: "ひとつを極める力",
          points: { obsessive: 2, balanced: 1 },
        },
      ],
    },
  ],
  resultTypes: [
    {
      key: "creative",
      title: "創造系天才タイプ",
      description: "新しいものを生み出す発想型の天才。",
      features: ["独創的", "アイデア豊富", "感性が強い"],
    },
    {
      key: "logic",
      title: "論理系天才タイプ",
      description: "考えを組み立てて答えを出す理論派の天才。",
      features: ["筋道立てて考える", "分析が得意", "冷静"],
    },
    {
      key: "instant",
      title: "瞬発系天才タイプ",
      description: "一瞬の判断やひらめきに優れたタイプ。",
      features: ["反応が早い", "勘がいい", "勝負強い"],
    },
    {
      key: "obsessive",
      title: "没頭系天才タイプ",
      description: "好きなことに深くハマって伸びる集中型。",
      features: ["集中力が高い", "継続力がある", "探究心が強い"],
    },
    {
      key: "balanced",
      title: "万能天才タイプ",
      description: "複数の才能をバランスよく持つオールラウンダー。",
      features: ["器用", "応用が効く", "安定して強い"],
    },
  ],
};