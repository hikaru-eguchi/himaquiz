// lib/diagnosis/index.ts

export * from "./types";
export * from "./themes";
export * from "./results";

export * from "./data/1";
export * from "./data/2";
export * from "./data/3";
export * from "./data/4";
export * from "./data/5";
export * from "./data/6";
export * from "./data/7";
export * from "./data/8";
export * from "./data/9";
export * from "./data/10";
export * from "./data/11";
export * from "./data/12";
export * from "./data/13";
export * from "./data/14";
export * from "./data/15";
export * from "./data/16";
export * from "./data/17";
export * from "./data/18";
export * from "./data/19";
export * from "./data/20";
export * from "./data/21";
export * from "./data/22";
export * from "./data/23";
export * from "./data/24";
export * from "./data/25";
export * from "./data/26";
export * from "./data/27";
export * from "./data/28";
export * from "./data/29";
export * from "./data/20";

import { hiddenPersonalityDiagnosis } from "./data/1";
import { loveReplyTypeDiagnosis } from "./data/2";
import { mentalStrengthDiagnosis } from "./data/3";
import { geniusOrEffortDiagnosis } from "./data/4";
import { lineReplyTypeDiagnosis } from "./data/5";
import { hiddenPsychopathDiagnosis } from "./data/6";
import { firstImpressionDiagnosis } from "./data/7";
import { stressToleranceDiagnosis } from "./data/8";
import { loveChaseTypeDiagnosis } from "./data/9";
import { introvertExtrovertDiagnosis } from "./data/10";
import { pureOrDarkDiagnosis } from "./data/11";
import { soloLevelDiagnosis } from "./data/12";
import { dependencyTypeDiagnosis } from "./data/13";
import { emotionOrLogicDiagnosis } from "./data/14";
import { nightTypeDiagnosis } from "./data/15";
import { honneBareDiagnosis } from "./data/16";
import { lazinessDiagnosis } from "./data/17";
import { popularityDiagnosis } from "./data/18";
import { hiddenCommunicationDiagnosis } from "./data/19";
import { lonelyTypeDiagnosis } from "./data/20";
import { loveDependencyDiagnosis } from "./data/21";
import { kindnessTypeDiagnosis } from "./data/22";
import { intuitionTypeDiagnosis } from "./data/23";
import { airReadingDiagnosis } from "./data/24";
import { soloTravelDiagnosis } from "./data/25";
import { jealousyTypeDiagnosis } from "./data/26";
import { naturalTypeDiagnosis } from "./data/27";
import { honneHideDiagnosis } from "./data/28";
import { snsPersonalityDiagnosis } from "./data/29";
import { innerChildDiagnosis } from "./data/30";
import { DiagnosisGame } from "./types";

export const diagnosisGames: DiagnosisGame[] = [
  hiddenPersonalityDiagnosis,
  loveReplyTypeDiagnosis,
  mentalStrengthDiagnosis,
  geniusOrEffortDiagnosis,
  lineReplyTypeDiagnosis,
  hiddenPsychopathDiagnosis,
  firstImpressionDiagnosis,
  stressToleranceDiagnosis,
  loveChaseTypeDiagnosis,
  introvertExtrovertDiagnosis,
  pureOrDarkDiagnosis,
  soloLevelDiagnosis,
  dependencyTypeDiagnosis,
  emotionOrLogicDiagnosis,
  nightTypeDiagnosis,
  honneBareDiagnosis,
  lazinessDiagnosis,
  popularityDiagnosis,
  hiddenCommunicationDiagnosis,
  lonelyTypeDiagnosis,
  loveDependencyDiagnosis,
  kindnessTypeDiagnosis,
  intuitionTypeDiagnosis,
  airReadingDiagnosis,
  soloTravelDiagnosis,
  jealousyTypeDiagnosis,
  naturalTypeDiagnosis,
  honneHideDiagnosis,
  snsPersonalityDiagnosis,
  innerChildDiagnosis,
];

export const diagnosisGameMap = Object.fromEntries(
  diagnosisGames.map((game) => [game.slug, game])
) as Record<string, DiagnosisGame>;

export function getDiagnosisGameBySlug(slug: string) {
  return diagnosisGameMap[slug];
}