import Link from "next/link";

const matomeItems = [
  {
    href: "/matome/iq-quiz",
    badge: "人気",
    emoji: "🧠",
    title: "IQ高い人しか解けない問題まとめ",
    description: "ひらめき・発想力・直感で楽しめるクイズ特集！",
    color: "from-purple-500 via-indigo-400 to-sky-400",
  },
  {
    href: "/matome/ultimate-choice",
    badge: "盛り上がる",
    emoji: "⚖️",
    title: "友達とやると盛り上がる究極の2択まとめ",
    description: "LINE・学校・通話でも使える暇つぶし質問集。",
    color: "from-amber-500 via-orange-400 to-red-400",
  },
  {
    href: "/matome/trivia-quiz",
    badge: "雑学",
    emoji: "📚",
    title: "大人でも間違える雑学クイズまとめ",
    description: "知ってそうで意外と知らない雑学クイズ特集。",
    color: "from-emerald-500 via-teal-400 to-sky-300",
  },
];

export default function PopularMatomeSection() {
  return (
    <section className="max-w-[700px] mx-auto border-2 border-black rounded-xl m-5 p-5 bg-gradient-to-b from-yellow-50 via-orange-100 to-pink-100 shadow-lg">
      <div className="text-center mb-5">
        <p className="inline-block rounded-full border-2 border-black bg-white px-4 py-1 text-sm md:text-base font-black shadow-md">
          📚 読んで遊べる特集
        </p>

        <h2 className="mt-3 text-2xl md:text-4xl font-extrabold leading-tight text-orange-500 drop-shadow-xl">
          🔥 人気まとめ
        </h2>

        <p className="mt-2 text-base md:text-lg font-bold text-gray-800 leading-relaxed">
          クイズで遊ぶ前にサクッと読める！
          <br className="md:hidden" />
          暇つぶしにぴったりなまとめ記事。
        </p>
      </div>

      <div className="grid gap-3">
        {matomeItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group block rounded-2xl border-2 border-black bg-white p-3 shadow-[4px_4px_0_rgba(0,0,0,0.85)] transition-all hover:-translate-y-1 hover:shadow-[7px_7px_0_rgba(0,0,0,0.85)]"
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-black bg-gradient-to-br ${item.color} text-2xl shadow-md`}
              >
                {item.emoji}
              </div>

              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-black text-white">
                    {item.badge}
                  </span>
                  <span className="text-xs font-bold text-gray-500">
                    まとめ記事
                  </span>
                </div>

                <h3 className="text-base md:text-xl font-black leading-snug text-gray-900 group-hover:text-orange-500">
                  {item.title}
                </h3>

                <p className="mt-1 text-sm md:text-base font-bold leading-relaxed text-gray-600">
                  {item.description}
                </p>
              </div>

              <div className="hidden md:flex h-10 w-10 items-center justify-center rounded-full border-2 border-black bg-yellow-300 font-black shadow-sm group-hover:scale-110">
                →
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-5 text-center">
        <Link
          href="/matome"
          className="inline-flex items-center justify-center rounded-full border-2 border-black bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-2 text-base md:text-xl font-black text-white shadow-xl transition-all hover:scale-105"
        >
          まとめ記事をもっと見る →
        </Link>
      </div>
    </section>
  );
}