// lib/diagnosis/themes.ts

export const diagnosisThemeSlugs = [
  "hidden-ability",
  "personality",
  "love",
  "quiz-power",
  "brain",
  "genius",
  "iq",
  "himajin",
  "thinking",
  "strength",
  "hidden-talent",
  "mental",
  "sabori",
  "zubora",
  "communication",
  "rpg-job",
  "food",
  "animal",
] as const;

export type DiagnosisThemeSlug = (typeof diagnosisThemeSlugs)[number];