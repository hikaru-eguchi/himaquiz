import { gameLabel, recordKindLabel, type GameKey } from "./gameResults";
import type { SubmitGameResultResponse } from "./gameResults";

export type ModalPart = {
  text: string;
  tone?: "normal" | "accent" | "muted";
};

export type ModalItem =
  | { type: "record"; title: string; parts: ModalPart[] }
  | { type: "title"; title: string; parts: ModalPart[] }
  | { type: "both"; title: string; parts: ModalPart[] };

export function buildResultModalPayload(game: GameKey, res: SubmitGameResultResponse): ModalItem | null {
  const g = gameLabel(game);

  const recordParts: ModalPart[] | null =
    res.is_new_record
      ? [
          { text: `${g}で「`, tone: "normal" },
          { text: `${recordKindLabel(res.record_kind)}：${res.new_record_value}`, tone: "accent" }, // ←ここが青/強調
          { text: `」を達成したよ！\n`, tone: "normal" },
          { text: `（最高記録はマイページから確認できます）`, tone: "muted" },
        ]
      : null;

  const titleParts: ModalPart[] | null =
    res.is_new_title && res.new_title
      ? [
          { text: `新しい称号「`, tone: "normal" },
          { text: `${res.new_title}`, tone: "accent" }, // ←ここが青/強調
          { text: `」を獲得したよ！\n`, tone: "normal" },
          { text: `（取得した称号はマイページから確認できます）`, tone: "muted" },
        ]
      : null;

  if (recordParts && titleParts) {
    return {
      type: "both",
      title: "おめでとう！🎉",
      parts: [...recordParts, { text: "\n\n" }, ...titleParts],
    };
  }
  if (recordParts) {
    return { type: "record", title: "新記録達成！🎉", parts: recordParts };
  }
  if (titleParts) {
    return { type: "title", title: "新称号を獲得！🏆", parts: titleParts };
  }
  return null;
}