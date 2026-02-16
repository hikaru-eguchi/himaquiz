export function getMonthStartJST() {
  const now = new Date();
  const jst = new Date(now.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }));
  const y = jst.getFullYear();
  const m = String(jst.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`; // "YYYY-MM-01"
}
