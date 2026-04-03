import Link from "next/link";
import { getAllQuizBooksMeta } from "@/lib/quizbooks_theme";

export const metadata = {
  title:
    "テーマクイズ一覧｜アニメ・ゲーム・スポーツなど無料で遊べる問題集｜ひまQ",
  description:
    "テーマクイズを一覧で楽しめる無料問題集です。アニメ、ゲーム、スポーツ、食べ物、雑学など、いろいろなジャンルのクイズを掲載。スキマ時間の暇つぶしや知識チェックにおすすめです。",
};

type QuizBookMeta = {
  slug: string;
  title: string;
  description?: string;
  theme?: string;
  tags?: string[];
  updated?: string;
};

const POPULAR_SLUGS = [
  "onepiece-quiz-01",
  "pokemon-quiz-01",
  "baseball-sports-quiz",
  "ramen-food-quiz",
  "daily-life-trivia-zatsugaku-quiz",
  "jojo-anime-quiz",
];

const RECOMMENDED_SLUGS = [
  "frieren-anime-quiz",
  "sauna-hobby-quiz",
  "genshin-game-quiz",
  "convenience-store-food-quiz",
  "j-pop-music-quiz",
  "space-science-quiz",
];

function sortByUpdatedDesc(items: QuizBookMeta[]) {
  return [...items].sort((a, b) => {
    const aTime = a.updated ? new Date(a.updated).getTime() : 0;
    const bTime = b.updated ? new Date(b.updated).getTime() : 0;
    return bTime - aTime;
  });
}

function pickBySlugs(items: QuizBookMeta[], slugs: string[], limit = 6) {
  const map = new Map(items.map((item) => [item.slug, item]));
  return slugs.map((slug) => map.get(slug)).filter(Boolean).slice(0, limit) as QuizBookMeta[];
}

function excludeSlugs(items: QuizBookMeta[], slugs: string[]) {
  const slugSet = new Set(slugs);
  return items.filter((item) => !slugSet.has(item.slug));
}

function QuizCard({
  item,
  label,
}: {
  item: QuizBookMeta;
  label: string;
}) {
  return (
    <article
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
        href={`/quizbooks_theme/${item.slug}`}
        className="group block p-5 active:scale-95"
      >
        <p className="text-xs font-bold text-amber-600 mb-2">{label}</p>

        <h3 className="text-xl md:text-2xl font-extrabold mb-2 group-hover:underline">
          {item.title}
        </h3>

        {item.description && (
          <p className="text-gray-700 text-sm md:text-base leading-relaxed">
            {item.description}
          </p>
        )}

        <p className="mt-4 text-sm font-bold text-black">
          ▶ このテーマクイズに挑戦する
        </p>
      </Link>
    </article>
  );
}

