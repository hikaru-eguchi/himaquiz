export const runtime = "nodejs";

import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import Answer from "../../components/quizbooks/Answer";
import {
  getQuizBookSlugs,
  getQuizBookSourceBySlug,
} from "@/lib/quizbooks_kanji";

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
      title: `${meta.title}｜漢字間違い探しクイズ｜ひまQ`,
      description:
        meta.description ??
        `${meta.title}に挑戦できる漢字間違い探しクイズページです。似ている漢字や間違いやすい表記を見抜きながら、注意力や観察力を鍛えられます。`,
    };
  } catch {
    return {
      title: "漢字間違い探しクイズ｜ひまQ",
      description:
        "似ている漢字や間違いやすい表記を見抜く、漢字間違い探しクイズページです。",
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
        <div className="inline-block rounded-[28px] border-4 border-black px-5 py-4 md:px-8 md:py-5 shadow-[0_4px_0_0_#000] bg-gradient-to-r from-pink-100 via-rose-100 to-amber-100">
          <h1 className="text-2xl md:text-4xl font-extrabold leading-tight text-black">
            {meta.title}
          </h1>
        </div>

        <p className="mt-4 text-gray-700 text-sm md:text-base max-w-3xl mx-auto leading-relaxed">
          漢字間違い探しクイズに挑戦できる問題ページです。似ている漢字や間違いやすい表記の中から、
          ひとつだけ違う漢字を見つけて楽しめます。スキマ時間の脳トレや注意力アップにもおすすめです。
        </p>
      </section>

      {/* 本文 */}
      <article className="prose prose-lg max-w-none text-center quizbook-prose">
        <MDXRemote source={content} components={{ Answer }} />
      </article>

      {/* SEO補足 */}
      <section className="mt-12 max-w-4xl mx-auto bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50 rounded-2xl border-2 border-rose-300 p-6 shadow-md">
        <h2 className="text-2xl md:text-3xl font-extrabold mb-4 text-center">
          📘 漢字間違い探しクイズとは？
        </h2>

        <p className="text-gray-700 leading-relaxed text-center">
          漢字間違い探しクイズは、並んだ漢字の中からひとつだけ違う漢字や、間違っている表記を見つけるクイズです。
          漢字の知識だけでなく、注意力や観察力、集中力も試されるため、
          子どもから大人まで楽しめる人気の脳トレ問題として親しまれています。
        </p>
      </section>

      {/* 戻る・次へボタン */}
      <section className="mt-12 flex flex-col items-center gap-4">
        <div className="flex justify-center gap-4 flex-wrap">
          {prevSlug ? (
            <Link href={`/quizbooks_kanji/${prevSlug}`}>
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
            <Link href={`/quizbooks_kanji/${nextSlug}`}>
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

        <Link href="/quizbooks_kanji">
          <button className="px-6 py-3 rounded-full border-2 border-black bg-amber-400 text-black font-bold shadow-md hover:scale-105 transition">
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
            href="/quizbooks_kanji"
            className="px-4 py-2 rounded-full border-2 border-black bg-gradient-to-r from-pink-500 via-rose-400 to-amber-400 text-white font-bold shadow hover:-translate-y-0.5 hover:scale-105 transition-all"
          >
            🔍 漢字間違い探し一覧
          </Link>

          <Link
            href="/quizbooks"
            className="px-4 py-2 rounded-full border-2 border-black bg-gradient-to-r from-red-500 via-rose-400 to-orange-300 text-white font-bold shadow hover:-translate-y-0.5 hover:scale-105 transition-all"
          >
            ⬜ 漢字穴埋めクイズ
          </Link>

          <Link
            href="/quizbooks_hiragana"
            className="px-4 py-2 rounded-full border-2 border-black bg-gradient-to-r from-pink-500 via-fuchsia-400 to-purple-400 text-white font-bold shadow hover:-translate-y-0.5 hover:scale-105 transition-all"
          >
            ✏️ ひらがな穴埋め
          </Link>
        </div>
      </section>
    </main>
  );
}