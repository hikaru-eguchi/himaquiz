export const runtime = "nodejs";

import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import Answer from "../../components/quizbooks/Answer";
import {
  getQuizBookSlugs,
  getQuizBookSourceBySlug,
} from "@/lib/quizbooks_psychological";

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
      title: `${meta.title}｜心理テスト｜ひまQ`,
      description:
        meta.description ??
        `${meta.title}で遊べる無料の心理テストページです。直感で答えるだけで、あなたの性格・恋愛傾向・本音・隠れタイプがわかります。友達や恋人と一緒に盛り上がる診断にもおすすめです。`,
    };
  } catch {
    return {
      title: "心理テスト｜性格・恋愛・本音がわかる無料診断｜ひまQ",
      description:
        "直感で答えるだけで、性格・恋愛傾向・本音・隠れタイプがわかる無料の心理テストページです。",
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
    <main className="container max-w-[1000px] mx-auto p-6 bg-gradient-to-br from-pink-100 via-rose-100 to-fuchsia-50">
      {/* タイトル */}
      <section className="mb-8 md:mb-10 text-center">
        <div className="inline-block rounded-[28px] border-4 border-black px-5 py-4 md:px-8 md:py-5 shadow-[0_4px_0_0_#000] bg-gradient-to-r from-pink-100 via-rose-100 to-fuchsia-100">
          <h1 className="text-2xl md:text-4xl font-extrabold leading-tight text-rose-950">
            {meta.title}
          </h1>
        </div>

        <p className="mt-4 text-rose-900 text-sm md:text-base max-w-3xl mx-auto leading-relaxed font-medium">
          直感で答えるだけで、あなたの性格や恋愛傾向、本音、隠れた一面がわかる心理テストです。
          一人でサクッと遊ぶのはもちろん、友達や恋人と一緒に結果を見せ合って楽しむ診断にもおすすめです。
        </p>
      </section>

      {/* 本文 */}
      <article className="prose prose-lg max-w-none text-center quizbook-prose">
        <MDXRemote source={content} components={{ Answer }} />
      </article>

      {/* SEO補足 */}
      <section className="mt-12 max-w-4xl mx-auto bg-gradient-to-br from-white via-pink-50 to-rose-50 rounded-2xl border-2 border-pink-300 p-6 shadow-md">
        <h2 className="text-2xl md:text-3xl font-extrabold mb-4 text-center text-rose-950">
          🧠 心理テストとは？
        </h2>

        <p className="text-gray-700 leading-relaxed text-center">
          心理テストとは、質問に対して直感で選んだ答えから、性格や恋愛傾向、
          本音、隠れたタイプを楽しみながら知ることができる診断コンテンツです。
          ひまQでは、短時間で遊べる無料の心理テストを掲載しています。
          スキマ時間の暇つぶしや、友達・恋人との会話のきっかけにもぴったりです。
        </p>
      </section>

      {/* 戻る・次へボタン */}
      <section className="mt-12 flex flex-col items-center gap-4">
        <div className="flex justify-center gap-4 flex-wrap">
          {prevSlug ? (
            <Link href={`/quizbooks_psychological/${prevSlug}`}>
              <button className="px-6 py-3 rounded-full border-2 border-black bg-white text-rose-950 font-bold shadow-md hover:scale-105 transition">
                ← 前の心理テスト
              </button>
            </Link>
          ) : (
            <button
              disabled
              className="px-6 py-3 rounded-full border-2 border-gray-300 bg-gray-100 text-gray-400 font-bold cursor-not-allowed"
            >
              ← 前の心理テスト
            </button>
          )}

          {nextSlug ? (
            <Link href={`/quizbooks_psychological/${nextSlug}`}>
              <button className="px-6 py-3 rounded-full border-2 border-black bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-500 text-white font-bold shadow-md hover:scale-105 transition">
                次の心理テスト →
              </button>
            </Link>
          ) : (
            <button
              disabled
              className="px-6 py-3 rounded-full border-2 border-gray-300 bg-gray-100 text-gray-400 font-bold cursor-not-allowed"
            >
              次の心理テスト →
            </button>
          )}
        </div>

        <Link href="/quizbooks_psychological">
          <button className="px-6 py-3 rounded-full border-2 border-black bg-pink-400 text-white font-bold shadow-md hover:scale-105 transition">
            心理テスト一覧へ戻る
          </button>
        </Link>
      </section>

      {/* 関連リンク */}
      <section className="mt-10 max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-4 text-rose-950">
          関連クイズから探す
        </h2>

        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/quizbooks_psychological"
            className="px-4 py-2 rounded-full border-2 border-black bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-500 text-white font-bold shadow hover:-translate-y-0.5 hover:scale-105 transition-all"
          >
            💗 心理テスト一覧
          </Link>

          <Link
            href="/quizbooks_lateral"
            className="px-4 py-2 rounded-full border-2 border-black bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-400 text-white font-bold shadow hover:-translate-y-0.5 hover:scale-105 transition-all"
          >
            🧠 水平思考クイズ
          </Link>

          <Link
            href="/quizbooks_pattern"
            className="px-4 py-2 rounded-full border-2 border-black bg-gradient-to-r from-indigo-600 via-blue-500 to-cyan-500 text-white font-bold shadow hover:-translate-y-0.5 hover:scale-105 transition-all"
          >
            🔷 パターンクイズ
          </Link>
        </div>
      </section>
    </main>
  );
}