import Link from "next/link";
import { getAllQuizBooksMeta } from "@/lib/quizbooks";

export const metadata = {
  title:
    "漢字穴埋めクイズ一覧｜無料で遊べる熟語・脳トレ問題集｜ひまQ",
  description:
    "漢字穴埋めクイズを一覧で楽しめる無料問題集です。熟語、四字熟語、ことば遊びなどの漢字クイズを掲載。スキマ時間の脳トレや漢字力アップにおすすめです。",
};

export default function QuizBooksIndexPage() {
  const items = getAllQuizBooksMeta();

  return (
    <main className="container mx-auto p-6 bg-gradient-to-br from-red-50 via-rose-50 to-orange-50">
      {/* ===== タイトル ===== */}
      <section className="text-center mb-10">
        <h1
          className="
            inline-block
            text-3xl md:text-5xl font-extrabold
            px-6 py-3 md:px-10 md:py-4
            rounded-full
            bg-gradient-to-r from-red-500 via-rose-400 to-orange-400
            text-white
            tracking-wide
            mb-4
          "
        >
          ⬜ 漢字穴埋めクイズ一覧
        </h1>

        <p className="text-gray-800 md:text-lg font-medium">
          無料で遊べる漢字穴埋めクイズをまとめた問題集ページです。
        </p>

        <p className="text-gray-700 text-sm md:text-base mt-3 max-w-3xl mx-auto leading-relaxed">
          熟語や四字熟語、ことば遊びを中心に、空欄に入る漢字を考えて楽しめる問題を掲載しています。
          スキマ時間の脳トレや、漢字の復習、頭の体操をしたい人にもおすすめです。
          気になる問題からぜひ挑戦してみてください。
        </p>
      </section>

      {/* ===== 一覧 ===== */}
      <section aria-labelledby="quiz-list-heading">
        <h2 className="sr-only" id="quiz-list-heading">
          漢字穴埋めクイズ一覧
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
                href={`/quizbooks/${b.slug}`}
                className="group block p-5 active:scale-95"
              >
                <p className="text-xs font-bold text-red-500 mb-2">
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
                  ▶ この漢字穴埋めクイズに挑戦する
                </p>
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* ===== SEO補足 ===== */}
      <section className="mt-12 max-w-4xl mx-auto bg-gradient-to-br from-yellow-50 via-orange-50 to-amber-50 rounded-2xl border-2 border-orange-300 p-6 shadow-md">

        <h2 className="text-2xl md:text-3xl font-extrabold mb-4 text-center">
          📘漢字穴埋めクイズとは？
        </h2>

        <p className="text-gray-700 leading-relaxed mb-6 text-center">
          漢字穴埋めクイズは、空欄に入る漢字を考えて熟語やことばを完成させるクイズです。
          漢字の知識だけでなく、語彙力やひらめきも試されるため、
          子どもから大人まで楽しめる人気の脳トレ問題として親しまれています。
        </p>

        <h3 className="text-xl md:text-2xl font-bold mb-4 text-center">
          こんな人におすすめ
        </h3>

        <div className="flex justify-center">
          <ul className="text-gray-700 leading-relaxed space-y-2 list-disc pl-5 max-w-md text-left">
            <li>無料で遊べる漢字クイズを探している人</li>
            <li>スキマ時間に脳トレをしたい人</li>
            <li>熟語や四字熟語を楽しく学びたい人</li>
            <li>漢字の復習や頭の体操をしたい人</li>
          </ul>
        </div>
      </section>
    </main>
  );
}