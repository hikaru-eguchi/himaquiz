// lib/diagnosis/data/personality.ts

import { DiagnosisGame } from "../types";

export const personalityDiagnosis: DiagnosisGame = {
  slug: "personality",
  title: "あなたの性格タイプ診断",
  description: "7つの質問で、あなたの性格タイプを診断！",
  questions: [
    {
      id: "personality-q1",
      question: "みんなで何かをするとき、あなたはどうなりがち？",
      choices: [
        {
          text: "自然と前に出てまとめる",
          points: { leader: 2, moodMaker: 1 },
        },
        {
          text: "自分のペースでできることをやる",
          points: { myPace: 2, supporter: 1 },
        },
        {
          text: "ちょっと変わった案を出したくなる",
          points: { geniusSkin: 2, moodMaker: 1 },
        },
      ],
    },
    {
      id: "personality-q2",
      question: "新しいことを始めるときのあなたは？",
      choices: [
        {
          text: "とりあえず先頭でやってみる",
          points: { leader: 2, geniusSkin: 1 },
        },
        {
          text: "周りの様子を見ながら進める",
          points: { supporter: 2, myPace: 1 },
        },
        {
          text: "自分なりのやり方を探したくなる",
          points: { geniusSkin: 2, myPace: 1 },
        },
      ],
    },
    {
      id: "personality-q3",
      question: "友だちから言われることが多そうなのは？",
      choices: [
        {
          text: "しっかりしてるね",
          points: { leader: 2, supporter: 1 },
        },
        {
          text: "一緒にいると楽しい",
          points: { moodMaker: 2, leader: 1 },
        },
        {
          text: "なんか独特だよね",
          points: { geniusSkin: 2, myPace: 1 },
        },
      ],
    },
    {
      id: "personality-q4",
      question: "誰かが困っていたらどうする？",
      choices: [
        {
          text: "すぐに動いて助ける",
          points: { supporter: 2, leader: 1 },
        },
        {
          text: "どうしたら一番いいか考える",
          points: { leader: 2, geniusSkin: 1 },
        },
        {
          text: "相手が気を使わない形でそっと助ける",
          points: { myPace: 1, supporter: 2 },
        },
      ],
    },
    {
      id: "personality-q5",
      question: "休日の過ごし方で一番近いのは？",
      choices: [
        {
          text: "誰かと予定を立てて楽しむ",
          points: { moodMaker: 2, leader: 1 },
        },
        {
          text: "ひとりで気楽に過ごす",
          points: { myPace: 2, geniusSkin: 1 },
        },
        {
          text: "気になったことをとことんやる",
          points: { geniusSkin: 2, supporter: 1 },
        },
      ],
    },
    {
      id: "personality-q6",
      question: "クラスやグループの中での立ち位置は？",
      choices: [
        {
          text: "中心にいることが多い",
          points: { leader: 2, moodMaker: 1 },
        },
        {
          text: "場をなごませるポジション",
          points: { moodMaker: 2, supporter: 1 },
        },
        {
          text: "少し離れたところから全体を見る",
          points: { myPace: 2, geniusSkin: 1 },
        },
      ],
    },
    {
      id: "personality-q7",
      question: "あなたの強みはどれに近い？",
      choices: [
        {
          text: "決断して引っぱっていけること",
          points: { leader: 2, supporter: 1 },
        },
        {
          text: "空気を明るくできること",
          points: { moodMaker: 2, myPace: 1 },
        },
        {
          text: "人にない感覚や優しさがあること",
          points: { geniusSkin: 1, supporter: 2, myPace: 1 },
        },
      ],
    },
  ],
  resultTypes: [
    {
      key: "leader",
      title: "リーダータイプ",
      description: "前に出て場を動かすのが得意なタイプ。",
      features: ["行動力がある", "頼られやすい", "決断が早い"],
    },
    {
      key: "myPace",
      title: "マイペースタイプ",
      description: "周りに流されず、自分のリズムを大切にするタイプ。",
      features: ["落ち着いている", "無理をしない", "自分軸がある"],
    },
    {
      key: "geniusSkin",
      title: "天才肌タイプ",
      description: "独特の感覚とひらめきを持つ個性派タイプ。",
      features: ["発想がユニーク", "感覚で動ける", "センスがある"],
    },
    {
      key: "moodMaker",
      title: "ムードメーカータイプ",
      description: "その場を明るくする力を持った人気者タイプ。",
      features: ["明るい", "話しかけやすい", "空気を和ませる"],
    },
    {
      key: "supporter",
      title: "サポータータイプ",
      description: "周りを支えて全体をよくする縁の下の力持ちタイプ。",
      features: ["気配りができる", "優しい", "安定感がある"],
    },
  ],
};