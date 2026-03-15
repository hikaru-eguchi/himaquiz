export type MazeQuiz = {
  id: string;
  question: string;
  choices: string[];
  answerIndex: number;
  explanation?: string;
};

export const mazeQuizData: Record<"stage1" | "stage2" | "stage3", MazeQuiz[]> = {
  stage1: [
    {
      id: "s1-q1",
      question: "日本で一番高い山は？",
      choices: ["富士山", "北岳", "槍ヶ岳", "御嶽山"],
      answerIndex: 0,
      explanation: "日本で一番高い山は富士山です。",
    },
  ],
  stage2: [
    {
      id: "s2-q1",
      question: "「火」を英語でいうと？",
      choices: ["Water", "Wind", "Fire", "Stone"],
      answerIndex: 2,
      explanation: "火は Fire です。",
    },
    {
      id: "s2-q2",
      question: "世界で一番大きい海は？",
      choices: ["大西洋", "インド洋", "太平洋", "北極海"],
      answerIndex: 2,
      explanation: "世界で一番大きい海は太平洋です。",
    },
  ],
  stage3: [
    {
      id: "s3-q1",
      question: "世界で一番長い川は？",
      choices: ["ナイル川", "アマゾン川", "長江", "ミシシッピ川"],
      answerIndex: 0,
      explanation: "一般的に世界最長はナイル川とされています。",
    },
    {
      id: "s3-q2",
      question: "世界で一番面積が大きい国は？",
      choices: ["ロシア", "中国", "カナダ", "アメリカ"],
      answerIndex: 0,
      explanation: "世界最大の国はロシアです。",
    },
    {
      id: "s3-q3",
      question: "ピラミッドがある国は？",
      choices: ["ギリシャ", "エジプト", "イタリア", "メキシコ"],
      answerIndex: 1,
      explanation: "有名なピラミッドはエジプトにあります。",
    },
  ],
};