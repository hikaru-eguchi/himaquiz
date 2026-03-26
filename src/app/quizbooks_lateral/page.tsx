import Link from "next/link";
import { getAllQuizBooksMeta } from "@/lib/quizbooks_lateral";

export const metadata = {
  title:
    "水平思考クイズ一覧｜ひらめきで解くラテラルシンキング・脳トレ問題集｜ひまQ",
  description:
    "水平思考クイズを一覧で楽しめる無料問題集です。ラテラルシンキングやひらめきが試される問題を掲載。スキマ時間の脳トレや思考力アップにおすすめです。",
};

export default function QuizBooksLateralIndexPage() {
  const items = getAllQuizBooksMeta();

  return (
    <main className="container mx-auto p-6 bg-gradient-to-br from-purple-100 via-indigo-100 to-blue-50">
      {/* ===== タイトル ===== */}
      <section className="text-center mb-10">
        <h1
          className="
            inline-block
            text-3xl md:text-5xl font-extrabold
            px-6 py-3 md:px-10 md:py-4
            rounded-full
            bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-400
            text-white
            tracking-wide
            mb-4
          "
        >
          🧠 水平思考クイズ一覧
        </h1>

        <p className="text-gray-800 md:text-lg font-medium">
          ひらめきで解く、無料の水平思考クイズ・ラテラルシンキング問題集ページです。
        </p>

        <p className="text-gray-700 text-sm md:text-base mt-3 max-w-3xl mx-auto leading-relaxed">
          常識にとらわれない発想で答えを導く、水平思考クイズ（ラテラルシンキング問題）を掲載しています。
          スキマ時間に気軽に遊べる脳トレとしてはもちろん、思考力や発想力、ひらめきを鍛えたい人にもおすすめです。
          気になる問題からぜひ挑戦してみてください。
        </p>
      </section>

      {/* ===== 一覧 ===== */}
      <section aria-labelledby="quiz-list-heading">
        <h2 className="sr-only" id="quiz-list-heading">
          水平思考クイズ一覧
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
                href={`/quizbooks_lateral/${b.slug}`}
                className="group block p-5 active:scale-95"
              >
                <p className="text-xs font-bold text-indigo-600 mb-2">
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
                  ▶ この水平思考クイズに挑戦する
                </p>
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* ===== SEO補足 ===== */}
      <section className="mt-12 max-w-4xl mx-auto bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 rounded-2xl border-2 border-indigo-300 p-6 shadow-md">
        <h2 className="text-2xl md:text-3xl font-extrabold mb-4 text-center">
          📘 水平思考クイズとは？
        </h2>

        <p className="text-gray-700 leading-relaxed mb-6 text-center">
          水平思考クイズとは、常識や先入観にとらわれず、柔軟な発想で答えを導くクイズです。
          「ラテラルシンキング問題」とも呼ばれ、知識だけではなく、ひらめきや思考の切り替えが試されます。
          子どもから大人まで楽しめる人気の脳トレ問題として親しまれています。
        </p>

        <h3 className="text-xl md:text-2xl font-bold mb-4 text-center">
          こんな人におすすめ
        </h3>

        <div className="flex justify-center">
          <ul className="text-gray-700 leading-relaxed space-y-2 list-disc pl-5 max-w-md text-left">
            <li>無料で遊べる水平思考クイズを探している人</li>
            <li>ラテラルシンキング問題が好きな人</li>
            <li>スキマ時間に脳トレを楽しみたい人</li>
            <li>発想力や思考力、ひらめきを鍛えたい人</li>
          </ul>
        </div>
      </section>
    </main>
  );
}