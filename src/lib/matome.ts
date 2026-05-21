import fs from "fs";
import path from "path";
import matter from "gray-matter";

const matomeDirectory = path.join(process.cwd(), "src/matome");

export function getAllMatome() {
  const fileNames = fs.readdirSync(matomeDirectory);

  return fileNames.map((fileName) => {
    const slug = fileName.replace(/\.md$/, "");

    const fullPath = path.join(matomeDirectory, fileName);

    const fileContents = fs.readFileSync(fullPath, "utf8");

    const matterResult = matter(fileContents);

    return {
      slug,
      ...(matterResult.data as {
        title: string;
        description: string;
        emoji?: string;
        badge?: string;
        tags?: string[];
        color?: string;
      }),
    };
  });
}

export function getMatomeBySlug(slug: string) {
  const fullPath = path.join(matomeDirectory, `${slug}.md`);

  const fileContents = fs.readFileSync(fullPath, "utf8");

  const matterResult = matter(fileContents);

  return {
    slug,
    content: matterResult.content,
    ...(matterResult.data as {
      title: string;
      description: string;
      emoji?: string;
      badge?: string;
      tags?: string[];
      color?: string;
      ctaHref?: string;
      ctaText?: string;
    }),
  };
}