function QuizSection({
  id,
  title,
  description,
  items,
  labelPrefix,
}: {
  id: string;
  title: string;
  description: string;
  items: QuizBookMeta[];
  labelPrefix: string;
}) {
  if (items.length === 0) return null;

  return (
    <section className="mb-12" aria-labelledby={id}>
      <div className="text-center mb-6">
        <h2 id={id} className="text-2xl md:text-3xl font-extrabold mb-3">
          {title}
        </h2>
        <p className="text-gray-700 text-sm md:text-base max-w-3xl mx-auto leading-relaxed">
          {description}
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {items.map((item, index) => (
          <QuizCard
            key={`${labelPrefix}-${item.slug}`}
            item={item}
            label={`${labelPrefix} ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

export default function QuizBooksThemeIndexPage() {
  const allItems = getAllQuizBooksMeta() as QuizBookMeta[];

  const popularItems = pickBySlugs(allItems, POPULAR_SLUGS, 6);
  const newestItems = sortByUpdatedDesc(allItems)
    .filter((item) => !POPULAR_SLUGS.includes(item.slug))
    .slice(0, 6);
  const recommendedItems = pickBySlugs(
    allItems,
    RECOMMENDED_SLUGS.filter(
      (slug) =>
        !POPULAR_SLUGS.includes(slug) &&
        !newestItems.some((item) => item.slug === slug)
    ),
    6
  );

  const hiddenSlugs = [
    ...popularItems.map((item) => item.slug),
    ...newestItems.map((item) => item.slug),
    ...recommendedItems.map((item) => item.slug),
  ];

  const remainingItems = excludeSlugs(allItems, hiddenSlugs);

  return (
    <main className="container mx-auto p-6 bg-gradient-to-br from-yellow-100 via-amber-100 to-orange-50">
      {/* ===== タイトル ===== */}
      <section className="text-center mb-10">
        <h1
          className="
            inline-block
            text-3xl md:text-5xl font-extrabold
            px-6 py-3 md:px-10 md:py-4
            rounded-full
            bg-gradient-to-r from-yellow-500 via-amber-400 to-orange-300
            text-white
            tracking-wide
            mb-4
          "
        >
          🎯 テーマクイズ一覧
        </h1>

        <p className="text-gray-800 md:text-lg font-medium">
          いろいろなジャンルで楽しめる、無料のテーマクイズ問題集ページです。
        </p>

        <p className="text-gray-700 text-sm md:text-base mt-3 max-w-3xl mx-auto leading-relaxed">
          アニメ、ゲーム、スポーツ、食べ物、雑学、趣味・生活など、さまざまなテーマのクイズを掲載しています。
          スキマ時間に気軽に遊べる暇つぶしとしてはもちろん、好きなジャンルの知識チェックや話題作りにもおすすめです。
          気になるテーマからぜひ挑戦してみてください。
        </p>
      </section>

      {/* ===== 人気 ===== */}
      <QuizSection
        id="popular-quiz-heading"
        title="🔥 人気クイズ"
        description="まずはよく読まれている人気のテーマクイズから挑戦したい人向けに、特に見られやすい問題をまとめました。迷ったらここから遊ぶのがおすすめです。"
        items={popularItems}
        labelPrefix="人気"
      />

      {/* ===== 新着 ===== */}
      <QuizSection
        id="newest-quiz-heading"
        title="🆕 新着クイズ"
        description="新しく追加されたテーマクイズをまとめています。最新の問題からチェックしたい人は、ここから気になるクイズに挑戦してみてください。"
        items={newestItems}
        labelPrefix="新着"
      />

      {/* ===== おすすめ ===== */}
      <QuizSection
        id="recommended-quiz-heading"
        title="✨ おすすめクイズ"
        description="運営おすすめのテーマクイズをまとめました。人気ジャンルだけでなく、少し気になるテーマや知識差が出やすい問題も楽しめます。"
        items={recommendedItems}
        labelPrefix="おすすめ"
      />

      {/* ===== すべての一覧 ===== */}
      <section aria-labelledby="quiz-list-heading" className="mb-12">
        <div className="text-center mb-6">
          <h2 id="quiz-list-heading" className="text-2xl md:text-3xl font-extrabold mb-3">
            📚 すべてのテーマクイズ一覧
          </h2>
          <p className="text-gray-700 text-sm md:text-base max-w-3xl mx-auto leading-relaxed">
            すべてのテーマクイズを一覧で見たい人向けに、公開中の問題をまとめています。
            人気・新着・おすすめ以外のクイズも含めて、気になるものから自由に遊んでみてください。
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {remainingItems.map((b, index) => (
            <QuizCard
              key={b.slug}
              item={b}
              label={`テーマ ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ===== 人気テーマ導線 ===== */}
      <section className="mt-10 max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-4">
          人気のテーマから探す
        </h2>

        <p className="text-center text-gray-700 text-sm md:text-base mb-5 max-w-3xl mx-auto leading-relaxed">
          人気の高いテーマからクイズを探したい人向けに、よく遊ばれるジャンルをまとめました。
          好きなジャンルを選んで、気になる問題に挑戦してみてください。
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/quizbooks_theme/category/anime"
            className="px-4 py-2 rounded-full border-2 border-black bg-gradient-to-r from-pink-500 to-rose-400 text-white font-bold shadow hover:-translate-y-0.5 transition-all"
          >
            🎬 アニメクイズ
          </Link>

          <Link
            href="/quizbooks_theme/category/game"
            className="px-4 py-2 rounded-full border-2 border-black bg-gradient-to-r from-indigo-500 to-purple-400 text-white font-bold shadow hover:-translate-y-0.5 transition-all"
          >
            🎮 ゲームクイズ
          </Link>

          <Link
            href="/quizbooks_theme/category/sports"
            className="px-4 py-2 rounded-full border-2 border-black bg-gradient-to-r from-green-500 to-emerald-400 text-white font-bold shadow hover:-translate-y-0.5 transition-all"
          >
            ⚽ スポーツクイズ
          </Link>

          <Link
            href="/quizbooks_theme/category/food"
            className="px-4 py-2 rounded-full border-2 border-black bg-gradient-to-r from-orange-500 to-amber-400 text-white font-bold shadow hover:-translate-y-0.5 transition-all"
          >
            🍔 食べ物クイズ
          </Link>

          <Link
            href="/quizbooks_theme/category/zatsugaku"
            className="px-4 py-2 rounded-full border-2 border-black bg-gradient-to-r from-yellow-500 to-lime-400 text-white font-bold shadow hover:-translate-y-0.5 transition-all"
          >
            💡 雑学クイズ
          </Link>

          <Link
            href="/quizbooks_theme/category/hobby"
            className="px-4 py-2 rounded-full border-2 border-black bg-gradient-to-r from-teal-500 to-emerald-400 text-white font-bold shadow hover:-translate-y-0.5 transition-all"
          >
            🏕️ 趣味クイズ
          </Link>
        </div>
      </section>

      {/* ===== SEO補足 ===== */}
      <section className="mt-12 max-w-4xl mx-auto bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 rounded-2xl border-2 border-amber-300 p-6 shadow-md">
        <h2 className="text-2xl md:text-3xl font-extrabold mb-4 text-center">
          📘 テーマクイズとは？
        </h2>

        <p className="text-gray-700 leading-relaxed mb-6 text-center">
          テーマクイズとは、特定のジャンルや話題にしぼって楽しめるクイズです。
          アニメやゲーム、スポーツ、食べ物、雑学、趣味・生活など、自分の好きなテーマで遊べるため、
          知識チェックや暇つぶしにぴったりの人気クイズとして親しまれています。
          得意ジャンルに挑戦したい人にも、新しいテーマを気軽に楽しみたい人にもおすすめです。
        </p>

        <h3 className="text-xl md:text-2xl font-bold mb-4 text-center">
          こんな人におすすめ
        </h3>

        <div className="flex justify-center">
          <ul className="text-gray-700 leading-relaxed space-y-2 list-disc pl-5 max-w-md text-left">
            <li>無料で遊べるテーマクイズを探している人</li>
            <li>アニメやゲーム、スポーツなど好きなジャンルで遊びたい人</li>
            <li>スキマ時間に気軽に暇つぶししたい人</li>
            <li>知識チェックや話題作りを楽しみたい人</li>
          </ul>
        </div>
      </section>
    </main>
  );
}