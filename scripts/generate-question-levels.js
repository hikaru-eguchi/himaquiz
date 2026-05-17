// scripts/generate-question-levels.js
const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const ARTICLES_DIR = path.join(process.cwd(), "src/articles");
const OUTPUT_FILE = path.join(process.cwd(), "questionLevels.ts");

const files = fs
  .readdirSync(ARTICLES_DIR)
  .filter((file) => file.endsWith(".md") || file.endsWith(".mdx"))
  .sort(); // ← ここが大事。/api/articles と同じ並び順にする

const map = {};

let index = 1;

for (const file of files) {
  const fullPath = path.join(ARTICLES_DIR, file);
  const raw = fs.readFileSync(fullPath, "utf8");
  const { data } = matter(raw);

  if (!data.quiz) continue;

  const level = data.quiz.level || "ふつう";

  map[`q${index}`] = level;
  index++;
}

const output = `export const QUESTION_LEVEL_MAP = ${JSON.stringify(map, null, 2)} as const;

export type QuestionLevel = "かんたん" | "ふつう" | "難しい" | "超難しい";
`;

fs.writeFileSync(OUTPUT_FILE, output, "utf8");

console.log(`✅ questionLevels.ts generated: ${index - 1} questions`);