// lib/diagnosis/data/mental.ts

import { DiagnosisGame } from "../types";

export const mentalDiagnosis: DiagnosisGame = {
  slug: "mental",
  title: "あなたのメンタルタイプ診断",
  description: "7つの質問で、あなたのメンタルタイプを診断！",
  questions: [
    {
      id: "mental-q1",
      question: "嫌なことがあったときのあなたは？",
      choices: [
        {
          text: "あまり気にしない",
          points: { steel: 2, free: 1 },
        },
        {
          text: "少し落ち込む",
          points: { sensitive: 2, patience: 1 },
        },
        {
          text: "すぐ気持ちを切り替える",
          points: { recovery: 2, free: 1 },
        },
      ],
    },
    {
      id: "mental-q2",
      question: "プレッシャーがかかったときは？",
      choices: [
        {
          text: "冷静に対応できる",
          points: { steel: 2, patience: 1 },
        },
        {
          text: "ちょっと緊張する",
          points: { sensitive: 2, patience: 1 },
        },
        {
          text: "あまり気にしない",
          points: { free: 2, recovery: 1 },
        },
      ],
    },
    {
      id: "mental-q3",
      question: "失敗したときは？",
      choices: [
        {
          text: "原因を考えて次に活かす",
          points: { patience: 2, steel: 1 },
        },
        {
          text: "少し引きずる",
          points: { sensitive: 2, patience: 1 },
        },
        {
          text: "すぐ気持ちを切り替える",
          points: { recovery: 2, free: 1 },
        },
      ],
    },
    {
      id: "mental-q4",
      question: "人から何か言われたときは？",
      choices: [
        {
          text: "あまり気にしない",
          points: { steel: 2, free: 1 },
        },
        {
          text: "気にしてしまう",
          points: { sensitive: 2, patience: 1 },
        },
        {
          text: "深く考えず流す",
          points: { free: 2, recovery: 1 },
        },
      ],
    },
    {
      id: "mental-q5",
      question: "疲れたときは？",
      choices: [
        {
          text: "少し休んでまた頑張る",
          points: { patience: 2, steel: 1 },
        },
        {
          text: "気分転換する",
          points: { recovery: 2, free: 1 },
        },
        {
          text: "少し落ち込みやすい",
          points: { sensitive: 2, patience: 1 },
        },
      ],
    },
    {
      id: "mental-q6",
      question: "周りから言われるのは？",
      choices: [
        {
          text: "落ち着いている",
          points: { steel: 2, patience: 1 },
        },
        {
          text: "優しい",
          points: { sensitive: 2, patience: 1 },
        },
        {
          text: "マイペース",
          points: { free: 2, recovery: 1 },
        },
      ],
    },
    {
      id: "mental-q7",
      question: "あなたのメンタルに近いのは？",
      choices: [
        {
          text: "ブレない",
          points: { steel: 2, patience: 1 },
        },
        {
          text: "気持ちの動きが大きい",
          points: { sensitive: 2, recovery: 1 },
        },
        {
          text: "気楽に考える",
          points: { free: 2, recovery: 1 },
        },
      ],
    },
  ],
  resultTypes: [
    {
      key: "steel",
      title: "鋼メンタルタイプ",
      description: "少しのことではブレない安定感のあるタイプ。",
      features: ["打たれ強い", "落ち着いている", "冷静"],
    },
    {
      key: "sensitive",
      title: "繊細タイプ",
      description: "小さな変化にも気づける感受性の高いタイプ。",
      features: ["感受性が豊か", "気配りができる", "優しい"],
    },
    {
      key: "recovery",
      title: "回復早いタイプ",
      description: "落ち込んでも立ち直りが早い切り替え上手タイプ。",
      features: ["引きずりにくい", "前向き", "復活が早い"],
    },
    {
      key: "patience",
      title: "我慢強いタイプ",
      description: "しんどくても耐えながら進める粘り強いタイプ。",
      features: ["忍耐力がある", "継続が得意", "責任感がある"],
    },
    {
      key: "free",
      title: "気楽タイプ",
      description: "深く考えすぎず、自然体でいられるタイプ。",
      features: ["楽観的", "自然体", "気持ちが軽い"],
    },
  ],
};