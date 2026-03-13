// lib/diagnosis/data/zubora.ts

import { DiagnosisGame } from "../types";

export const zuboraDiagnosis: DiagnosisGame = {
  slug: "zubora",
  title: "あなたのズボラ度診断",
  description: "7つの質問で、あなたのズボラ度を診断！",
  questions: [
    {
      id: "zubora-q1",
      question: "部屋の片付けは？",
      choices: [
        {
          text: "常にきれい",
          points: { perfect: 2, normal: 1 },
        },
        {
          text: "たまに片付ける",
          points: { normal: 2, relaxed: 1 },
        },
        {
          text: "散らかりがち",
          points: { bigZubora: 2, legendZubora: 1 },
        },
      ],
    },
    {
      id: "zubora-q2",
      question: "やることがあるときのあなたは？",
      choices: [
        {
          text: "すぐやる",
          points: { perfect: 2, normal: 1 },
        },
        {
          text: "気分でやる",
          points: { relaxed: 2, normal: 1 },
        },
        {
          text: "ギリギリまでやらない",
          points: { bigZubora: 2, legendZubora: 1 },
        },
      ],
    },
    {
      id: "zubora-q3",
      question: "洗濯物は？",
      choices: [
        {
          text: "すぐ畳む",
          points: { perfect: 2, normal: 1 },
        },
        {
          text: "あとで畳む",
          points: { normal: 2, relaxed: 1 },
        },
        {
          text: "そのまま使う",
          points: { bigZubora: 2, legendZubora: 1 },
        },
      ],
    },
    {
      id: "zubora-q4",
      question: "スマホの通知は？",
      choices: [
        {
          text: "すぐ確認",
          points: { perfect: 2, normal: 1 },
        },
        {
          text: "あとで見る",
          points: { relaxed: 2, normal: 1 },
        },
        {
          text: "気づいたら溜まってる",
          points: { bigZubora: 2, legendZubora: 1 },
        },
      ],
    },
    {
      id: "zubora-q5",
      question: "掃除の頻度は？",
      choices: [
        {
          text: "定期的にする",
          points: { perfect: 2, normal: 1 },
        },
        {
          text: "気が向いたとき",
          points: { relaxed: 2, normal: 1 },
        },
        {
          text: "ほぼしない",
          points: { bigZubora: 2, legendZubora: 1 },
        },
      ],
    },
    {
      id: "zubora-q6",
      question: "予定管理は？",
      choices: [
        {
          text: "しっかり管理",
          points: { perfect: 2, normal: 1 },
        },
        {
          text: "だいたい覚えてる",
          points: { normal: 2, relaxed: 1 },
        },
        {
          text: "よく忘れる",
          points: { bigZubora: 2, legendZubora: 1 },
        },
      ],
    },
    {
      id: "zubora-q7",
      question: "理想の生活スタイルは？",
      choices: [
        {
          text: "きっちり生活",
          points: { perfect: 2, normal: 1 },
        },
        {
          text: "ゆるく生活",
          points: { relaxed: 2, normal: 1 },
        },
        {
          text: "できるだけ楽する",
          points: { legendZubora: 2, bigZubora: 1 },
        },
      ],
    },
  ],
  resultTypes: [
    {
      key: "perfect",
      title: "しっかり者タイプ",
      description: "きっちり整えておきたい管理上手タイプ。",
      features: ["整理整頓が得意", "計画的", "抜けが少ない"],
    },
    {
      key: "normal",
      title: "ふつうタイプ",
      description: "少しズボラだけど、だいたい何とかするタイプ。",
      features: ["ほどよく適当", "やるときはやる", "バランス型"],
    },
    {
      key: "relaxed",
      title: "ゆるズボラタイプ",
      description: "細かいことは気にしない、のんびりタイプ。",
      features: ["気楽", "細部は気にしない", "マイペース"],
    },
    {
      key: "bigZubora",
      title: "かなりズボラタイプ",
      description: "後回し癖がちょっと強めな省エネタイプ。",
      features: ["後回ししがち", "面倒を避けたい", "ラク優先"],
    },
    {
      key: "legendZubora",
      title: "伝説のズボラタイプ",
      description: "ズボラを極めた、ある意味才能のあるタイプ。",
      features: ["とことん省エネ", "独自ルールがある", "開き直りが強い"],
    },
  ],
};