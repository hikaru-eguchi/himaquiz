// lib/diagnosis/data/thinking.ts

import { DiagnosisGame } from "../types";

export const thinkingDiagnosis: DiagnosisGame = {
  slug: "thinking",
  title: "あなたの思考タイプ診断",
  description: "7つの質問で、あなたの思考タイプを診断！",
  questions: [
    {
      id: "thinking-q1",
      question: "問題が起きたとき、最初にすることは？",
      choices: [
        {
          text: "原因を順番に考える",
          points: { logic: 2, careful: 1 },
        },
        {
          text: "直感で解決策を探す",
          points: { intuition: 2, creative: 1 },
        },
        {
          text: "新しい方法を考える",
          points: { creative: 2, balanced: 1 },
        },
      ],
    },
    {
      id: "thinking-q2",
      question: "クイズや問題を解くときのスタイルは？",
      choices: [
        {
          text: "論理的に考える",
          points: { logic: 2, careful: 1 },
        },
        {
          text: "ひらめきで答える",
          points: { intuition: 2, creative: 1 },
        },
        {
          text: "いろんな可能性を考える",
          points: { balanced: 2, creative: 1 },
        },
      ],
    },
    {
      id: "thinking-q3",
      question: "人から言われやすいのは？",
      choices: [
        {
          text: "しっかりしてる",
          points: { careful: 2, logic: 1 },
        },
        {
          text: "勘がいい",
          points: { intuition: 2, creative: 1 },
        },
        {
          text: "アイデアが面白い",
          points: { creative: 2, balanced: 1 },
        },
      ],
    },
    {
      id: "thinking-q4",
      question: "新しいことを始めるときは？",
      choices: [
        {
          text: "まず計画を立てる",
          points: { logic: 2, careful: 1 },
        },
        {
          text: "とりあえずやってみる",
          points: { intuition: 2, balanced: 1 },
        },
        {
          text: "面白い方法を考える",
          points: { creative: 2, balanced: 1 },
        },
      ],
    },
    {
      id: "thinking-q5",
      question: "難しい問題に出会ったら？",
      choices: [
        {
          text: "順序立てて考える",
          points: { logic: 2, careful: 1 },
        },
        {
          text: "感覚で突破する",
          points: { intuition: 2, creative: 1 },
        },
        {
          text: "新しい視点で見る",
          points: { creative: 2, balanced: 1 },
        },
      ],
    },
    {
      id: "thinking-q6",
      question: "あなたの強みに近いのは？",
      choices: [
        {
          text: "論理的思考",
          points: { logic: 2, balanced: 1 },
        },
        {
          text: "直感力",
          points: { intuition: 2, creative: 1 },
        },
        {
          text: "発想力",
          points: { creative: 2, balanced: 1 },
        },
      ],
    },
    {
      id: "thinking-q7",
      question: "理想の考え方は？",
      choices: [
        {
          text: "論理的に説明できる思考",
          points: { logic: 2, careful: 1 },
        },
        {
          text: "瞬時に判断できる思考",
          points: { intuition: 2, balanced: 1 },
        },
        {
          text: "新しいアイデアを生む思考",
          points: { creative: 2, balanced: 1 },
        },
      ],
    },
  ],
  resultTypes: [
    {
      key: "logic",
      title: "論理タイプ",
      description: "順番に考えて答えを出すタイプ。",
      features: ["筋道を立てる", "説明が上手", "冷静"],
    },
    {
      key: "intuition",
      title: "直感タイプ",
      description: "感覚で素早く判断するタイプ。",
      features: ["決断が早い", "勘が鋭い", "反応がいい"],
    },
    {
      key: "creative",
      title: "発想タイプ",
      description: "自由な考え方で新しい案を生み出すタイプ。",
      features: ["柔軟", "ユニーク", "アイデアが豊富"],
    },
    {
      key: "careful",
      title: "慎重タイプ",
      description: "失敗を避けながら丁寧に進めるタイプ。",
      features: ["確認が丁寧", "ミスが少ない", "安定志向"],
    },
    {
      key: "balanced",
      title: "バランスタイプ",
      description: "場面によって考え方を切り替えられるタイプ。",
      features: ["対応力が高い", "柔軟", "総合力がある"],
    },
  ],
};