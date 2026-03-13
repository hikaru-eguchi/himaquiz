// lib/diagnosis/data/hidden-talent.ts

import { DiagnosisGame } from "../types";

export const hiddenTalentDiagnosis: DiagnosisGame = {
  slug: "hidden-talent",
  title: "あなたの隠れた才能診断",
  description: "7つの質問で、あなたの隠れた才能タイプを診断！",
  questions: [
    {
      id: "hidden-talent-q1",
      question: "自由な時間があったら何をしたい？",
      choices: [
        {
          text: "何かを作る",
          points: { creator: 2, challenger: 1 },
        },
        {
          text: "人と話す",
          points: { speaker: 2, connector: 1 },
        },
        {
          text: "観察したり調べたりする",
          points: { observer: 2, creator: 1 },
        },
      ],
    },
    {
      id: "hidden-talent-q2",
      question: "人から言われやすいのは？",
      choices: [
        {
          text: "アイデアが面白い",
          points: { creator: 2, challenger: 1 },
        },
        {
          text: "話が分かりやすい",
          points: { speaker: 2, connector: 1 },
        },
        {
          text: "よく見てるね",
          points: { observer: 2, creator: 1 },
        },
      ],
    },
    {
      id: "hidden-talent-q3",
      question: "グループで自然となる役割は？",
      choices: [
        {
          text: "新しいことを提案する",
          points: { challenger: 2, creator: 1 },
        },
        {
          text: "話をまとめる",
          points: { connector: 2, speaker: 1 },
        },
        {
          text: "状況を見て分析する",
          points: { observer: 2, connector: 1 },
        },
      ],
    },
    {
      id: "hidden-talent-q4",
      question: "困った状況になったときは？",
      choices: [
        {
          text: "新しいアイデアで解決",
          points: { creator: 2, challenger: 1 },
        },
        {
          text: "人に説明して助けを求める",
          points: { speaker: 2, connector: 1 },
        },
        {
          text: "状況を観察して原因を探す",
          points: { observer: 2, creator: 1 },
        },
      ],
    },
    {
      id: "hidden-talent-q5",
      question: "得意なことに近いのは？",
      choices: [
        {
          text: "新しいものを作る",
          points: { creator: 2, challenger: 1 },
        },
        {
          text: "人に伝える",
          points: { speaker: 2, connector: 1 },
        },
        {
          text: "よく見る・気づく",
          points: { observer: 2, connector: 1 },
        },
      ],
    },
    {
      id: "hidden-talent-q6",
      question: "あなたの強みは？",
      choices: [
        {
          text: "発想力",
          points: { creator: 2, challenger: 1 },
        },
        {
          text: "コミュニケーション",
          points: { speaker: 2, connector: 1 },
        },
        {
          text: "観察力",
          points: { observer: 2, creator: 1 },
        },
      ],
    },
    {
      id: "hidden-talent-q7",
      question: "理想の能力は？",
      choices: [
        {
          text: "新しいものを生み出す力",
          points: { creator: 2, challenger: 1 },
        },
        {
          text: "人に伝える力",
          points: { speaker: 2, connector: 1 },
        },
        {
          text: "細かい違いに気づく力",
          points: { observer: 2, connector: 1 },
        },
      ],
    },
  ],
  resultTypes: [
    {
      key: "creator",
      title: "クリエイタータイプ",
      description: "何かを生み出す才能が眠っているタイプ。",
      features: ["作るのが好き", "表現力がある", "発想が柔らかい"],
    },
    {
      key: "speaker",
      title: "伝える才能タイプ",
      description: "話したり説明したりする才能があるタイプ。",
      features: ["会話が上手", "伝達力がある", "人を引きつける"],
    },
    {
      key: "observer",
      title: "観察才能タイプ",
      description: "周りをよく見て違いに気づける才能を持つタイプ。",
      features: ["気づきが多い", "分析が得意", "慎重"],
    },
    {
      key: "connector",
      title: "つなぐ才能タイプ",
      description: "人や情報をうまく結びつける才能があるタイプ。",
      features: ["調整が得意", "人間関係に強い", "まとめ役向き"],
    },
    {
      key: "challenger",
      title: "挑戦才能タイプ",
      description: "新しいことへ飛び込む力が才能になるタイプ。",
      features: ["勇気がある", "行動が早い", "変化に強い"],
    },
  ],
};