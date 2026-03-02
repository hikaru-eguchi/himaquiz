// src/lib/moderation/ngWords.ts
export const normalizeForNG = (s: string) =>
  (s ?? "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[._\-・,，。、/\\|!！?？'"“”‘’()（）[\]{}<>]/g, "");

export const NG_PATTERNS: RegExp[] = [
  // 下ネタ系
  /sex/,
  /sexy/,
  /s〇x/,
  /せっくす/,
  /セックス/,
  /えっち/,
  /エッチ/,
  /hentai/,
  /ちんこ/,
  /チンコ/,
  /まんこ/,
  /マンコ/,
  /ちんぽ/,
  /おっぱい/,
  /オッパイ/,
  /ぱんつ/,
  /ペニス/,
  /ぺにす/,
  /あなる/,
  /アナル/,
  /まら/,
  /乳首/,
  /処女/,
  /童貞/,

  // 暴言
  /しね/,
  /死ね/,
  /ころす/,
  /殺す/,
  /きえろ/,
  /消えろ/,
  /くそ/,
  /ざこ/,
  /雑魚/,
  /クソ/,
  /ばか/,
  /馬鹿/,
  /バカ/,
  /アホ/,
  /あほ/,
  /カス/,
  /かす/,
  /ゴミ/,
  /きもい/,
  /キモい/,
  /うざい/,
  /ウザい/,
];

export function checkForbidden(text: string): { ok: true; reason: null } | { ok: false; reason: string } {
  const n = normalizeForNG(text);
  if (!n) return { ok: true, reason: null };
  const hit = NG_PATTERNS.some((re) => re.test(n) || re.test(text));
  if (hit) return { ok: false, reason: "ごめんね。その言葉はつかえないよ！🙏" };
  return { ok: true, reason: null };
}