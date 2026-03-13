// lib/diagnosis/data/iq.ts

import { DiagnosisGame } from "../types";

export const iqDiagnosis: DiagnosisGame = {
  slug: "iq",
  title: "あなたのIQタイプ診断",
  description: "7つの質問で、あなたのIQタイプを診断！",
  questions: [
    {
      id: "iq-q1",
      question: "難しい問題に出会ったときのあなたは？",
      choices: [
        {
          text: "直感で答えを探す",
          points: { intuition: 2, flash: 1 },
        },
        {
          text: "順序立てて考える",
          points: { analysis: 2, steady: 1 },
        },
        {
          text: "新しい発想で突破する",
          points: { flash: 2, genius: 1 },
        },
      ],
    },
    {
      id: "iq-q2",
      question: "パズルやクイズをするときのスタイルは？",
      choices: [
        {
          text: "なんとなくで当たることが多い",
          points: { intuition: 2, flash: 1 },
        },
        {
          text: "論理的に答えを絞る",
          points: { analysis: 2, steady: 1 },
        },
        {
          text: "ひらめきで答えることがある",
          points: { flash: 2, genius: 1 },
        },
      ],
    },
    {
      id: "iq-q3",
      question: "人から言われやすいのは？",
      choices: [
        {
          text: "勘がいい",
          points: { intuition: 2, flash: 1 },
        },
        {
          text: "よく考えてる",
          points: { analysis: 2, steady: 1 },
        },
        {
          text: "頭いいね",
          points: { genius: 2, analysis: 1 },
        },
      ],
    },
    {
      id: "iq-q4",
      question: "新しいことを覚えるときは？",
      choices: [
        {
          text: "感覚で覚える",
          points: { intuition: 2, flash: 1 },
        },
        {
          text: "仕組みを理解する",
          points: { analysis: 2, genius: 1 },
        },
        {
          text: "繰り返して覚える",
          points: { steady: 2, analysis: 1 },
        },
      ],
    },
    {
      id: "iq-q5",
      question: "問題が解けたときのパターンは？",
      choices: [
        {
          text: "なんとなく分かった",
          points: { intuition: 2, flash: 1 },
        },
        {
          text: "順番に考えて解いた",
          points: { analysis: 2, steady: 1 },
        },
        {
          text: "急に答えがひらめいた",
          points: { flash: 2, genius: 1 },
        },
      ],
    },
    {
      id: "iq-q6",
      question: "あなたの強みに近いのは？",
      choices: [
        {
          text: "センス",
          points: { intuition: 2, flash: 1 },
        },
        {
          text: "思考力",
          points: { analysis: 2, genius: 1 },
        },
        {
          text: "安定感",
          points: { steady: 2, analysis: 1 },
        },
      ],
    },
    {
      id: "iq-q7",
      question: "理想の頭脳タイプは？",
      choices: [
        {
          text: "勘が鋭い人",
          points: { intuition: 2, flash: 1 },
        },
        {
          text: "論理的に考える人",
          points: { analysis: 2, steady: 1 },
        },
        {
          text: "なんでも理解できる人",
          points: { genius: 2, analysis: 1 },
        },
      ],
    },
  ],
  resultTypes: [
    {
      key: "intuition",
      title: "直感型",
      description: "考える前に感覚で正解へ近づけるタイプ。",
      features: ["勘が鋭い", "反応が早い", "ひらめきに強い"],
    },
    {
      key: "analysis",
      title: "分析型",
      description: "情報を整理して答えを導くロジカルタイプ。",
      features: ["論理的", "観察力が高い", "慎重"],
    },
    {
      key: "flash",
      title: "ひらめき型",
      description: "突然のアイデアで突破口を見つけるタイプ。",
      features: ["発想力がある", "柔軟", "意外な答えを出せる"],
    },
    {
      key: "genius",
      title: "天才型",
      description: "直感・分析・発想のどれも高水準なハイレベル型。",
      features: ["総合力が高い", "飲み込みが早い", "理解が深い"],
    },
    {
      key: "steady",
      title: "堅実型",
      description: "着実に考えて、安定して答えに近づくタイプ。",
      features: ["ミスが少ない", "丁寧", "安定感がある"],
    },
  ],
};