// lib/diagnosis/data/food.ts

import { DiagnosisGame } from "../types";

export const foodDiagnosis: DiagnosisGame = {
  slug: "food",
  title: "あなたの食べ物タイプ診断",
  description: "7つの質問で、あなたを食べ物に例えると何タイプか診断！",
  questions: [
    {
      id: "food-q1",
      question: "友達と集まるときのあなたは？",
      choices: [
        {
          text: "場を盛り上げる",
          points: { curry: 2, cake: 1 },
        },
        {
          text: "落ち着いて会話する",
          points: { soup: 2, rice: 1 },
        },
        {
          text: "自分のペースで楽しむ",
          points: { ramen: 2, curry: 1 },
        },
      ],
    },
    {
      id: "food-q2",
      question: "周りから言われやすいのは？",
      choices: [
        {
          text: "元気だね",
          points: { curry: 2, cake: 1 },
        },
        {
          text: "安心する",
          points: { rice: 2, soup: 1 },
        },
        {
          text: "個性的",
          points: { ramen: 2, curry: 1 },
        },
      ],
    },
    {
      id: "food-q3",
      question: "あなたの雰囲気に近いのは？",
      choices: [
        {
          text: "明るい",
          points: { cake: 2, curry: 1 },
        },
        {
          text: "落ち着いている",
          points: { soup: 2, rice: 1 },
        },
        {
          text: "インパクトがある",
          points: { ramen: 2, curry: 1 },
        },
      ],
    },
    {
      id: "food-q4",
      question: "好きな時間の過ごし方は？",
      choices: [
        {
          text: "みんなでワイワイ",
          points: { curry: 2, cake: 1 },
        },
        {
          text: "のんびり過ごす",
          points: { soup: 2, rice: 1 },
        },
        {
          text: "好きなことに集中",
          points: { ramen: 2, curry: 1 },
        },
      ],
    },
    {
      id: "food-q5",
      question: "あなたの強みに近いのは？",
      choices: [
        {
          text: "盛り上げる力",
          points: { cake: 2, curry: 1 },
        },
        {
          text: "安定感",
          points: { rice: 2, soup: 1 },
        },
        {
          text: "個性",
          points: { ramen: 2, curry: 1 },
        },
      ],
    },
    {
      id: "food-q6",
      question: "グループの中でのあなたは？",
      choices: [
        {
          text: "中心にいる",
          points: { curry: 2, cake: 1 },
        },
        {
          text: "支える役",
          points: { rice: 2, soup: 1 },
        },
        {
          text: "自由ポジション",
          points: { ramen: 2, curry: 1 },
        },
      ],
    },
    {
      id: "food-q7",
      question: "あなたに近い食べ物イメージは？",
      choices: [
        {
          text: "みんな大好きな料理",
          points: { curry: 2, rice: 1 },
        },
        {
          text: "やさしい味",
          points: { soup: 2, rice: 1 },
        },
        {
          text: "クセになる味",
          points: { ramen: 2, cake: 1 },
        },
      ],
    },
  ],
  resultTypes: [
    {
      key: "curry",
      title: "カレータイプ",
      description: "情熱的で人気者。みんなから愛されやすいタイプ。",
      features: ["存在感がある", "盛り上げ上手", "親しみやすい"],
    },
    {
      key: "ramen",
      title: "ラーメンタイプ",
      description: "クセになる魅力がある、強い個性派タイプ。",
      features: ["印象に残る", "中毒性がある", "勢いがある"],
    },
    {
      key: "rice",
      title: "白ごはんタイプ",
      description: "どんな場面にもなじむ安定感抜群タイプ。",
      features: ["安心感がある", "万能", "支え役になれる"],
    },
    {
      key: "cake",
      title: "ケーキタイプ",
      description: "華やかで場を明るくする人気者タイプ。",
      features: ["明るい", "映える", "特別感がある"],
    },
    {
      key: "soup",
      title: "スープタイプ",
      description: "やさしく包み込むような落ち着きタイプ。",
      features: ["やわらかい", "癒やし系", "気配り上手"],
    },
  ],
};