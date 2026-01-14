import fs from "fs";
import path from "path";
import matter from "gray-matter";

const QUIZBOOKS_DIR = path.join(process.cwd(), "src/quizbooks");

export type QuizBookMeta = {
  slug: string;
  title: string;
  description?: string;
  theme?: string;
  tags?: string[];
  updated?: string;
};

export function getQuizBookSlugs() {
  return fs
    .readdirSync(QUIZBOOKS_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
}

export function getAllQuizBooksMeta(): QuizBookMeta[] {
  const slugs = getQuizBookSlugs();

  return slugs
    .map((slug) => {
      const fullPath = path.join(QUIZBOOKS_DIR, `${slug}.mdx`);
      const raw = fs.readFileSync(fullPath, "utf-8");
      const { data } = matter(raw);

      return {
        slug,
        title: String(data.title ?? slug),
        description: data.description ? String(data.description) : undefined,
        theme: data.theme ? String(data.theme) : undefined,
        tags: Array.isArray(data.tags) ? data.tags.map(String) : undefined,
        updated: data.updated ? String(data.updated) : undefined,
      };
    })
    .sort((a, b) => (b.updated ?? "").localeCompare(a.updated ?? ""));
}

export function getQuizBookSourceBySlug(slug: string) {
  const fullPath = path.join(QUIZBOOKS_DIR, `${slug}.mdx`);

  try {
    const raw = fs.readFileSync(fullPath, "utf-8");
    const { data, content } = matter(raw);

    const meta: QuizBookMeta = {
      slug,
      title: String(data.title ?? slug),
      description: data.description ? String(data.description) : undefined,
      theme: data.theme ? String(data.theme) : undefined,
      tags: Array.isArray(data.tags) ? data.tags.map(String) : undefined,
      updated: data.updated ? String(data.updated) : undefined,
    };

    return { meta, content };
  } catch (e) {
    console.error("[quizbooks] read failed", {
      slug,
      fullPath,
      cwd: process.cwd(),
      error: e,
    });
    throw e;
  }
}

