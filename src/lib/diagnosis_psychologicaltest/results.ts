// lib/diagnosis/results.ts

import { DiagnosisGame } from "./types";

export type DiagnosisScoreMap = Record<string, number>;

export function createEmptyScoreMap(game: DiagnosisGame): DiagnosisScoreMap {
  return game.resultTypes.reduce<DiagnosisScoreMap>((acc, resultType) => {
    acc[resultType.key] = 0;
    return acc;
  }, {});
}

export function calculateDiagnosisScores(
  game: DiagnosisGame,
  selectedChoiceIndexes: number[]
): DiagnosisScoreMap {
  const scoreMap = createEmptyScoreMap(game);

  game.questions.forEach((question, questionIndex) => {
    const selectedChoiceIndex = selectedChoiceIndexes[questionIndex];
    const selectedChoice = question.choices[selectedChoiceIndex];

    if (!selectedChoice) return;

    Object.entries(selectedChoice.points).forEach(([typeKey, point]) => {
      if (scoreMap[typeKey] === undefined) {
        scoreMap[typeKey] = 0;
      }
      scoreMap[typeKey] += point;
    });
  });

  return scoreMap;
}

export function getTopDiagnosisResult(
  game: DiagnosisGame,
  selectedChoiceIndexes: number[]
) {
  const scoreMap = calculateDiagnosisScores(game, selectedChoiceIndexes);

  const sorted = [...game.resultTypes].sort((a, b) => {
    const aScore = scoreMap[a.key] ?? 0;
    const bScore = scoreMap[b.key] ?? 0;
    return bScore - aScore;
  });

  const topResult = sorted[0];

  return {
    result: topResult,
    scores: scoreMap,
  };
}