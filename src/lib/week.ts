// src/lib/week.ts
export function getWeekStartJST(d = new Date()) {
  const jst = new Date(d.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
  const day = jst.getDay(); // 0=Sun..6=Sat
  const diff = (day + 6) % 7; // Monday=0
  jst.setDate(jst.getDate() - diff);
  jst.setHours(0, 0, 0, 0);

  const y = jst.getFullYear();
  const m = String(jst.getMonth() + 1).padStart(2, "0");
  const dd = String(jst.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`; // YYYY-MM-DD
}
