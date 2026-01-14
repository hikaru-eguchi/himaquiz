import Link from "next/link";
import { getAllQuizBooksMeta } from "@/lib/quizbooks";

export const metadata = {
  title: "おもしろクイズ問題集｜ひまQ",
  description: "答えを見ながら楽しめる！テーマ別のおもしろクイズ問題集をまとめて紹介。",
};

export default function QuizBooksIndexPage() {
  const items = getAllQuizBooksMeta();

  return (
    <div className="container mx-auto p-6">
      {/* ===== タイトル ===== */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-5xl font-extrabold mb-3">
          🎉 おもしろクイズ問題集
        </h1>
        <p className="text-gray-700 md:text-lg font-medium">
          答えをクリックしながら、気軽に楽しめるクイズ集！
        </p>
      </div>

      {/* ===== 一覧 ===== */}
      <div className="grid gap-5 md:grid-cols-2">
        {items.map((b) => (
          <Link
            key={b.slug}
            href={`/quizbooks/${b.slug}`}
            className="
              group block rounded-2xl p-5
              border-2 border-black
              bg-gradient-to-br from-white via-sky-50 to-yellow-50
              shadow-md
              transition-all
              hover:-translate-y-1 hover:shadow-xl
              active:scale-95
            "
          >
            {/* タイトル */}
            <p className="text-xl md:text-2xl font-extrabold mb-1">
              {b.title}
            </p>

            {/* 説明 */}
            {b.description && (
              <p className="text-gray-700 text-sm md:text-base mt-1">
                {b.description}
              </p>
            )}

            {/* タグ */}
            <div className="flex flex-wrap gap-2 mt-4">
              {b.theme && (
                <span className="px-3 py-1 text-xs font-bold bg-yellow-200 border-2 border-black rounded-full">
                  {b.theme}
                </span>
              )}

              {b.tags?.slice(0, 3).map((t) => (
                <span
                  key={t}
                  className="px-3 py-1 text-xs font-bold bg-white border border-black rounded-full"
                >
                  #{t}
                </span>
              ))}
            </div>

            {/* フッター */}
            <div className="flex items-center justify-between mt-4">
              {b.updated && (
                <p className="text-xs text-gray-500">
                  更新：{b.updated}
                </p>
              )}

              <span className="text-sm font-extrabold text-black group-hover:underline">
                ▶ あそぶ
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
