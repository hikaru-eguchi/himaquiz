// lib/diagnosis/data/rpg-job.ts

import { DiagnosisGame } from "../types";

export const rpgJobDiagnosis: DiagnosisGame = {
  slug: "rpg-job",
  title: "あなたのRPG職業診断",
  description: "7つの質問で、あなたに合うRPG職業を診断！",
  questions: [
    {
      id: "rpg-job-q1",
      question: "仲間と冒険するときのあなたは？",
      choices: [
        {
          text: "前に出て戦う",
          points: { warrior: 2, hero: 1 },
        },
        {
          text: "後ろから魔法でサポート",
          points: { mage: 2, healer: 1 },
        },
        {
          text: "素早く動いて敵を翻弄",
          points: { thief: 2, hero: 1 },
        },
      ],
    },
    {
      id: "rpg-job-q2",
      question: "あなたの強みに近いのは？",
      choices: [
        {
          text: "行動力",
          points: { warrior: 2, hero: 1 },
        },
        {
          text: "知識",
          points: { mage: 2, healer: 1 },
        },
        {
          text: "器用さ",
          points: { thief: 2, hero: 1 },
        },
      ],
    },
    {
      id: "rpg-job-q3",
      question: "仲間がピンチのときは？",
      choices: [
        {
          text: "自分が前に出る",
          points: { warrior: 2, hero: 1 },
        },
        {
          text: "回復やサポート",
          points: { healer: 2, mage: 1 },
        },
        {
          text: "敵の隙をつく",
          points: { thief: 2, hero: 1 },
        },
      ],
    },
    {
      id: "rpg-job-q4",
      question: "ゲームをするときのスタイルは？",
      choices: [
        {
          text: "パワー重視",
          points: { warrior: 2, hero: 1 },
        },
        {
          text: "戦略重視",
          points: { mage: 2, healer: 1 },
        },
        {
          text: "スピード重視",
          points: { thief: 2, hero: 1 },
        },
      ],
    },
    {
      id: "rpg-job-q5",
      question: "理想の能力は？",
      choices: [
        {
          text: "強い攻撃力",
          points: { warrior: 2, hero: 1 },
        },
        {
          text: "強力な魔法",
          points: { mage: 2, healer: 1 },
        },
        {
          text: "素早い動き",
          points: { thief: 2, hero: 1 },
        },
      ],
    },
    {
      id: "rpg-job-q6",
      question: "仲間から言われそうなのは？",
      choices: [
        {
          text: "頼れる",
          points: { warrior: 2, hero: 1 },
        },
        {
          text: "頭いい",
          points: { mage: 2, healer: 1 },
        },
        {
          text: "器用",
          points: { thief: 2, hero: 1 },
        },
      ],
    },
    {
      id: "rpg-job-q7",
      question: "あなたの役割に近いのは？",
      choices: [
        {
          text: "戦う人",
          points: { warrior: 2, hero: 1 },
        },
        {
          text: "支える人",
          points: { healer: 2, mage: 1 },
        },
        {
          text: "サポートや奇襲",
          points: { thief: 2, hero: 1 },
        },
      ],
    },
  ],
  resultTypes: [
    {
      key: "warrior",
      title: "戦士タイプ",
      description: "前に出て戦う、王道のパワー型。",
      features: ["行動力がある", "正面突破が得意", "頼れる"],
    },
    {
      key: "mage",
      title: "魔法使いタイプ",
      description: "知識と工夫で戦う頭脳派タイプ。",
      features: ["知識に強い", "戦略的", "独特の世界観がある"],
    },
    {
      key: "thief",
      title: "盗賊タイプ",
      description: "すばやさと器用さで活躍するタイプ。",
      features: ["要領がいい", "すばやい", "抜け目がない"],
    },
    {
      key: "healer",
      title: "僧侶タイプ",
      description: "周りを支えてチームを安定させるタイプ。",
      features: ["やさしい", "サポート上手", "安心感がある"],
    },
    {
      key: "hero",
      title: "勇者タイプ",
      description: "全体バランスがよく、中心に立ちやすいタイプ。",
      features: ["万能", "頼られやすい", "主人公感がある"],
    },
  ],
};