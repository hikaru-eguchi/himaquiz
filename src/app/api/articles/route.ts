import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const dirPath = path.join(process.cwd(), "src/articles"); // Markdown ファイルが入っているディレクトリ
    const files = fs.readdirSync(dirPath).filter((f) => f.endsWith(".md"));

    const articles = files
      .map((file) => {
        const fileContent = fs.readFileSync(path.join(dirPath, file), "utf-8");
        const parsed = matter(fileContent);
        if (!parsed.data.quiz) return null; // quiz がないものは除外
        return parsed.data;
      })
      .filter(Boolean);

    return NextResponse.json(articles);
  } catch (err) {
    console.error(err);
    return NextResponse.json([], { status: 500 });
  }
}
