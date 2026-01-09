// lib/gameResults.ts
import type { SupabaseClient } from "@supabase/supabase-js";

export type GameKey =
  | "streak"          // 連続正解チャレンジ
  | "timed"           // 制限時間クイズ
  | "dungeon"         // クイズダンジョン
  | "battle"          // クイズバトル
  | "coop_dungeon"    // 協力ダンジョン
  | "survival";       // サバイバル

export type TitleThreshold = { threshold: number; title: string };

export function calcTitle(titles: TitleThreshold[], value: number): string | null {
  let t: string | null = null;
  for (const row of titles) {
    if (value >= row.threshold) t = row.title;
  }
  return t;
}

export type SubmitGameResultArgs = {
  game: GameKey;
  score?: number;
  streak?: number;
  stage?: number;
  won?: boolean;
  firstPlace?: boolean;
  title?: string | null;
  writeLog?: boolean;
};

export type SubmitGameResultResponse = {
  processed: boolean;
  is_new_record: boolean;
  record_kind: string | null;
  new_record_value: number;
  is_new_title: boolean;
  new_title: string | null;
  stats_best_streak: number;
  stats_best_score: number;
  stats_best_stage: number;
  stats_wins: number;
  stats_first_places: number;
};

export async function submitGameResult(
  supabase: SupabaseClient,
  args: SubmitGameResultArgs
): Promise<SubmitGameResultResponse> {
  const resultId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : undefined;

  const { data, error } = await supabase.rpc("submit_game_result", {
    p_game: args.game,
    p_score: args.score ?? 0,
    p_streak: args.streak ?? 0,
    p_stage: args.stage ?? 0,
    p_won: args.won ?? false,
    p_first_place: args.firstPlace ?? false,
    p_title: args.title ?? null,
    p_result_id: resultId ?? null,
    p_write_log: args.writeLog ?? true,
  });

  if (error) throw error;

  // RPC returns TABLE -> supabase-jsでは配列で返る
  const row = Array.isArray(data) ? data[0] : data;
  return row as SubmitGameResultResponse;
}

export function gameLabel(game: GameKey): string {
  switch (game) {
    case "streak": return "連続正解チャレンジ";
    case "timed": return "制限時間クイズ";
    case "dungeon": return "クイズダンジョン";
    case "battle": return "クイズバトル";
    case "coop_dungeon": return "協力ダンジョン";
    case "survival": return "サバイバルクイズ";
  }
}

export function recordKindLabel(kind: string | null): string {
  if (!kind) return "";
  if (kind === "streak") return "連続正解";
  if (kind === "score") return "スコア";
  if (kind === "stage") return "ステージ";
  return kind;
}
