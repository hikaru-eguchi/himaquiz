// lib/diagnosis/types.ts

export type DiagnosisChoice = {
  text: string;
  points: Record<string, number>;
};

export type DiagnosisQuestion = {
  id: string;
  question: string;
  choices: [DiagnosisChoice, DiagnosisChoice, DiagnosisChoice];
};

export type DiagnosisResultType = {
  key: string;
  title: string;
  description: string;
  features?: string[];
  recommendedGenres?: string[];
  image?: string;
};

export type DiagnosisGame = {
  slug: string;
  title: string;
  description?: string;
  questions: DiagnosisQuestion[];
  resultTypes: DiagnosisResultType[];
};