import fs from "fs";
import path from "path";
import matter from "gray-matter";

export interface QuizData {
  title: string;
  question: string;
  choices: string[];
  answer: number; // choices のインデックス
  displayAnswer?: string;
  hint?: string;
  genre?: string;
  level?: string;
  image?: string;
  answerExplanation?: string;
trivia?: string;
}

export interface ArticleData {
  id: string;
  title: string;
  quiz?: QuizData;
  genre?: string;
}

export function getAllArticles(): ArticleData[] {
  const dir = path.join(process.cwd(), "src/articles3");
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".md"));

  return files.map(fileName => {
    const id = fileName.replace(/\.md$/, "");
    const content = fs.readFileSync(path.join(dir, fileName), "utf8");
    const { data } = matter(content);

    return {
      id,
      title: data.title,
      genre: data.genre,
      quiz: data.quiz,
    } as ArticleData;
  }).filter(a => a.quiz); // quiz があるものだけ
}
