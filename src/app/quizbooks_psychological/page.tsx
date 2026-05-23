import Link from "next/link";
import { getAllQuizBooksMeta } from "@/lib/quizbooks_psychological";

export const metadata = {
  title:
    "心理テスト一覧｜性格・恋愛・本音がわかる無料診断まとめ｜ひまQ",
  description:
    "無料で楽しめる心理テスト一覧ページです。性格診断、恋愛心理テスト、本音診断、隠れタイプ診断など、直感で答えるだけであなたのタイプがわかる面白い心理テストをまとめました。友達や恋人と一緒に盛り上がる診断にもおすすめです。",
};

export default function QuizBooksPsychologicalIndexPage() {
  const items = getAllQuizBooksMeta();

  return (
    <main className="container mx-auto p-6 bg-gradient-to-br from-pink-100 via-rose-100 to-fuchsia-50">
      {/* ===== タイトル ===== */}
      <section className="text-center mb-10">
        <h1
          className="
            inline-block
            text-3xl md:text-5xl font-extrabold
            px-6 py-3 md:px-10 md:py-4
            rounded-full
            bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-500
            text-white
            tracking-wide
            mb-4
            border-2 border-black
            shadow-lg
          "
        >
          💗 心理テスト一覧
        </h1>

        <p className="text-rose-950 md:text-lg font-bold">
          性格・恋愛・本音・隠れタイプがわかる、無料の心理テストまとめです。
        </p>

        <p className="text-rose-900 text-sm md:text-base mt-3 max-w-3xl mx-auto leading-relaxed font-medium">
          直感で選ぶだけで、あなたの性格タイプや恋愛傾向、隠れた本音がわかる心理テストを掲載しています。
          一人でサクッと楽しむのはもちろん、友達・恋人・家族と一緒に遊ぶ診断にもおすすめです。
          「意外と当たる」「結果を見せたくなる」ような、暇つぶしにもぴったりの心理テストを集めました。
        </p>
      </section>

      {/* ===== 一覧 ===== */}
      <section aria-labelledby="quiz-list-heading">
        <h2 className="sr-only" id="quiz-list-heading">
          心理テスト一覧
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
                href={`/quizbooks_psychological/${b.slug}`}
                className="group block p-5 active:scale-95"
              >
                <p className="text-xs font-bold text-pink-600 mb-2">
                  心理テスト {index + 1}
                </p>

                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h2 className="text-xl md:text-2xl font-extrabold text-rose-950 group-hover:underline">
                    {b.title}
                  </h2>

                  <span className="inline-flex items-center gap-1 rounded-full border border-pink-300 bg-pink-50 px-2.5 py-1 text-xs font-extrabold text-pink-700">
                    おすすめ度
                    <span className="tracking-tight">
                      {"★".repeat(b.difficulty ?? 3)}
                      {"☆".repeat(5 - (b.difficulty ?? 3))}
                    </span>
                  </span>
                </div>

                {b.description && (
                  <p className="text-gray-700 text-sm md:text-base leading-relaxed">
                    {b.description}
                  </p>
                )}

                <p className="mt-4 text-sm font-bold text-pink-600">
                  ▶ この心理テストをやってみる
                </p>
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* ===== SEO補足 ===== */}
      <section className="mt-12 max-w-4xl mx-auto bg-gradient-to-br from-white via-pink-50 to-rose-50 rounded-2xl border-2 border-pink-300 p-6 shadow-md">
        <h2 className="text-2xl md:text-3xl font-extrabold mb-4 text-center text-rose-950">
          🧠 心理テストとは？
        </h2>

        <p className="text-gray-700 leading-relaxed mb-6 text-center">
          心理テストとは、質問に対して直感で選んだ答えから、性格や恋愛傾向、
          考え方、本音、隠れた一面を楽しみながら知ることができる診断コンテンツです。
          ひまQでは、短時間で遊べる無料の心理テストを中心に、
          友達と盛り上がるものから、一人でじっくり楽しめるものまで掲載しています。
        </p>

        <h3 className="text-xl md:text-2xl font-bold mb-4 text-center text-rose-900">
          こんな人におすすめ
        </h3>

        <div className="flex justify-center">
          <ul className="text-gray-700 leading-relaxed space-y-2 list-disc pl-5 max-w-md text-left">
            <li>無料で遊べる心理テストを探している人</li>
            <li>性格診断や恋愛診断が好きな人</li>
            <li>自分の本音や隠れタイプを知りたい人</li>
            <li>友達や恋人と盛り上がる診断を探している人</li>
            <li>スキマ時間にサクッと遊べる暇つぶしを探している人</li>
          </ul>
        </div>
      </section>
    </main>
  );
}