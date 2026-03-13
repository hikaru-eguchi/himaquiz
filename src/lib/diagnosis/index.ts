// lib/diagnosis/index.ts

export * from "./types";
export * from "./themes";
export * from "./results";

export * from "./data/hidden-ability";
export * from "./data/personality";
export * from "./data/love";
export * from "./data/quiz-power";
export * from "./data/brain";
export * from "./data/genius";
export * from "./data/iq";
export * from "./data/himajin";
export * from "./data/thinking";
export * from "./data/strength";
export * from "./data/hidden-talent";
export * from "./data/mental";
export * from "./data/sabori";
export * from "./data/zubora";
export * from "./data/communication";
export * from "./data/rpg-job";
export * from "./data/food";
export * from "./data/animal";

import { hiddenAbilityDiagnosis } from "./data/hidden-ability";
import { personalityDiagnosis } from "./data/personality";
import { loveDiagnosis } from "./data/love";
import { quizPowerDiagnosis } from "./data/quiz-power";
import { brainDiagnosis } from "./data/brain";
import { geniusDiagnosis } from "./data/genius";
import { iqDiagnosis } from "./data/iq";
import { himajinDiagnosis } from "./data/himajin";
import { thinkingDiagnosis } from "./data/thinking";
import { strengthDiagnosis } from "./data/strength";
import { hiddenTalentDiagnosis } from "./data/hidden-talent";
import { mentalDiagnosis } from "./data/mental";
import { saboriDiagnosis } from "./data/sabori";
import { zuboraDiagnosis } from "./data/zubora";
import { communicationDiagnosis } from "./data/communication";
import { rpgJobDiagnosis } from "./data/rpg-job";
import { foodDiagnosis } from "./data/food";
import { animalDiagnosis } from "./data/animal";
import { DiagnosisGame } from "./types";

export const diagnosisGames: DiagnosisGame[] = [
  hiddenAbilityDiagnosis,
  personalityDiagnosis,
  loveDiagnosis,
  quizPowerDiagnosis,
  brainDiagnosis,
  geniusDiagnosis,
  iqDiagnosis,
  himajinDiagnosis,
  thinkingDiagnosis,
  strengthDiagnosis,
  hiddenTalentDiagnosis,
  mentalDiagnosis,
  saboriDiagnosis,
  zuboraDiagnosis,
  communicationDiagnosis,
  rpgJobDiagnosis,
  foodDiagnosis,
  animalDiagnosis,
];

export const diagnosisGameMap = Object.fromEntries(
  diagnosisGames.map((game) => [game.slug, game])
) as Record<string, DiagnosisGame>;

export function getDiagnosisGameBySlug(slug: string) {
  return diagnosisGameMap[slug];
}