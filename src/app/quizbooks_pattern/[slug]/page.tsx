export const runtime = "nodejs";

import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import Answer from "../../components/quizbooks/Answer";
import {
  getQuizBookSlugs,
  getQuizBookSourceBySlug,
} from "@/lib/quizbooks_pattern";

type PageProps = {
  params: Promise<{ slug: string }>;
};

// ✅ SSG用
export function generateStaticParams() {
  return getQuizBookSlugs().map((slug) => ({ slug }));
}

// ✅ metadata
export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;

  try {
    const { meta } = getQuizBookSourceBySlug(slug);

    return {
      title: `${meta.title}｜パターンクイズ｜ひまQ`,
      description:
        meta.description ??
        `${meta.title}に挑戦できるパターンクイズページです。規則性や法則を見抜きながら、論理的思考力やひらめきを楽しく鍛えられます。`,
    };
  } catch {
    return {
      title: "パターンクイズ｜ひまQ",
      description:
        "規則性や法則を見抜いて答えを導く、パターンクイズページです。",
    };
  }
}

// ✅ ページ本体
export default async function QuizBookPage({ params }: PageProps) {
  const { slug } = await params;

  let data;
  try {
    data = getQuizBookSourceBySlug(slug);
  } catch {
    notFound();
  }

  const { meta, content } = data;

  const slugs = getQuizBookSlugs();
  const currentIndex = slugs.indexOf(slug);

  const prevSlug = currentIndex > 0 ? slugs[currentIndex - 1] : null;
  const nextSlug =
    currentIndex >= 0 && currentIndex < slugs.length - 1
      ? slugs[currentIndex + 1]
      : null;

  return (
    <main className="container max-w-[1000px] mx-auto p-6">
      {/* タイトル */}
      <section className="mb-8 md:mb-10 text-center">
        <div className="inline-block rounded-[28px] border-4 border-black px-5 py-4 md:px-8 md:py-5 shadow-[0_4px_0_0_#000] bg-gradient-to-r from-indigo-100 via-blue-100 to-cyan-100">
          <h1 className="text-2xl md:text-4xl font-extrabold leading-tight text-black">
            {meta.title}
          </h1>
        </div>

        <p className="mt-4 text-gray-700 text-sm md:text-base max-w-3xl mx-auto leading-relaxed">
          パターンクイズに挑戦できる問題ページです。数字や文字、図形の並びに隠された
          規則性や法則を見抜きながら、論理的思考力や観察力、ひらめきを楽しく鍛えられます。
          スキマ時間の脳トレにもおすすめです。
        </p>
      </section>

      {/* 本文 */}
      <article className="prose prose-lg max-w-none text-center quizbook-prose">
        <MDXRemote source={content} components={{ Answer }} />
      </article>

      {/* SEO補足 */}
      <section className="mt-12 max-w-4xl mx-auto bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 rounded-2xl border-2 border-cyan-300 p-6 shadow-md">
        <h2 className="text-2xl md:text-3xl font-extrabold mb-4 text-center">
          📘 パターンクイズとは？
        </h2>

        <p className="text-gray-700 leading-relaxed text-center">
          パターンクイズとは、数字や文字、図形の並びに隠された規則性や法則を見抜いて答えを導くクイズです。
          なんとなくでは解けず、観察力や論理的思考力、ひらめきが必要になるため、
          子どもから大人まで楽しめる人気の脳トレ問題として親しまれています。
        </p>
      </section>

      {/* 戻る・次へボタン */}
      <section className="mt-12 flex flex-col items-center gap-4">
        <div className="flex justify-center gap-4 flex-wrap">
          {prevSlug ? (
            <Link href={`/quizbooks_pattern/${prevSlug}`}>
              <button className="px-6 py-3 rounded-full border-2 border-black bg-white text-black font-bold shadow-md hover:scale-105 transition">
                ← 前の問題
              </button>
            </Link>
          ) : (
            <button
              disabled
              className="px-6 py-3 rounded-full border-2 border-gray-300 bg-gray-100 text-gray-400 font-bold cursor-not-allowed"
            >
              ← 前の問題
            </button>
          )}

          {nextSlug ? (
            <Link href={`/quizbooks_pattern/${nextSlug}`}>
              <button className="px-6 py-3 rounded-full border-2 border-black bg-black text-white font-bold shadow-md hover:scale-105 transition">
                次の問題 →
              </button>
            </Link>
          ) : (
            <button
              disabled
              className="px-6 py-3 rounded-full border-2 border-gray-300 bg-gray-100 text-gray-400 font-bold cursor-not-allowed"
            >
              次の問題 →
            </button>
          )}
        </div>

        <Link href="/quizbooks_pattern">
          <button className="px-6 py-3 rounded-full border-2 border-black bg-cyan-400 text-black font-bold shadow-md hover:scale-105 transition">
            一覧へ戻る
          </button>
        </Link>
      </section>

      {/* 関連リンク */}
      <section className="mt-10 max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-4">
          関連クイズから探す
        </h2>

        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/quizbooks_pattern"
            className="px-4 py-2 rounded-full border-2 border-black bg-gradient-to-r from-indigo-600 via-blue-500 to-cyan-500 text-white font-bold shadow hover:-translate-y-0.5 hover:scale-105 transition-all"
          >
            🔷 パターンクイズ一覧
          </Link>

          <Link
            href="/quizbooks_lateral"
            className="px-4 py-2 rounded-full border-2 border-black bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-400 text-white font-bold shadow hover:-translate-y-0.5 hover:scale-105 transition-all"
          >
            🧠 水平思考クイズ
          </Link>

          <Link
            href="/quizbooks_matchstick"
            className="px-4 py-2 rounded-full border-2 border-black bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-400 text-white font-bold shadow hover:-translate-y-0.5 hover:scale-105 transition-all"
          >
            ➖ マッチ棒クイズ
          </Link>
        </div>
      </section>
    </main>
  );
}