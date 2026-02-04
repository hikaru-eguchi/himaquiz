export const runtime = "nodejs";

import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import Answer from "../../components/quizbooks/Answer";
import { getQuizBookSlugs, getQuizBookSourceBySlug } from "@/lib/quizbooks";

type PageProps = {
  params: Promise<{ slug: string }>;
};

// ✅ SSG用（これはそのままでOK）
export function generateStaticParams() {
  return getQuizBookSlugs().map((slug) => ({ slug }));
}

// ✅ ここがポイント：params を await
export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;

  try {
    const { meta } = getQuizBookSourceBySlug(slug);
    return {
      title: `${meta.title}｜ひまQ`,
      description: meta.description ?? "クイズ問題集ページ",
    };
  } catch {
    return { title: "クイズ問題集｜ひまQ" };
  }
}

// ✅ ここも：async + await
export default async function QuizBookPage({ params }: PageProps) {
  const { slug } = await params;

  let data;
  try {
    data = getQuizBookSourceBySlug(slug);
  } catch {
    notFound();
  }

  const { meta, content } = data;

  return (
    <div className="container max-w-[1000px] mx-auto p-6">
      <h1 className="text-3xl md:text-5xl font-extrabold mb-10 text-center">{meta.title}</h1>

      <article className="prose prose-lg max-w-none text-center quizbook-prose">
        <MDXRemote source={content} components={{ Answer }} />
      </article>
    </div>
  );
}
