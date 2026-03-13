// lib/diagnosis/data/sabori.ts

import { DiagnosisGame } from "../types";

export const saboriDiagnosis: DiagnosisGame = {
  slug: "sabori",
  title: "あなたのサボり力診断",
  description: "7つの質問で、あなたのサボり力を診断！",
  questions: [
    {
      id: "sabori-q1",
      question: "やることが多いときのあなたは？",
      choices: [
        {
          text: "全部ちゃんとやる",
          points: { serious: 2, smallBreak: 1 },
        },
        {
          text: "ちょっと休みながらやる",
          points: { smallBreak: 2, smartSabori: 1 },
        },
        {
          text: "効率よくサボれる方法を考える",
          points: { smartSabori: 2, geniusSabori: 1 },
        },
      ],
    },
    {
      id: "sabori-q2",
      question: "やる気が出ないときは？",
      choices: [
        {
          text: "無理やり頑張る",
          points: { serious: 2, smallBreak: 1 },
        },
        {
          text: "少し休む",
          points: { smallBreak: 2, smartSabori: 1 },
        },
        {
          text: "今日はもうやらない",
          points: { fullSabori: 2, geniusSabori: 1 },
        },
      ],
    },
    {
      id: "sabori-q3",
      question: "課題や仕事がある日のあなたは？",
      choices: [
        {
          text: "先に終わらせる",
          points: { serious: 2, smartSabori: 1 },
        },
        {
          text: "ギリギリまで様子を見る",
          points: { smallBreak: 2, fullSabori: 1 },
        },
        {
          text: "効率いい方法を探す",
          points: { geniusSabori: 2, smartSabori: 1 },
        },
      ],
    },
    {
      id: "sabori-q4",
      question: "サボることについてどう思う？",
      choices: [
        {
          text: "あまり良くない",
          points: { serious: 2, smallBreak: 1 },
        },
        {
          text: "少しくらいは必要",
          points: { smallBreak: 2, smartSabori: 1 },
        },
        {
          text: "うまくやればOK",
          points: { smartSabori: 2, geniusSabori: 1 },
        },
      ],
    },
    {
      id: "sabori-q5",
      question: "自由時間ができたら？",
      choices: [
        {
          text: "やることを進める",
          points: { serious: 2, smartSabori: 1 },
        },
        {
          text: "少し休む",
          points: { smallBreak: 2, fullSabori: 1 },
        },
        {
          text: "全力で休む",
          points: { fullSabori: 2, geniusSabori: 1 },
        },
      ],
    },
    {
      id: "sabori-q6",
      question: "人から言われるのは？",
      choices: [
        {
          text: "真面目だね",
          points: { serious: 2, smallBreak: 1 },
        },
        {
          text: "マイペースだね",
          points: { smallBreak: 2, fullSabori: 1 },
        },
        {
          text: "要領いいね",
          points: { smartSabori: 2, geniusSabori: 1 },
        },
      ],
    },
    {
      id: "sabori-q7",
      question: "理想の働き方は？",
      choices: [
        {
          text: "しっかり働く",
          points: { serious: 2, smartSabori: 1 },
        },
        {
          text: "ほどよく休む",
          points: { smallBreak: 2, smartSabori: 1 },
        },
        {
          text: "できるだけ楽する",
          points: { geniusSabori: 2, fullSabori: 1 },
        },
      ],
    },
  ],
  resultTypes: [
    {
      key: "serious",
      title: "サボれない真面目タイプ",
      description: "やるべきことを放っておけない責任感強めタイプ。",
      features: ["真面目", "責任感が強い", "休むのが苦手"],
    },
    {
      key: "smallBreak",
      title: "ちょいサボりタイプ",
      description: "少し休みつつ、ちゃんと戻ってこられるタイプ。",
      features: ["息抜き上手", "バランス型", "調整がうまい"],
    },
    {
      key: "smartSabori",
      title: "スマートサボりタイプ",
      description: "うまく力を抜きながら結果も出す効率派タイプ。",
      features: ["効率重視", "抜きどころが上手", "要領がいい"],
    },
    {
      key: "fullSabori",
      title: "本気サボりタイプ",
      description: "サボると決めたら徹底的に休む全力休憩型。",
      features: ["開き直りが早い", "休み上手", "切り替え極端"],
    },
    {
      key: "geniusSabori",
      title: "サボりの天才タイプ",
      description: "最小労力で最大効果を狙う究極の省エネ型。",
      features: ["省エネ思考", "工夫が上手", "ラクを見つけるのが得意"],
    },
  ],
};