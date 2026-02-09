import fs from "fs";
import path from "path";
import matter from "gray-matter";

const ROOT = process.cwd();
// 記事の保存フォルダに合わせて変更（例）
const CONTENT_DIR = path.join(ROOT, "src", "articles"); // ← articles や posts ならそこに

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else if (p.endsWith(".md") || p.endsWith(".mdx")) acc.push(p);
  }
  return acc;
}

const files = walk(CONTENT_DIR);
let ok = 0, ng = 0;

for (const f of files) {
  const src = fs.readFileSync(f, "utf8");
  try {
    matter(src); // front-matter をパース
    ok++;
  } catch (e) {
    ng++;
    console.log("\n❌ YAMLエラー:", f);
    console.log(String(e).split("\n")[0]); // 1行だけ表示
  }
}

console.log(`\n完了: OK=${ok}, NG=${ng}`);
