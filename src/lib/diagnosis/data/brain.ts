// lib/diagnosis/data/brain.ts

import { DiagnosisGame } from "../types";

export const brainDiagnosis: DiagnosisGame = {
  slug: "brain",
  title: "あなたの脳タイプ診断",
  description: "7つの質問で、あなたの脳タイプを診断！",
  questions: [
    {
      id: "brain-q1",
      question: "問題にぶつかったとき、最初にすることは？",
      choices: [
        {
          text: "とりあえず直感で動く",
          points: { intuition: 2, flash: 1 },
        },
        {
          text: "知っている知識を思い出す",
          points: { knowledge: 2, hybrid: 1 },
        },
        {
          text: "順番に整理して考える",
          points: { analysis: 2, hybrid: 1 },
        },
      ],
    },
    {
      id: "brain-q2",
      question: "何かを覚えるときのあなたは？",
      choices: [
        {
          text: "感覚的に覚える",
          points: { intuition: 2, flash: 1 },
        },
        {
          text: "繰り返し覚える",
          points: { knowledge: 2, hybrid: 1 },
        },
        {
          text: "仕組みを理解して覚える",
          points: { analysis: 2, knowledge: 1 },
        },
      ],
    },
    {
      id: "brain-q3",
      question: "アイデアを出すときのあなたは？",
      choices: [
        {
          text: "突然ひらめくことが多い",
          points: { flash: 2, intuition: 1 },
        },
        {
          text: "今までの知識から考える",
          points: { knowledge: 2, analysis: 1 },
        },
        {
          text: "いろいろな要素を整理して考える",
          points: { analysis: 2, hybrid: 1 },
        },
      ],
    },
    {
      id: "brain-q4",
      question: "クイズをするときのスタイルは？",
      choices: [
        {
          text: "直感で答える",
          points: { intuition: 2, flash: 1 },
        },
        {
          text: "知識から答える",
          points: { knowledge: 2, hybrid: 1 },
        },
        {
          text: "消去法で考える",
          points: { analysis: 2, knowledge: 1 },
        },
      ],
    },
    {
      id: "brain-q5",
      question: "人から言われやすいのは？",
      choices: [
        {
          text: "勘がいいね",
          points: { intuition: 2, flash: 1 },
        },
        {
          text: "物知りだね",
          points: { knowledge: 2, hybrid: 1 },
        },
        {
          text: "よく考えてるね",
          points: { analysis: 2, hybrid: 1 },
        },
      ],
    },
    {
      id: "brain-q6",
      question: "あなたの強みに近いのは？",
      choices: [
        {
          text: "センスと感覚",
          points: { intuition: 2, flash: 1 },
        },
        {
          text: "経験と知識",
          points: { knowledge: 2, hybrid: 1 },
        },
        {
          text: "論理と分析",
          points: { analysis: 2, hybrid: 1 },
        },
      ],
    },
    {
      id: "brain-q7",
      question: "難しい問題が出たときどうする？",
      choices: [
        {
          text: "ひらめきを信じる",
          points: { flash: 2, intuition: 1 },
        },
        {
          text: "知っていることを総動員する",
          points: { knowledge: 2, hybrid: 1 },
        },
        {
          text: "順序立てて考える",
          points: { analysis: 2, hybrid: 1 },
        },
      ],
    },
  ],
  resultTypes: [
    {
      key: "intuition",
      title: "直感タイプ",
      description: "感覚で素早く判断するのが得意なタイプ。",
      features: ["決断が早い", "センスで動ける", "流れを読むのが得意"],
    },
    {
      key: "knowledge",
      title: "知識タイプ",
      description: "経験や知識の蓄積を活かして考えるタイプ。",
      features: ["覚えるのが得意", "知識で補強する", "安定感がある"],
    },
    {
      key: "flash",
      title: "ひらめきタイプ",
      description: "突然のアイデアや発想力に強いタイプ。",
      features: ["発想が豊か", "意外性がある", "面白い視点を持つ"],
    },
    {
      key: "analysis",
      title: "分析タイプ",
      description: "細かく考えて、筋道を立てるのが得意なタイプ。",
      features: ["論理的", "整理上手", "冷静"],
    },
    {
      key: "hybrid",
      title: "ハイブリッドタイプ",
      description: "直感と論理をうまく使い分けるバランス型。",
      features: ["柔軟", "状況対応が得意", "総合力が高い"],
    },
  ],
};