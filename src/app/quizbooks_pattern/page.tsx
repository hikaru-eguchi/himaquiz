import Link from "next/link";
import { getAllQuizBooksMeta } from "@/lib/quizbooks_pattern";

export const metadata = {
  title:
    "パターンクイズ一覧｜規則性・法則を見抜く脳トレ問題集｜ひまQ",
  description:
    "パターンクイズを一覧で楽しめる無料問題集です。数字や文字の並び、規則性や法則を見抜いて答えを導く問題を掲載。スキマ時間の脳トレや論理的思考力アップにおすすめです。",
};

export default function QuizBooksPatternIndexPage() {
  const items = getAllQuizBooksMeta();

  return (
    <main className="container mx-auto p-6 bg-gradient-to-br from-indigo-100 via-blue-100 to-cyan-50">
      {/* ===== タイトル ===== */}
      <section className="text-center mb-10">
        <h1
          className="
            inline-block
            text-3xl md:text-5xl font-extrabold
            px-6 py-3 md:px-10 md:py-4
            rounded-full
            bg-gradient-to-r from-indigo-600 via-blue-500 to-cyan-500
            text-white
            tracking-wide
            mb-4
          "
        >
          🔷 パターンクイズ一覧
        </h1>

        <p className="text-gray-800 md:text-lg font-medium">
          規則性や法則を見抜いて答えを導く、無料のパターンクイズ問題集ページです。
        </p>

        <p className="text-gray-700 text-sm md:text-base mt-3 max-w-3xl mx-auto leading-relaxed">
          数字や文字、図形や並び方のルールを手がかりに答えを考えるパターンクイズを掲載しています。
          スキマ時間に楽しめる脳トレとしてはもちろん、論理的思考力や観察力、ひらめきを鍛えたい人にもおすすめです。
          気になる問題からぜひ挑戦してみてください。
        </p>
      </section>

      {/* ===== 一覧 ===== */}
      <section aria-labelledby="quiz-list-heading">
        <h2 className="sr-only" id="quiz-list-heading">
          パターンクイズ一覧
        </h2>

        <div className="grid gap-5 md:grid-cols-2">
          {items.map((b, index) => (
            <article
              key={b.slug}
              className="
                rounded-2xl
                border-2 border-black
                bg-white
                shadow-md
                transition-all
                hover:-translate-y-1 hover:shadow-xl
              "
            >
              <Link
                href={`/quizbooks_pattern/${b.slug}`}
                className="group block p-5 active:scale-95"
              >
                <p className="text-xs font-bold text-cyan-600 mb-2">
                  問題 {index + 1}
                </p>

                <h2 className="text-xl md:text-2xl font-extrabold mb-2 group-hover:underline">
                  {b.title}
                </h2>

                {b.description && (
                  <p className="text-gray-700 text-sm md:text-base leading-relaxed">
                    {b.description}
                  </p>
                )}

                <p className="mt-4 text-sm font-bold text-black">
                  ▶ このパターンクイズに挑戦する
                </p>
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* ===== SEO補足 ===== */}
      <section className="mt-12 max-w-4xl mx-auto bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 rounded-2xl border-2 border-cyan-300 p-6 shadow-md">
        <h2 className="text-2xl md:text-3xl font-extrabold mb-4 text-center">
          📘 パターンクイズとは？
        </h2>

        <p className="text-gray-700 leading-relaxed mb-6 text-center">
          パターンクイズとは、数字や文字、図形の並びに隠された規則性や法則を見抜いて答えを導くクイズです。
          なんとなくでは解けず、観察力や論理的思考力、ひらめきが必要になるため、
          子どもから大人まで楽しめる人気の脳トレ問題として親しまれています。
        </p>

        <h3 className="text-xl md:text-2xl font-bold mb-4 text-center">
          こんな人におすすめ
        </h3>

        <div className="flex justify-center">
          <ul className="text-gray-700 leading-relaxed space-y-2 list-disc pl-5 max-w-md text-left">
            <li>無料で遊べるパターンクイズを探している人</li>
            <li>規則性や法則を見抜く問題が好きな人</li>
            <li>スキマ時間に脳トレをしたい人</li>
            <li>論理的思考力や観察力を鍛えたい人</li>
          </ul>
        </div>
      </section>
    </main>
  );
}