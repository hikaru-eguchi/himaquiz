import Link from "next/link";
import { getAllQuizBooksMeta } from "@/lib/quizbooks_matchstick";

export const metadata = {
  title:
    "マッチ棒クイズ一覧｜1本動かして解くひらめき脳トレ問題集｜ひまQ",
  description:
    "マッチ棒クイズを一覧で楽しめる無料問題集です。1本動かして式を正しくする問題や図形を変える問題など、ひらめき重視の脳トレクイズを掲載。スキマ時間の発想力アップにおすすめ。",
};

export default function QuizBooksMatchstickIndexPage() {
  const items = getAllQuizBooksMeta();

  return (
    <main className="container mx-auto p-6 bg-gradient-to-br from-cyan-100 via-sky-100 to-blue-50">
      {/* ===== タイトル ===== */}
      <section className="text-center mb-10">
        <h1
          className="
            inline-block
            text-3xl md:text-5xl font-extrabold
            px-6 py-3 md:px-10 md:py-4
            rounded-full
            bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-400
            text-white
            tracking-wide
            mb-4
          "
        >
          ➖ マッチ棒クイズ一覧
        </h1>

        <p className="text-gray-800 md:text-lg font-medium">
          1本動かして解く、ひらめき重視のマッチ棒クイズ問題集です。
        </p>

        <p className="text-gray-700 text-sm md:text-base mt-3 max-w-3xl mx-auto leading-relaxed">
          マッチ棒を動かして式を正しくしたり、図形を変化させたりして答えを導くクイズを掲載しています。
          スキマ時間に楽しめる脳トレとしてはもちろん、発想力・思考力・集中力を鍛えたい人にもおすすめです。
          気になる問題からぜひ挑戦してみてください。
        </p>
      </section>

      {/* ===== 一覧 ===== */}
      <section aria-labelledby="quiz-list-heading">
        <h2 className="sr-only" id="quiz-list-heading">
          マッチ棒クイズ一覧
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
                href={`/quizbooks_matchstick/${b.slug}`}
                className="group block p-5 active:scale-95"
              >
                <p className="text-xs font-bold text-sky-600 mb-2">
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
                  ▶ このマッチ棒クイズに挑戦する
                </p>
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* ===== SEO補足 ===== */}
      <section className="mt-12 max-w-4xl mx-auto bg-gradient-to-br from-cyan-50 via-sky-50 to-blue-50 rounded-2xl border-2 border-sky-300 p-6 shadow-md">
        <h2 className="text-2xl md:text-3xl font-extrabold mb-4 text-center">
          📘 マッチ棒クイズとは？
        </h2>

        <p className="text-gray-700 leading-relaxed mb-6 text-center">
          マッチ棒クイズは、マッチ棒を1本または複数動かして式や図形を正しい形にするクイズです。
          見た目に惑わされず、柔軟な発想で考える必要があるため、
          ひらめき力や思考力が試される人気の脳トレ問題として知られています。
        </p>

        <h3 className="text-xl md:text-2xl font-bold mb-4 text-center">
          こんな人におすすめ
        </h3>

        <div className="flex justify-center">
          <ul className="text-gray-700 leading-relaxed space-y-2 list-disc pl-5 max-w-md text-left">
            <li>無料で遊べるマッチ棒クイズを探している人</li>
            <li>ひらめき系の脳トレが好きな人</li>
            <li>スキマ時間に頭の体操をしたい人</li>
            <li>発想力や論理的思考力を鍛えたい人</li>
          </ul>
        </div>
      </section>
    </main>
  );
}