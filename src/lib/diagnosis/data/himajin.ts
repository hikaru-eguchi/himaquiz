// lib/diagnosis/data/himajin.ts

import { DiagnosisGame } from "../types";

export const himajinDiagnosis: DiagnosisGame = {
  slug: "himajin",
  title: "あなたのひま人レベル診断",
  description: "7つの質問で、あなたのひま人レベルを診断！",
  questions: [
    {
      id: "himajin-q1",
      question: "今この診断をやっている理由は？",
      choices: [
        {
          text: "ちょっとした暇つぶし",
          points: { normal: 2, hidden: 1 },
        },
        {
          text: "かなり暇だから",
          points: { free: 2, pro: 1 },
        },
        {
          text: "本当は忙しいけど息抜き",
          points: { busy: 2, hidden: 1 },
        },
      ],
    },
    {
      id: "himajin-q2",
      question: "スマホを見る回数は？",
      choices: [
        {
          text: "気づいたらずっと見てる",
          points: { pro: 2, free: 1 },
        },
        {
          text: "暇なときだけ",
          points: { normal: 2, hidden: 1 },
        },
        {
          text: "あまり見ない",
          points: { busy: 2, normal: 1 },
        },
      ],
    },
    {
      id: "himajin-q3",
      question: "予定の多さは？",
      choices: [
        {
          text: "予定ぎっしり",
          points: { busy: 2, hidden: 1 },
        },
        {
          text: "普通くらい",
          points: { normal: 2, busy: 1 },
        },
        {
          text: "ほぼ空いている",
          points: { free: 2, pro: 1 },
        },
      ],
    },
    {
      id: "himajin-q4",
      question: "空き時間ができたら？",
      choices: [
        {
          text: "ゲームや動画を見る",
          points: { free: 2, pro: 1 },
        },
        {
          text: "ちょっと休む",
          points: { normal: 2, hidden: 1 },
        },
        {
          text: "別のことをする",
          points: { busy: 2, hidden: 1 },
        },
      ],
    },
    {
      id: "himajin-q5",
      question: "ひまQを見つけたときの気持ちは？",
      choices: [
        {
          text: "これは暇つぶしにいい",
          points: { free: 2, pro: 1 },
        },
        {
          text: "ちょっと遊んでみる",
          points: { normal: 2, hidden: 1 },
        },
        {
          text: "時間あるかな…",
          points: { busy: 2, normal: 1 },
        },
      ],
    },
    {
      id: "himajin-q6",
      question: "暇なときのあなたは？",
      choices: [
        {
          text: "暇つぶしを探す",
          points: { pro: 2, free: 1 },
        },
        {
          text: "のんびりする",
          points: { normal: 2, free: 1 },
        },
        {
          text: "何か作業をする",
          points: { busy: 2, hidden: 1 },
        },
      ],
    },
    {
      id: "himajin-q7",
      question: "あなたの暇レベルは？",
      choices: [
        {
          text: "ほぼ暇",
          points: { pro: 2, free: 1 },
        },
        {
          text: "普通",
          points: { normal: 2, hidden: 1 },
        },
        {
          text: "忙しい",
          points: { busy: 2, hidden: 1 },
        },
      ],
    },
  ],
  resultTypes: [
    {
      key: "busy",
      title: "忙しい人タイプ",
      description: "やることが多くて、常に何かに追われがちなタイプ。",
      features: ["予定が埋まりやすい", "行動が多い", "時間不足を感じやすい"],
    },
    {
      key: "normal",
      title: "まあまあ暇タイプ",
      description: "忙しすぎず暇すぎず、ちょうどいいバランス型。",
      features: ["自由時間がそこそこある", "無理しない", "安定型"],
    },
    {
      key: "free",
      title: "かなり暇タイプ",
      description: "ちょっとした空き時間が多く、暇つぶし能力が高いタイプ。",
      features: ["空き時間に強い", "暇を楽しめる", "のんびり派"],
    },
    {
      key: "pro",
      title: "プロひま人タイプ",
      description: "暇との付き合い方を完全に理解している最上位タイプ。",
      features: ["暇活の達人", "遊びを見つけるのが得意", "ひまQ適性高め"],
    },
    {
      key: "hidden",
      title: "隠れひま人タイプ",
      description: "忙しそうに見えて、実は暇の使い方がうまいタイプ。",
      features: ["効率がいい", "隙間時間活用が上手", "こっそり遊べる"],
    },
  ],
};