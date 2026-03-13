// lib/diagnosis/data/hidden-ability.ts

import { DiagnosisGame } from "../types";

export const hiddenAbilityDiagnosis: DiagnosisGame = {
  slug: "hidden-ability",
  title: "あなたの隠れ能力診断",
  description: "7つの質問で、あなたの隠れた能力タイプを診断！",
  questions: [
    {
      id: "hidden-ability-q1",
      question: "何か新しいことに出会ったとき、最初にしがちなのは？",
      choices: [
        {
          text: "自分ならどう変えられるか考える",
          points: { inventor: 2, ideaMaker: 1 },
        },
        {
          text: "仕組みやルールを観察する",
          points: { analyst: 2, steady: 1 },
        },
        {
          text: "とりあえず感覚で触ってみる",
          points: { geniusSkin: 2, inventor: 1 },
        },
      ],
    },
    {
      id: "hidden-ability-q2",
      question: "人から褒められやすいのはどれ？",
      choices: [
        {
          text: "発想が面白い",
          points: { ideaMaker: 2, inventor: 1 },
        },
        {
          text: "よく見てるねと言われる",
          points: { analyst: 2, steady: 1 },
        },
        {
          text: "なんかセンスあるよねと言われる",
          points: { geniusSkin: 2, ideaMaker: 1 },
        },
      ],
    },
    {
      id: "hidden-ability-q3",
      question: "うまくいかないことがあったとき、どうする？",
      choices: [
        {
          text: "別のやり方をどんどん試す",
          points: { inventor: 2, geniusSkin: 1 },
        },
        {
          text: "原因を整理して考える",
          points: { analyst: 2, steady: 1 },
        },
        {
          text: "少しずつ続けて改善する",
          points: { steady: 2, analyst: 1 },
        },
      ],
    },
    {
      id: "hidden-ability-q4",
      question: "自由時間ができたら何をしたくなる？",
      choices: [
        {
          text: "新しいものを作ったり試したりしたい",
          points: { inventor: 2, ideaMaker: 1 },
        },
        {
          text: "気になっていたことを調べたい",
          points: { analyst: 2, steady: 1 },
        },
        {
          text: "思いついたことを気ままにやりたい",
          points: { geniusSkin: 2, ideaMaker: 1 },
        },
      ],
    },
    {
      id: "hidden-ability-q5",
      question: "グループの中で自然となりやすい役割は？",
      choices: [
        {
          text: "新しい案を出す人",
          points: { ideaMaker: 2, inventor: 1 },
        },
        {
          text: "問題点を見つける人",
          points: { analyst: 2, steady: 1 },
        },
        {
          text: "気づいたら独自路線で進める人",
          points: { geniusSkin: 2, inventor: 1 },
        },
      ],
    },
    {
      id: "hidden-ability-q6",
      question: "あなたの強みに一番近いのは？",
      choices: [
        {
          text: "ゼロから形にする力",
          points: { inventor: 2, steady: 1 },
        },
        {
          text: "細かく見て整理する力",
          points: { analyst: 2, steady: 1 },
        },
        {
          text: "ひらめきと感覚で進める力",
          points: { geniusSkin: 2, ideaMaker: 1 },
        },
      ],
    },
    {
      id: "hidden-ability-q7",
      question: "実は自分に向いていそうだと思うのは？",
      choices: [
        {
          text: "新しい企画や発明を考えること",
          points: { inventor: 2, ideaMaker: 1 },
        },
        {
          text: "データや情報を分析すること",
          points: { analyst: 2, steady: 1 },
        },
        {
          text: "普通の人が思いつかない視点を出すこと",
          points: { geniusSkin: 2, ideaMaker: 1 },
        },
      ],
    },
  ],
  resultTypes: [
    {
      key: "inventor",
      title: "発明家タイプ",
      description: "ゼロから新しいものを生み出す力があるタイプ。",
      features: ["発想力が高い", "新しい視点を持ちやすい", "変化を楽しめる"],
    },
    {
      key: "analyst",
      title: "分析タイプ",
      description: "物事を冷静に見て、仕組みを見抜くのが得意なタイプ。",
      features: ["観察力が高い", "整理が得意", "論理的に考えられる"],
    },
    {
      key: "ideaMaker",
      title: "アイデアマンタイプ",
      description: "思いつきの数と柔軟さで勝負するひらめき型。",
      features: ["思いつきが豊富", "柔軟な考え方", "会話で光る"],
    },
    {
      key: "geniusSkin",
      title: "天才肌タイプ",
      description: "直感的に答えへ近づける、センス型の能力を持つタイプ。",
      features: ["感覚が鋭い", "飲み込みが早い", "独特のセンスがある"],
    },
    {
      key: "steady",
      title: "積み上げタイプ",
      description: "コツコツ積み重ねて大きな力に変える実力派タイプ。",
      features: ["継続が得意", "地道に強い", "安定感がある"],
    },
  ],
};