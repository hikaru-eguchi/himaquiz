import Link from "next/link";
import { getAllQuizBooksMeta } from "@/lib/quizbooks_hiragana";

export const metadata = {
  title:
    "ひらがな穴埋めクイズ一覧｜無料で遊べることば遊び・脳トレ問題集｜ひまQ",
  description:
    "ひらがな穴埋めクイズを一覧で楽しめる無料問題集です。ことば遊びや文章問題を中心に、語彙力アップや脳トレに役立つ問題を掲載。スキマ時間に気軽に遊べます。",
};

export default function QuizBooksHiraganaIndexPage() {
  const items = getAllQuizBooksMeta();

  return (
    <main className="container mx-auto p-6 bg-gradient-to-br from-pink-100 via-fuchsia-100 to-purple-50">
      {/* ===== タイトル ===== */}
      <section className="text-center mb-10">
        <h1
          className="
            inline-block
            text-3xl md:text-5xl font-extrabold
            px-6 py-3 md:px-10 md:py-4
            rounded-full
            bg-gradient-to-r from-pink-500 via-fuchsia-400 to-purple-400
            text-white
            tracking-wide
            mb-4
          "
        >
          ✏️ ひらがな穴埋めクイズ一覧
        </h1>

        <p className="text-gray-800 md:text-lg font-medium">
          無料で遊べるひらがな穴埋めクイズをまとめた問題集ページです。
        </p>

        <p className="text-gray-700 text-sm md:text-base mt-3 max-w-3xl mx-auto leading-relaxed">
          ことば遊びや文章問題を中心に、空欄に入るひらがなを考えて楽しめる問題を掲載しています。
          スキマ時間の脳トレや、語彙力アップ、ひらめき力を鍛えたい人にもおすすめです。
          気になる問題からぜひ挑戦してみてください。
        </p>
      </section>

      {/* ===== 一覧 ===== */}
      <section aria-labelledby="quiz-list-heading">
        <h2 className="sr-only" id="quiz-list-heading">
          ひらがな穴埋めクイズ一覧
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
                href={`/quizbooks_hiragana/${b.slug}`}
                className="group block p-5 active:scale-95"
              >
                <p className="text-xs font-bold text-fuchsia-600 mb-2">
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
                  ▶ このひらがな穴埋めクイズに挑戦する
                </p>
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* ===== SEO補足 ===== */}
      <section className="mt-12 max-w-4xl mx-auto bg-gradient-to-br from-pink-50 via-fuchsia-50 to-purple-50 rounded-2xl border-2 border-fuchsia-300 p-6 shadow-md">
        <h2 className="text-2xl md:text-3xl font-extrabold mb-4 text-center">
          📘 ひらがな穴埋めクイズとは？
        </h2>

        <p className="text-gray-700 leading-relaxed mb-6 text-center">
          ひらがな穴埋めクイズは、空欄に入るひらがなを考えてことばや文章を完成させるクイズです。
          直感だけでなく、語彙力や発想力も試されるため、
          子どもから大人まで楽しめる人気のことば遊び・脳トレ問題として親しまれています。
        </p>

        <h3 className="text-xl md:text-2xl font-bold mb-4 text-center">
          こんな人におすすめ
        </h3>

        <div className="flex justify-center">
          <ul className="text-gray-700 leading-relaxed space-y-2 list-disc pl-5 max-w-md text-left">
            <li>無料で遊べるひらがなクイズを探している人</li>
            <li>スキマ時間にことば遊びを楽しみたい人</li>
            <li>語彙力や発想力を鍛えたい人</li>
            <li>子どもと一緒に楽しめる問題を探している人</li>
          </ul>
        </div>
      </section>
    </main>
  );
}