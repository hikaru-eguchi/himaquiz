import Link from "next/link";
import { getAllMatome } from "@/lib/matome";

export const metadata = {
  title: "まとめ記事一覧｜ひまQ",
  description:
    "ひまQの人気まとめ記事一覧。暇つぶしクイズ、心理テスト、IQ問題、盛り上がる3択問題などをまとめて楽しめます。",
};

export default function MatomePage() {
  const matomeItems = getAllMatome();
  return (
    <main className="min-h-screen bg-gradient-to-b from-yellow-50 via-orange-50 to-sky-50 py-4 md:py-10">
      <div className="mx-auto max-w-[980px] px-4">
        <section className="mb-6 rounded-[28px] border-2 border-black bg-white p-5 text-center shadow-[6px_6px_0_rgba(0,0,0,0.85)] md:p-8">
          <p className="mx-auto mb-3 inline-block rounded-full border-2 border-black bg-yellow-300 px-4 py-1 text-sm font-black shadow-md md:text-base">
            📚 読んで遊べるひまQ特集
          </p>

          <h1 className="text-3xl font-black leading-tight text-orange-500 drop-shadow md:text-5xl">
            🔥 人気まとめ記事
          </h1>

          <p className="mx-auto mt-4 max-w-[720px] text-base font-bold leading-relaxed text-gray-700 md:text-lg">
            暇つぶしにぴったりなクイズ・心理テスト・雑学・盛り上がる問題をまとめました。
            気になる記事を読んだら、そのままクイズでも遊べます！
          </p>

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {["暇つぶし", "クイズ", "心理テスト", "雑学", "友達と遊ぶ"].map(
              (tag) => (
                <span
                  key={tag}
                  className="rounded-full border-2 border-black bg-orange-100 px-3 py-1 text-xs font-black text-gray-800 shadow-sm md:text-sm"
                >
                  #{tag}
                </span>
              )
            )}
          </div>
        </section>

        <section className="space-y-4">
            {matomeItems.map((item) => (
                <Link
                key={item.slug}
                href={`/matome/${item.slug}`}
                className="group relative block rounded-[24px] border-2 border-black bg-white p-4 shadow-[5px_5px_0_rgba(0,0,0,0.85)] transition-all hover:-translate-y-1 hover:shadow-[8px_8px_0_rgba(0,0,0,0.85)] md:p-5"
                >
                <div className="absolute -right-2 -top-2 rounded-full border-2 border-black bg-red-500 px-3 py-1 text-xs font-black text-white shadow-md rotate-6">
                    {item.badge}
                </div>

                <div className="flex gap-4 md:items-center">
                    <div
                    className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-black bg-gradient-to-br ${item.color} text-3xl shadow-md md:h-20 md:w-20 md:text-4xl`}
                    >
                    {item.emoji}
                    </div>

                    <div className="min-w-0 flex-1 pr-2">
                    <h2 className="pr-8 text-lg font-black leading-snug text-gray-900 group-hover:text-orange-500 md:text-2xl">
                        {item.title}
                    </h2>

                    <p className="mt-2 text-sm font-bold leading-relaxed text-gray-600 md:text-base">
                        {item.description}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                        {item.tags?.map((tag) => (
                        <span
                            key={tag}
                            className="rounded-full bg-gray-100 px-3 py-1 text-xs font-black text-gray-600"
                        >
                            #{tag}
                        </span>
                        ))}
                    </div>
                    </div>

                    <div className="hidden md:flex shrink-0 items-center gap-3 rounded-2xl bg-gradient-to-r from-yellow-100 to-orange-100 px-4 py-3">
                    <span className="text-sm font-black text-gray-700">
                        記事を読む
                    </span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-black bg-yellow-300 text-lg font-black shadow-sm transition-all group-hover:scale-110">
                        →
                    </span>
                    </div>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-2xl bg-gradient-to-r from-yellow-100 to-orange-100 px-4 py-3 md:hidden">
                    <span className="text-sm font-black text-gray-700">
                    記事を読む
                    </span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-black bg-yellow-300 text-lg font-black shadow-sm transition-all group-hover:scale-110">
                    →
                    </span>
                </div>
                </Link>
            ))}
            </section>

        <section className="mt-8 rounded-[28px] border-2 border-black bg-gradient-to-br from-pink-200 via-yellow-100 to-sky-200 p-5 text-center shadow-[6px_6px_0_rgba(0,0,0,0.85)]">
          <h2 className="text-2xl font-black text-gray-900 md:text-3xl">
            🎮 読んだあとはクイズで遊ぼう！
          </h2>

          <p className="mt-2 text-sm font-bold leading-relaxed text-gray-700 md:text-base">
            まとめ記事だけで終わらず、実際にひまQのクイズにも挑戦できます。
          </p>

          <Link
            href="/"
            className="mt-4 inline-flex rounded-full border-2 border-black bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-2 text-base font-black text-white shadow-xl transition-all hover:scale-105 md:text-xl"
          >
            トップに戻って遊ぶ →
          </Link>
        </section>
      </div>
    </main>
  );
}