// lib/diagnosis/data/strength.ts

import { DiagnosisGame } from "../types";

export const strengthDiagnosis: DiagnosisGame = {
  slug: "strength",
  title: "あなたの本当の強み診断",
  description: "7つの質問で、あなたの本当の強みを診断！",
  questions: [
    {
      id: "strength-q1",
      question: "新しいことを始めるときのあなたは？",
      choices: [
        {
          text: "とりあえずやってみる",
          points: { action: 2, creativity: 1 },
        },
        {
          text: "しっかり調べてから始める",
          points: { knowledge: 2, continuity: 1 },
        },
        {
          text: "周りを見て助けながら進める",
          points: { kindness: 2, continuity: 1 },
        },
      ],
    },
    {
      id: "strength-q2",
      question: "人から言われやすいのは？",
      choices: [
        {
          text: "行動力あるね",
          points: { action: 2, creativity: 1 },
        },
        {
          text: "優しいね",
          points: { kindness: 2, continuity: 1 },
        },
        {
          text: "物知りだね",
          points: { knowledge: 2, continuity: 1 },
        },
      ],
    },
    {
      id: "strength-q3",
      question: "困っている人がいたら？",
      choices: [
        {
          text: "すぐ助ける",
          points: { kindness: 2, action: 1 },
        },
        {
          text: "解決方法を考える",
          points: { knowledge: 2, creativity: 1 },
        },
        {
          text: "自分にできることを続ける",
          points: { continuity: 2, kindness: 1 },
        },
      ],
    },
    {
      id: "strength-q4",
      question: "得意なことに近いのは？",
      choices: [
        {
          text: "すぐ行動できる",
          points: { action: 2, creativity: 1 },
        },
        {
          text: "新しいアイデアを考える",
          points: { creativity: 2, knowledge: 1 },
        },
        {
          text: "長く続けること",
          points: { continuity: 2, kindness: 1 },
        },
      ],
    },
    {
      id: "strength-q5",
      question: "難しいことに挑戦するときは？",
      choices: [
        {
          text: "まず挑戦してみる",
          points: { action: 2, creativity: 1 },
        },
        {
          text: "しっかり調べて準備する",
          points: { knowledge: 2, continuity: 1 },
        },
        {
          text: "少しずつ続ける",
          points: { continuity: 2, kindness: 1 },
        },
      ],
    },
    {
      id: "strength-q6",
      question: "周りから頼られるときは？",
      choices: [
        {
          text: "行動してほしいとき",
          points: { action: 2, creativity: 1 },
        },
        {
          text: "相談したいとき",
          points: { kindness: 2, continuity: 1 },
        },
        {
          text: "知識を聞きたいとき",
          points: { knowledge: 2, continuity: 1 },
        },
      ],
    },
    {
      id: "strength-q7",
      question: "あなたの強みに一番近いのは？",
      choices: [
        {
          text: "行動力",
          points: { action: 2, creativity: 1 },
        },
        {
          text: "優しさ",
          points: { kindness: 2, continuity: 1 },
        },
        {
          text: "知識や理解力",
          points: { knowledge: 2, continuity: 1 },
        },
      ],
    },
  ],
  resultTypes: [
    {
      key: "action",
      title: "行動力タイプ",
      description: "まず動くことで道を切り開くタイプ。",
      features: ["行動が早い", "勢いがある", "挑戦に強い"],
    },
    {
      key: "kindness",
      title: "やさしさタイプ",
      description: "人を支える力が大きな武器になるタイプ。",
      features: ["気配り上手", "共感力が高い", "信頼されやすい"],
    },
    {
      key: "knowledge",
      title: "知識タイプ",
      description: "知っていることの多さと深さが武器になるタイプ。",
      features: ["雑学に強い", "調べるのが得意", "理解が深い"],
    },
    {
      key: "creativity",
      title: "発想力タイプ",
      description: "思いつきや工夫で強さを発揮するタイプ。",
      features: ["アイデア豊富", "柔軟", "ひらめきに強い"],
    },
    {
      key: "continuity",
      title: "継続力タイプ",
      description: "コツコツ続けることで一気に強くなるタイプ。",
      features: ["粘り強い", "安定感がある", "積み重ねに強い"],
    },
  ],
};