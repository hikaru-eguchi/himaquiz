// lib/diagnosis/data/love.ts

import { DiagnosisGame } from "../types";

export const loveDiagnosis: DiagnosisGame = {
  slug: "love",
  title: "あなたの恋愛タイプ診断",
  description: "7つの質問で、あなたの恋愛タイプを診断！",
  questions: [
    {
      id: "love-q1",
      question: "好きな人ができたらどうする？",
      choices: [
        {
          text: "すぐアプローチしたくなる",
          points: { passionate: 2, tsundere: 1 },
        },
        {
          text: "まず様子を見て距離を測る",
          points: { careful: 2, natural: 1 },
        },
        {
          text: "自然に仲良くなるのを待つ",
          points: { natural: 2, devoted: 1 },
        },
      ],
    },
    {
      id: "love-q2",
      question: "恋愛で一番大事だと思うものは？",
      choices: [
        {
          text: "ドキドキや情熱",
          points: { passionate: 2, tsundere: 1 },
        },
        {
          text: "信頼や安心感",
          points: { devoted: 2, careful: 1 },
        },
        {
          text: "自然体でいられること",
          points: { natural: 2, devoted: 1 },
        },
      ],
    },
    {
      id: "love-q3",
      question: "相手に褒められたらどうなる？",
      choices: [
        {
          text: "めちゃくちゃ嬉しくてテンション上がる",
          points: { passionate: 2, natural: 1 },
        },
        {
          text: "照れてちょっと素っ気なくなる",
          points: { tsundere: 2, careful: 1 },
        },
        {
          text: "静かに嬉しい気持ちになる",
          points: { devoted: 2, natural: 1 },
        },
      ],
    },
    {
      id: "love-q4",
      question: "恋愛の理想はどれに近い？",
      choices: [
        {
          text: "ドラマみたいに盛り上がる恋",
          points: { passionate: 2, tsundere: 1 },
        },
        {
          text: "長く続く安定した恋",
          points: { devoted: 2, careful: 1 },
        },
        {
          text: "友達みたいに自然な恋",
          points: { natural: 2, devoted: 1 },
        },
      ],
    },
    {
      id: "love-q5",
      question: "相手が落ち込んでいたら？",
      choices: [
        {
          text: "全力で励ましたくなる",
          points: { passionate: 2, devoted: 1 },
        },
        {
          text: "そっと寄り添う",
          points: { devoted: 2, natural: 1 },
        },
        {
          text: "何て声をかけるか慎重に考える",
          points: { careful: 2, tsundere: 1 },
        },
      ],
    },
    {
      id: "love-q6",
      question: "恋愛でよく言われることは？",
      choices: [
        {
          text: "好きになるとわかりやすい",
          points: { passionate: 2, natural: 1 },
        },
        {
          text: "なかなか本音を見せない",
          points: { tsundere: 2, careful: 1 },
        },
        {
          text: "一途だよね",
          points: { devoted: 2, natural: 1 },
        },
      ],
    },
    {
      id: "love-q7",
      question: "理想の恋人関係は？",
      choices: [
        {
          text: "毎日会いたいくらい仲良し",
          points: { passionate: 2, tsundere: 1 },
        },
        {
          text: "お互い信頼できる落ち着いた関係",
          points: { devoted: 2, careful: 1 },
        },
        {
          text: "気楽で自然な関係",
          points: { natural: 2, devoted: 1 },
        },
      ],
    },
  ],
  resultTypes: [
    {
      key: "passionate",
      title: "情熱タイプ",
      description: "好きになると一直線。気持ちがわかりやすいタイプ。",
      features: ["気持ちが熱い", "行動が早い", "愛情表現が豊か"],
    },
    {
      key: "careful",
      title: "慎重タイプ",
      description: "相手をよく見て、ゆっくり距離を縮めるタイプ。",
      features: ["失敗を避けたい", "信頼を大切にする", "見極めが丁寧"],
    },
    {
      key: "natural",
      title: "自然体タイプ",
      description: "無理せず自然な関係を求めるタイプ。",
      features: ["飾らない", "居心地重視", "落ち着いた関係が好き"],
    },
    {
      key: "tsundere",
      title: "ツンデレタイプ",
      description: "素直じゃないけど、実はかなり一途なタイプ。",
      features: ["照れやすい", "本音を隠しがち", "好きになると深い"],
    },
    {
      key: "devoted",
      title: "一途タイプ",
      description: "ひとりを大切にして、じっくり愛を育てるタイプ。",
      features: ["誠実", "ブレにくい", "長続きしやすい"],
    },
  ],
};