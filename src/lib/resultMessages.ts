import { gameLabel, recordKindLabel, type GameKey } from "./gameResults";
import type { SubmitGameResultResponse } from "./gameResults";

export function buildResultModalPayload(game: GameKey, res: SubmitGameResultResponse) {
  const g = gameLabel(game);

  const recordLine =
    res.is_new_record
      ? `${g}で「${recordKindLabel(res.record_kind)}：${res.new_record_value}」を達成したよ！\n（最高記録はマイページから確認できます）`
      : null;

  const titleLine =
    res.is_new_title && res.new_title
      ? `新しい称号「${res.new_title}」を獲得したよ！\n（取得した称号はマイページから確認できます）`
      : null;

  if (recordLine && titleLine) {
    return {
      type: "both" as const,
      title: "おめでとう！🎉",
      body: `${recordLine}\n\n${titleLine}`,
    };
  }
  if (recordLine) {
    return {
      type: "record" as const,
      title: "新記録達成！🎉",
      body: recordLine,
    };
  }
  if (titleLine) {
    return {
      type: "title" as const,
      title: "新称号を獲得！🏆",
      body: titleLine,
    };
  }
  return null;
}
