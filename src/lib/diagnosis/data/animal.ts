// lib/diagnosis/data/animal.ts

import { DiagnosisGame } from "../types";

export const animalDiagnosis: DiagnosisGame = {
  slug: "animal",
  title: "あなたの動物タイプ診断",
  description: "7つの質問で、あなたを動物に例えると何タイプか診断！",
  questions: [
    {
      id: "animal-q1",
      question: "友達の中でのあなたは？",
      choices: [
        {
          text: "引っぱるタイプ",
          points: { lion: 2, dog: 1 },
        },
        {
          text: "自由に楽しむタイプ",
          points: { cat: 2, rabbit: 1 },
        },
        {
          text: "周りをよく見ている",
          points: { owl: 2, rabbit: 1 },
        },
      ],
    },
    {
      id: "animal-q2",
      question: "周りから言われやすいのは？",
      choices: [
        {
          text: "頼れる",
          points: { lion: 2, dog: 1 },
        },
        {
          text: "マイペース",
          points: { cat: 2, rabbit: 1 },
        },
        {
          text: "落ち着いている",
          points: { owl: 2, cat: 1 },
        },
      ],
    },
    {
      id: "animal-q3",
      question: "好きな過ごし方は？",
      choices: [
        {
          text: "みんなで遊ぶ",
          points: { dog: 2, lion: 1 },
        },
        {
          text: "自分の時間",
          points: { cat: 2, owl: 1 },
        },
        {
          text: "ゆったりのんびり",
          points: { rabbit: 2, cat: 1 },
        },
      ],
    },
    {
      id: "animal-q4",
      question: "あなたの性格に近いのは？",
      choices: [
        {
          text: "堂々としている",
          points: { lion: 2, dog: 1 },
        },
        {
          text: "自由",
          points: { cat: 2, rabbit: 1 },
        },
        {
          text: "冷静",
          points: { owl: 2, cat: 1 },
        },
      ],
    },
    {
      id: "animal-q5",
      question: "困ったときは？",
      choices: [
        {
          text: "自分で解決する",
          points: { lion: 2, owl: 1 },
        },
        {
          text: "誰かに相談する",
          points: { dog: 2, rabbit: 1 },
        },
        {
          text: "ゆっくり考える",
          points: { owl: 2, cat: 1 },
        },
      ],
    },
    {
      id: "animal-q6",
      question: "周りからの印象は？",
      choices: [
        {
          text: "強そう",
          points: { lion: 2, dog: 1 },
        },
        {
          text: "かわいい",
          points: { rabbit: 2, cat: 1 },
        },
        {
          text: "頭よさそう",
          points: { owl: 2, cat: 1 },
        },
      ],
    },
    {
      id: "animal-q7",
      question: "理想の自分に近いのは？",
      choices: [
        {
          text: "リーダー",
          points: { lion: 2, dog: 1 },
        },
        {
          text: "自由人",
          points: { cat: 2, rabbit: 1 },
        },
        {
          text: "知的",
          points: { owl: 2, cat: 1 },
        },
      ],
    },
  ],
  resultTypes: [
    {
      key: "lion",
      title: "ライオンタイプ",
      description: "自信と存在感があるリーダー気質タイプ。",
      features: ["堂々としている", "頼られやすい", "勝負強い"],
    },
    {
      key: "cat",
      title: "ねこタイプ",
      description: "自由気ままでマイペースな魅力タイプ。",
      features: ["気分屋", "自分らしい", "愛されやすい"],
    },
    {
      key: "dog",
      title: "いぬタイプ",
      description: "まっすぐで人なつっこい信頼型タイプ。",
      features: ["一途", "親しみやすい", "元気"],
    },
    {
      key: "owl",
      title: "ふくろうタイプ",
      description: "冷静で賢く、全体をよく見ているタイプ。",
      features: ["観察力が高い", "落ち着いている", "知的"],
    },
    {
      key: "rabbit",
      title: "うさぎタイプ",
      description: "やさしく繊細で、ふんわりした魅力のあるタイプ。",
      features: ["繊細", "かわいらしい", "気配り上手"],
    },
  ],
};