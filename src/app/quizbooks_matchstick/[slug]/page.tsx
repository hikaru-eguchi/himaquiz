export const runtime = "nodejs";

import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import Answer from "../../components/quizbooks/Answer";
import {
  getQuizBookSlugs,
  getQuizBookSourceBySlug,
} from "@/lib/quizbooks_matchstick";

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
      title: `${meta.title}｜マッチ棒クイズ｜ひまQ`,
      description:
        meta.description ??
        `${meta.title}に挑戦できるマッチ棒クイズページです。マッチ棒を動かして式や形を完成させながら、ひらめきや発想力を楽しく鍛えられます。`,
    };
  } catch {
    return {
      title: "マッチ棒クイズ｜ひまQ",
      description:
        "マッチ棒を動かして式や形を完成させる、ひらめき重視のクイズページです。",
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
        <div className="inline-block rounded-[28px] border-4 border-black px-5 py-4 md:px-8 md:py-5 shadow-[0_4px_0_0_#000] bg-gradient-to-r from-cyan-100 via-sky-100 to-blue-100">
          <h1 className="text-2xl md:text-4xl font-extrabold leading-tight text-black">
            {meta.title}
          </h1>
        </div>

        <p className="mt-4 text-gray-700 text-sm md:text-base max-w-3xl mx-auto leading-relaxed">
          マッチ棒クイズに挑戦できる問題ページです。マッチ棒を動かして式を正しくしたり、
          図形を変化させたりしながら、ひらめきや発想力を楽しく鍛えられます。
          スキマ時間の脳トレや頭の体操にもおすすめです。
        </p>
      </section>

      {/* 本文 */}
      <article className="prose prose-lg max-w-none text-center quizbook-prose">
        <MDXRemote source={content} components={{ Answer }} />
      </article>

      {/* SEO補足 */}
      <section className="mt-12 max-w-4xl mx-auto bg-gradient-to-br from-cyan-50 via-sky-50 to-blue-50 rounded-2xl border-2 border-sky-300 p-6 shadow-md">
        <h2 className="text-2xl md:text-3xl font-extrabold mb-4 text-center">
          📘 マッチ棒クイズとは？
        </h2>

        <p className="text-gray-700 leading-relaxed text-center">
          マッチ棒クイズは、マッチ棒を1本または複数動かして式や図形を正しい形にするクイズです。
          見た目に惑わされず、柔軟な発想で考える必要があるため、
          ひらめき力や思考力が試される人気の脳トレ問題として知られています。
        </p>
      </section>

      {/* 戻る・次へボタン */}
      <section className="mt-12 flex flex-col items-center gap-4">
        <div className="flex justify-center gap-4 flex-wrap">
          {prevSlug ? (
            <Link href={`/quizbooks_matchstick/${prevSlug}`}>
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
            <Link href={`/quizbooks_matchstick/${nextSlug}`}>
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

        <Link href="/quizbooks_matchstick">
          <button className="px-6 py-3 rounded-full border-2 border-black bg-sky-400 text-black font-bold shadow-md hover:scale-105 transition">
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
            href="/quizbooks_matchstick"
            className="px-4 py-2 rounded-full border-2 border-black bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-400 text-white font-bold shadow hover:-translate-y-0.5 hover:scale-105 transition-all"
          >
            ➖ マッチ棒クイズ一覧
          </Link>

          <Link
            href="/quizbooks_pattern"
            className="px-4 py-2 rounded-full border-2 border-black bg-gradient-to-r from-indigo-600 via-blue-500 to-cyan-500 text-white font-bold shadow hover:-translate-y-0.5 hover:scale-105 transition-all"
          >
            🔷 パターンクイズ
          </Link>

          <Link
            href="/quizbooks_lateral"
            className="px-4 py-2 rounded-full border-2 border-black bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-400 text-white font-bold shadow hover:-translate-y-0.5 hover:scale-105 transition-all"
          >
            🧠 水平思考クイズ
          </Link>
        </div>
      </section>
    </main>
  );
}