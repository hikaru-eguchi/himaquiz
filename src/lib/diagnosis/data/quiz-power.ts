// lib/diagnosis/data/quiz-power.ts

import { DiagnosisGame } from "../types";

export const quizPowerDiagnosis: DiagnosisGame = {
  slug: "quiz-power",
  title: "あなたのクイズ戦闘力診断",
  description: "7つの質問で、あなたのクイズ戦闘力タイプを診断！",
  questions: [
    {
      id: "quiz-power-q1",
      question: "クイズ番組を見ているときのあなたは？",
      choices: [
        {
          text: "知ってる問題が多くて楽しい",
          points: { knowledgeMonster: 2, balanced: 1 },
        },
        {
          text: "なんとなく当たることが多い",
          points: { intuition: 2, speed: 1 },
        },
        {
          text: "問題文や選択肢をよく考える",
          points: { analyst: 2, balanced: 1 },
        },
      ],
    },
    {
      id: "quiz-power-q2",
      question: "難しい問題が出たときどうする？",
      choices: [
        {
          text: "知識を思い出して答える",
          points: { knowledgeMonster: 2, analyst: 1 },
        },
        {
          text: "とりあえず直感で選ぶ",
          points: { intuition: 2, speed: 1 },
        },
        {
          text: "選択肢から消去法で考える",
          points: { analyst: 2, balanced: 1 },
        },
      ],
    },
    {
      id: "quiz-power-q3",
      question: "あなたが得意そうなのは？",
      choices: [
        {
          text: "雑学や知識クイズ",
          points: { knowledgeMonster: 2, balanced: 1 },
        },
        {
          text: "心理系や直感クイズ",
          points: { intuition: 2, speed: 1 },
        },
        {
          text: "推理やロジック系クイズ",
          points: { analyst: 2, balanced: 1 },
        },
      ],
    },
    {
      id: "quiz-power-q4",
      question: "クイズゲームで勝つために大事なのは？",
      choices: [
        {
          text: "知識量",
          points: { knowledgeMonster: 2, balanced: 1 },
        },
        {
          text: "ひらめき",
          points: { intuition: 2, speed: 1 },
        },
        {
          text: "考える力",
          points: { analyst: 2, balanced: 1 },
        },
      ],
    },
    {
      id: "quiz-power-q5",
      question: "早押しクイズをしたら？",
      choices: [
        {
          text: "知ってる問題で勝てる",
          points: { knowledgeMonster: 2, speed: 1 },
        },
        {
          text: "とにかく早く押す",
          points: { speed: 2, intuition: 1 },
        },
        {
          text: "様子を見て確実に答える",
          points: { analyst: 2, balanced: 1 },
        },
      ],
    },
    {
      id: "quiz-power-q6",
      question: "あなたのクイズスタイルは？",
      choices: [
        {
          text: "知識で攻める",
          points: { knowledgeMonster: 2, balanced: 1 },
        },
        {
          text: "流れと直感で攻める",
          points: { intuition: 2, speed: 1 },
        },
        {
          text: "冷静に考えて攻める",
          points: { analyst: 2, balanced: 1 },
        },
      ],
    },
    {
      id: "quiz-power-q7",
      question: "クイズ大会に出るなら？",
      choices: [
        {
          text: "知識問題で勝負したい",
          points: { knowledgeMonster: 2, balanced: 1 },
        },
        {
          text: "直感や心理戦があると楽しい",
          points: { intuition: 2, speed: 1 },
        },
        {
          text: "推理や思考系が得意",
          points: { analyst: 2, balanced: 1 },
        },
      ],
    },
  ],
  resultTypes: [
    {
      key: "knowledgeMonster",
      title: "知識モンスタータイプ",
      description: "知識量でゴリ押しできる圧倒的ストック型。",
      features: ["雑学に強い", "記憶量が多い", "幅広く知っている"],
      recommendedGenres: ["歴史", "雑学"],
    },
    {
      key: "intuition",
      title: "直感エースタイプ",
      description: "なんとなくで当てるセンスが光る直感型。",
      features: ["勘が鋭い", "ひらめきが早い", "流れに強い"],
      recommendedGenres: ["心理", "なぞなぞ"],
    },
    {
      key: "analyst",
      title: "分析タイプ",
      description: "選択肢や問題文から答えを絞るのが得意なタイプ。",
      features: ["消去法が得意", "観察力がある", "冷静"],
      recommendedGenres: ["科学", "数学"],
    },
    {
      key: "speed",
      title: "スピードタイプ",
      description: "考えるより先に動ける、瞬発力の高いタイプ。",
      features: ["反応が早い", "テンポがいい", "短期決戦に強い"],
      recommendedGenres: ["早押し系", "ミニゲーム系"],
    },
    {
      key: "balanced",
      title: "万能タイプ",
      description: "知識・勘・安定感のバランスがいいオールラウンダー。",
      features: ["クセが少ない", "安定して強い", "対応力が高い"],
      recommendedGenres: ["総合", "ランダム"],
    },
  ],
};