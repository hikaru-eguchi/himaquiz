// lib/diagnosis/data/communication.ts

import { DiagnosisGame } from "../types";

export const communicationDiagnosis: DiagnosisGame = {
  slug: "communication",
  title: "あなたのコミュ力診断",
  description: "7つの質問で、あなたのコミュ力タイプを診断！",
  questions: [
    {
      id: "communication-q1",
      question: "初対面の人と話すときは？",
      choices: [
        {
          text: "自分から話しかける",
          points: { popular: 2, talker: 1 },
        },
        {
          text: "相手の話を聞く",
          points: { listener: 2, natural: 1 },
        },
        {
          text: "様子を見ながら話す",
          points: { careful: 2, listener: 1 },
        },
      ],
    },
    {
      id: "communication-q2",
      question: "会話の中で多いのは？",
      choices: [
        {
          text: "話題を振る",
          points: { talker: 2, popular: 1 },
        },
        {
          text: "話を聞く",
          points: { listener: 2, careful: 1 },
        },
        {
          text: "自然に会話する",
          points: { natural: 2, popular: 1 },
        },
      ],
    },
    {
      id: "communication-q3",
      question: "友達から言われるのは？",
      choices: [
        {
          text: "一緒にいると楽しい",
          points: { popular: 2, talker: 1 },
        },
        {
          text: "話しやすい",
          points: { listener: 2, natural: 1 },
        },
        {
          text: "気遣いが上手",
          points: { careful: 2, listener: 1 },
        },
      ],
    },
    {
      id: "communication-q4",
      question: "グループでのあなたは？",
      choices: [
        {
          text: "中心にいることが多い",
          points: { popular: 2, talker: 1 },
        },
        {
          text: "聞き役になる",
          points: { listener: 2, careful: 1 },
        },
        {
          text: "自然に会話に入る",
          points: { natural: 2, popular: 1 },
        },
      ],
    },
    {
      id: "communication-q5",
      question: "会話が途切れたら？",
      choices: [
        {
          text: "新しい話題を出す",
          points: { talker: 2, popular: 1 },
        },
        {
          text: "相手に質問する",
          points: { listener: 2, natural: 1 },
        },
        {
          text: "無理に話さない",
          points: { careful: 2, natural: 1 },
        },
      ],
    },
    {
      id: "communication-q6",
      question: "得意なコミュニケーションは？",
      choices: [
        {
          text: "盛り上げること",
          points: { popular: 2, talker: 1 },
        },
        {
          text: "聞くこと",
          points: { listener: 2, careful: 1 },
        },
        {
          text: "自然に話すこと",
          points: { natural: 2, listener: 1 },
        },
      ],
    },
    {
      id: "communication-q7",
      question: "あなたのコミュ力に近いのは？",
      choices: [
        {
          text: "明るく話す",
          points: { popular: 2, talker: 1 },
        },
        {
          text: "相手を理解する",
          points: { listener: 2, careful: 1 },
        },
        {
          text: "自然体で接する",
          points: { natural: 2, popular: 1 },
        },
      ],
    },
  ],
  resultTypes: [
    {
      key: "popular",
      title: "人気者タイプ",
      description: "自然と人が集まりやすい明るいタイプ。",
      features: ["話しかけやすい", "場を明るくする", "親しみやすい"],
    },
    {
      key: "listener",
      title: "聞き上手タイプ",
      description: "相手の話をしっかり聞ける安心感タイプ。",
      features: ["共感が得意", "落ち着いている", "信頼されやすい"],
    },
    {
      key: "talker",
      title: "話し上手タイプ",
      description: "会話を広げるのが得意な盛り上げ役タイプ。",
      features: ["話題が豊富", "説明が上手", "テンポがいい"],
    },
    {
      key: "careful",
      title: "慎重コミュタイプ",
      description: "距離感を大事にしながら丁寧に関わるタイプ。",
      features: ["空気を読む", "失礼が少ない", "やさしい"],
    },
    {
      key: "natural",
      title: "自然体タイプ",
      description: "無理せず自分らしく人と関わるタイプ。",
      features: ["飾らない", "素直", "付き合いやすい"],
    },
  ],
};