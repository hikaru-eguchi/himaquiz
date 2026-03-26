import Link from "next/link";
import { getAllQuizBooksMeta } from "@/lib/quizbooks_sort";

export const metadata = {
  title:
    "並び替えクイズ一覧｜文字を並べて言葉を作る脳トレ・ことば遊び問題集｜ひまQ",
  description:
    "並び替えクイズを一覧で楽しめる無料問題集です。文字の順番を入れ替えて元の言葉を導く問題を掲載。スキマ時間の脳トレや語彙力アップ、ことば遊びにおすすめです。",
};

export default function QuizBooksSortIndexPage() {
  const items = getAllQuizBooksMeta();

  return (
    <main className="container mx-auto p-6 bg-gradient-to-br from-green-100 via-emerald-100 to-lime-50">
      {/* ===== タイトル ===== */}
      <section className="text-center mb-10">
        <h1
          className="
            inline-block
            text-3xl md:text-5xl font-extrabold
            px-6 py-3 md:px-10 md:py-4
            rounded-full
            bg-gradient-to-r from-green-500 via-emerald-400 to-lime-400
            text-white
            tracking-wide
            mb-4
          "
        >
          🔀 並び替えクイズ一覧
        </h1>

        <p className="text-gray-800 md:text-lg font-medium">
          文字を並び替えて元の言葉を導く、無料の並び替えクイズ問題集ページです。
        </p>

        <p className="text-gray-700 text-sm md:text-base mt-3 max-w-3xl mx-auto leading-relaxed">
          バラバラになった文字を正しく並び替えて答えを見つける、ことば遊びクイズを掲載しています。
          スキマ時間に気軽に楽しめる脳トレとしてはもちろん、語彙力やひらめき、発想力を鍛えたい人にもおすすめです。
          気になる問題からぜひ挑戦してみてください。
        </p>
      </section>

      {/* ===== 一覧 ===== */}
      <section aria-labelledby="quiz-list-heading">
        <h2 className="sr-only" id="quiz-list-heading">
          並び替えクイズ一覧
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
                href={`/quizbooks_sort/${b.slug}`}
                className="group block p-5 active:scale-95"
              >
                <p className="text-xs font-bold text-emerald-600 mb-2">
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
                  ▶ この並び替えクイズに挑戦する
                </p>
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* ===== SEO補足 ===== */}
      <section className="mt-12 max-w-4xl mx-auto bg-gradient-to-br from-green-50 via-emerald-50 to-lime-50 rounded-2xl border-2 border-emerald-300 p-6 shadow-md">
        <h2 className="text-2xl md:text-3xl font-extrabold mb-4 text-center">
          📘 並び替えクイズとは？
        </h2>

        <p className="text-gray-700 leading-relaxed mb-6 text-center">
          並び替えクイズとは、バラバラになった文字を正しい順番に並べて、元の言葉や単語を完成させるクイズです。
          直感だけでなく、語彙力や発想力、文字の並びに気づく力も試されるため、
          子どもから大人まで楽しめる人気のことば遊び・脳トレ問題として親しまれています。
        </p>

        <h3 className="text-xl md:text-2xl font-bold mb-4 text-center">
          こんな人におすすめ
        </h3>

        <div className="flex justify-center">
          <ul className="text-gray-700 leading-relaxed space-y-2 list-disc pl-5 max-w-md text-left">
            <li>無料で遊べる並び替えクイズを探している人</li>
            <li>ことば遊びや脳トレが好きな人</li>
            <li>スキマ時間に気軽に遊べる問題を探している人</li>
            <li>語彙力やひらめき、発想力を鍛えたい人</li>
          </ul>
        </div>
      </section>
    </main>
  );
}