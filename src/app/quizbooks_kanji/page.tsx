import Link from "next/link";
import { getAllQuizBooksMeta } from "@/lib/quizbooks_kanji";

export const metadata = {
  title:
    "漢字間違い探しクイズ一覧｜無料で遊べる脳トレ・注意力アップ問題集｜ひまQ",
  description:
    "漢字間違い探しクイズを一覧で楽しめる無料問題集です。似ている漢字や間違いやすい表記を見抜く問題を掲載。スキマ時間の脳トレや注意力、観察力アップにおすすめです。",
};

export default function QuizBooksKanjiIndexPage() {
  const items = getAllQuizBooksMeta();

  return (
    <main className="container mx-auto p-6 bg-gradient-to-br from-pink-50 via-rose-50 to-amber-50">
      {/* ===== タイトル ===== */}
      <section className="text-center mb-10">
        <h1
          className="
            inline-block
            text-3xl md:text-5xl font-extrabold
            px-6 py-3 md:px-10 md:py-4
            rounded-full
            bg-gradient-to-r from-pink-500 via-rose-400 to-amber-400
            text-white
            tracking-wide
            mb-4
          "
        >
          🔍 漢字間違い探しクイズ一覧
        </h1>

        <p className="text-gray-800 md:text-lg font-medium">
          間違っている漢字を見つけて楽しむ、無料の漢字クイズ問題集ページです。
        </p>

        <p className="text-gray-700 text-sm md:text-base mt-3 max-w-3xl mx-auto leading-relaxed">
          似ている漢字や、間違いやすい表記の中から正しくない漢字を見抜く問題を掲載しています。
          スキマ時間に気軽に遊べる脳トレとしてはもちろん、注意力や観察力を鍛えたい人にもおすすめです。
          気になる問題からぜひ挑戦してみてください。
        </p>
      </section>

      {/* ===== 一覧 ===== */}
      <section aria-labelledby="quiz-list-heading">
        <h2 className="sr-only" id="quiz-list-heading">
          漢字間違い探しクイズ一覧
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
                href={`/quizbooks_kanji/${b.slug}`}
                className="group block p-5 active:scale-95"
              >
                <p className="text-xs font-bold text-rose-500 mb-2">
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
                  ▶ この漢字間違い探しクイズに挑戦する
                </p>
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* ===== SEO補足 ===== */}
      <section className="mt-12 max-w-4xl mx-auto bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50 rounded-2xl border-2 border-rose-300 p-6 shadow-md">
        <h2 className="text-2xl md:text-3xl font-extrabold mb-4 text-center">
          📘 漢字間違い探しクイズとは？
        </h2>

        <p className="text-gray-700 leading-relaxed mb-6 text-center">
          漢字間違い探しクイズは、並んだ漢字の中からひとつだけ違う漢字や、間違っている表記を見つけるクイズです。
          漢字の知識だけでなく、注意力や観察力、集中力も試されるため、
          子どもから大人まで楽しめる人気の脳トレ問題として親しまれています。
        </p>

        <h3 className="text-xl md:text-2xl font-bold mb-4 text-center">
          こんな人におすすめ
        </h3>

        <div className="flex justify-center">
          <ul className="text-gray-700 leading-relaxed space-y-2 list-disc pl-5 max-w-md text-left">
            <li>無料で遊べる漢字クイズを探している人</li>
            <li>スキマ時間に脳トレをしたい人</li>
            <li>注意力や観察力を鍛えたい人</li>
            <li>子どもと一緒に楽しめる漢字問題を探している人</li>
          </ul>
        </div>
      </section>
    </main>
  );
}