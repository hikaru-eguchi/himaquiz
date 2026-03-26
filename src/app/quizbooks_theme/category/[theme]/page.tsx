import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllQuizBooksMeta } from "@/lib/quizbooks_theme";

type PageProps = {
  params: Promise<{ theme: string }>;
};

type ThemeConfig = {
  name: string;
  emoji: string;
  pageTitle: string;
  lead: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  bgClass: string;
  headingClass: string;
  borderClass: string;
  accentTextClass: string;
  seoBoxClass: string;
  chipClass: string;
  recommendedFor: string[];
  relatedThemes: { slug: string; label: string }[];
};

const themeConfigs: Record<string, ThemeConfig> = {
  anime: {
    name: "アニメ",
    emoji: "🎬",
    pageTitle: "アニメクイズ一覧",
    lead: "アニメ好きなら楽しめる、無料のアニメクイズ問題集ページです。",
    description:
      "人気アニメ、名作アニメ、キャラクター、作品名、名シーンなどに関するクイズをまとめています。スキマ時間の暇つぶしとしてはもちろん、アニメ好きの知識チェックや話題作りにもおすすめです。気になる問題からぜひ挑戦してみてください。",
    seoTitle:
      "アニメクイズ一覧｜人気作品・名作アニメで遊べる無料問題集｜ひまQ",
    seoDescription:
      "アニメクイズを一覧で楽しめる無料問題集です。人気作品や名作アニメ、キャラクターに関する問題を掲載。アニメ好きの知識チェックや暇つぶしにおすすめです。",
    bgClass: "bg-gradient-to-br from-pink-100 via-rose-100 to-orange-50",
    headingClass: "bg-gradient-to-r from-pink-500 via-rose-400 to-orange-300",
    borderClass: "border-rose-300",
    accentTextClass: "text-rose-600",
    seoBoxClass: "bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50",
    chipClass:
      "bg-gradient-to-r from-pink-500 via-rose-400 to-orange-300 text-white",
    recommendedFor: [
      "アニメが好きで知識チェックをしたい人",
      "人気作品や名作アニメのクイズで遊びたい人",
      "スキマ時間に気軽に暇つぶししたい人",
      "友だちと話題にしやすいクイズを探している人",
    ],
    relatedThemes: [
      { slug: "game", label: "🎮 ゲームクイズ" },
      { slug: "character", label: "🧸 キャラクタークイズ" },
      { slug: "manga", label: "📚 漫画クイズ" },
    ],
  },
  game: {
    name: "ゲーム",
    emoji: "🎮",
    pageTitle: "ゲームクイズ一覧",
    lead: "ゲーム好きなら楽しめる、無料のゲームクイズ問題集ページです。",
    description:
      "人気ゲーム、名作タイトル、キャラクター、シリーズ作品、ゲーム用語などに関するクイズをまとめています。スキマ時間の暇つぶしはもちろん、ゲーム好きの知識チェックにもおすすめです。気になる問題からぜひ挑戦してみてください。",
    seoTitle:
      "ゲームクイズ一覧｜人気ゲーム・名作タイトルで遊べる無料問題集｜ひまQ",
    seoDescription:
      "ゲームクイズを一覧で楽しめる無料問題集です。人気ゲームや名作タイトル、キャラクターに関する問題を掲載。ゲーム好きの知識チェックや暇つぶしにおすすめです。",
    bgClass: "bg-gradient-to-br from-indigo-100 via-purple-100 to-blue-50",
    headingClass:
      "bg-gradient-to-r from-indigo-500 via-purple-400 to-blue-400",
    borderClass: "border-indigo-300",
    accentTextClass: "text-indigo-600",
    seoBoxClass: "bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50",
    chipClass:
      "bg-gradient-to-r from-indigo-500 via-purple-400 to-blue-400 text-white",
    recommendedFor: [
      "ゲーム好きで知識を試したい人",
      "シリーズ作品やキャラクター問題が好きな人",
      "スキマ時間に遊べるクイズを探している人",
      "友だちと盛り上がれる話題を探している人",
    ],
    relatedThemes: [
      { slug: "anime", label: "🎬 アニメクイズ" },
      { slug: "character", label: "🧸 キャラクタークイズ" },
      { slug: "zatsugaku", label: "💡 雑学クイズ" },
    ],
  },
  sports: {
    name: "スポーツ",
    emoji: "⚽",
    pageTitle: "スポーツクイズ一覧",
    lead: "スポーツ好きなら楽しめる、無料のスポーツクイズ問題集ページです。",
    description:
      "競技ルール、選手、チーム、大会、スポーツの豆知識などに関するクイズをまとめています。スキマ時間の暇つぶしとしてはもちろん、スポーツ好きの知識チェックや脳トレにもおすすめです。気になる問題からぜひ挑戦してみてください。",
    seoTitle:
      "スポーツクイズ一覧｜ルール・選手・大会で遊べる無料問題集｜ひまQ",
    seoDescription:
      "スポーツクイズを一覧で楽しめる無料問題集です。ルールや選手、チーム、大会に関する問題を掲載。スポーツ好きの知識チェックや暇つぶしにおすすめです。",
    bgClass: "bg-gradient-to-br from-green-100 via-emerald-100 to-lime-50",
    headingClass:
      "bg-gradient-to-r from-green-500 via-emerald-400 to-lime-400",
    borderClass: "border-emerald-300",
    accentTextClass: "text-emerald-600",
    seoBoxClass: "bg-gradient-to-br from-green-50 via-emerald-50 to-lime-50",
    chipClass:
      "bg-gradient-to-r from-green-500 via-emerald-400 to-lime-400 text-white",
    recommendedFor: [
      "スポーツが好きで知識を試したい人",
      "ルールや選手に関する問題が好きな人",
      "スキマ時間に楽しく脳トレしたい人",
      "家族や友だちと一緒に遊べる問題を探している人",
    ],
    relatedThemes: [
      { slug: "zatsugaku", label: "💡 雑学クイズ" },
      { slug: "showa", label: "📺 昭和クイズ" },
      { slug: "music", label: "🎵 音楽クイズ" },
    ],
  },
  food: {
    name: "食べ物",
    emoji: "🍔",
    pageTitle: "食べ物クイズ一覧",
    lead: "食べ物好きなら楽しめる、無料の食べ物クイズ問題集ページです。",
    description:
      "料理、お菓子、飲み物、食材、グルメ雑学などに関するクイズをまとめています。スキマ時間の暇つぶしとしてはもちろん、食べ物の知識チェックや話題作りにもおすすめです。気になる問題からぜひ挑戦してみてください。",
    seoTitle:
      "食べ物クイズ一覧｜料理・お菓子・グルメで遊べる無料問題集｜ひまQ",
    seoDescription:
      "食べ物クイズを一覧で楽しめる無料問題集です。料理やお菓子、飲み物、食材に関する問題を掲載。暇つぶしや知識チェックにおすすめです。",
    bgClass: "bg-gradient-to-br from-orange-100 via-amber-100 to-yellow-50",
    headingClass:
      "bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-300",
    borderClass: "border-orange-300",
    accentTextClass: "text-orange-600",
    seoBoxClass: "bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50",
    chipClass:
      "bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-300 text-white",
    recommendedFor: [
      "食べ物やグルメの雑学が好きな人",
      "料理やお菓子に関するクイズで遊びたい人",
      "スキマ時間に気軽に暇つぶししたい人",
      "家族や友だちと楽しめる問題を探している人",
    ],
    relatedThemes: [
      { slug: "zatsugaku", label: "💡 雑学クイズ" },
      { slug: "science", label: "🔬 科学クイズ" },
      { slug: "showa", label: "📺 昭和クイズ" },
    ],
  },
  zatsugaku: {
    name: "雑学",
    emoji: "💡",
    pageTitle: "雑学クイズ一覧",
    lead: "いろいろな知識を楽しめる、無料の雑学クイズ問題集ページです。",
    description:
      "身近なことば、生活の知識、意外と知らない豆知識などに関するクイズをまとめています。スキマ時間の暇つぶしとしてはもちろん、知識チェックや話題作りにもおすすめです。気になる問題からぜひ挑戦してみてください。",
    seoTitle:
      "雑学クイズ一覧｜知識チェックにぴったりの無料問題集｜ひまQ",
    seoDescription:
      "雑学クイズを一覧で楽しめる無料問題集です。身近な知識や豆知識、話題にしやすい問題を掲載。スキマ時間の暇つぶしや知識チェックにおすすめです。",
    bgClass: "bg-gradient-to-br from-yellow-100 via-lime-100 to-amber-50",
    headingClass:
      "bg-gradient-to-r from-yellow-500 via-lime-400 to-amber-300",
    borderClass: "border-yellow-300",
    accentTextClass: "text-yellow-600",
    seoBoxClass: "bg-gradient-to-br from-yellow-50 via-lime-50 to-amber-50",
    chipClass:
      "bg-gradient-to-r from-yellow-500 via-lime-400 to-amber-300 text-white",
    recommendedFor: [
      "いろいろなジャンルの知識を試したい人",
      "スキマ時間に暇つぶししたい人",
      "話題作りに使えるネタを増やしたい人",
      "家族や友だちと楽しく遊びたい人",
    ],
    relatedThemes: [
      { slug: "food", label: "🍔 食べ物クイズ" },
      { slug: "sports", label: "⚽ スポーツクイズ" },
      { slug: "science", label: "🔬 科学クイズ" },
    ],
  },
  showa: {
    name: "昭和",
    emoji: "📺",
    pageTitle: "昭和クイズ一覧",
    lead: "懐かしい話題で楽しめる、無料の昭和クイズ問題集ページです。",
    description:
      "昭和の流行、家電、文化、テレビ、食べ物、暮らしに関するクイズをまとめています。懐かしさを楽しみたい人はもちろん、昔の時代を知りたい人にもおすすめです。気になる問題からぜひ挑戦してみてください。",
    seoTitle:
      "昭和クイズ一覧｜懐かしい話題で遊べる無料問題集｜ひまQ",
    seoDescription:
      "昭和クイズを一覧で楽しめる無料問題集です。昭和の流行やテレビ、文化、暮らしに関する問題を掲載。懐かしい話題で楽しみたい人におすすめです。",
    bgClass: "bg-gradient-to-br from-amber-100 via-orange-100 to-yellow-50",
    headingClass:
      "bg-gradient-to-r from-amber-600 via-orange-500 to-yellow-400",
    borderClass: "border-amber-300",
    accentTextClass: "text-amber-700",
    seoBoxClass: "bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50",
    chipClass:
      "bg-gradient-to-r from-amber-600 via-orange-500 to-yellow-400 text-white",
    recommendedFor: [
      "昭和の懐かしい話題が好きな人",
      "昔の流行や文化を楽しく知りたい人",
      "家族で一緒に遊べるクイズを探している人",
      "スキマ時間に気軽に楽しみたい人",
    ],
    relatedThemes: [
      { slug: "music", label: "🎵 音楽クイズ" },
      { slug: "food", label: "🍔 食べ物クイズ" },
      { slug: "zatsugaku", label: "💡 雑学クイズ" },
    ],
  },
  music: {
    name: "音楽",
    emoji: "🎵",
    pageTitle: "音楽クイズ一覧",
    lead: "音楽好きなら楽しめる、無料の音楽クイズ問題集ページです。",
    description:
      "アーティスト、曲名、歌詞、音楽用語、ジャンルに関するクイズをまとめています。スキマ時間の暇つぶしとしてはもちろん、音楽好きの知識チェックにもおすすめです。気になる問題からぜひ挑戦してみてください。",
    seoTitle:
      "音楽クイズ一覧｜アーティスト・曲名で遊べる無料問題集｜ひまQ",
    seoDescription:
      "音楽クイズを一覧で楽しめる無料問題集です。アーティストや曲名、音楽の知識に関する問題を掲載。音楽好きの知識チェックや暇つぶしにおすすめです。",
    bgClass: "bg-gradient-to-br from-violet-100 via-purple-100 to-pink-50",
    headingClass:
      "bg-gradient-to-r from-violet-500 via-purple-400 to-pink-400",
    borderClass: "border-violet-300",
    accentTextClass: "text-violet-600",
    seoBoxClass: "bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50",
    chipClass:
      "bg-gradient-to-r from-violet-500 via-purple-400 to-pink-400 text-white",
    recommendedFor: [
      "音楽やアーティストが好きな人",
      "曲名や歌詞の知識を試したい人",
      "スキマ時間に楽しく遊べるクイズを探している人",
      "友だちと盛り上がれる話題を探している人",
    ],
    relatedThemes: [
      { slug: "showa", label: "📺 昭和クイズ" },
      { slug: "anime", label: "🎬 アニメクイズ" },
      { slug: "zatsugaku", label: "💡 雑学クイズ" },
    ],
  },
  science: {
    name: "科学",
    emoji: "🔬",
    pageTitle: "科学クイズ一覧",
    lead: "科学が好きな人におすすめの、無料の科学クイズ問題集ページです。",
    description:
      "身近な科学、理科の知識、実験、自然現象、宇宙や生き物に関するクイズをまとめています。スキマ時間の脳トレとしてはもちろん、知識チェックや学び直しにもおすすめです。気になる問題からぜひ挑戦してみてください。",
    seoTitle:
      "科学クイズ一覧｜理科・身近な科学で遊べる無料問題集｜ひまQ",
    seoDescription:
      "科学クイズを一覧で楽しめる無料問題集です。理科や身近な科学、自然現象に関する問題を掲載。知識チェックや脳トレにおすすめです。",
    bgClass: "bg-gradient-to-br from-cyan-100 via-sky-100 to-blue-50",
    headingClass: "bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-400",
    borderClass: "border-cyan-300",
    accentTextClass: "text-cyan-700",
    seoBoxClass: "bg-gradient-to-br from-cyan-50 via-sky-50 to-blue-50",
    chipClass:
      "bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-400 text-white",
    recommendedFor: [
      "理科や科学の知識を楽しく試したい人",
      "身近な現象のしくみに興味がある人",
      "学びながら遊べるクイズを探している人",
      "スキマ時間に脳トレしたい人",
    ],
    relatedThemes: [
      { slug: "zatsugaku", label: "💡 雑学クイズ" },
      { slug: "food", label: "🍔 食べ物クイズ" },
      { slug: "sports", label: "⚽ スポーツクイズ" },
    ],
  },
  character: {
    name: "キャラクター",
    emoji: "🧸",
    pageTitle: "キャラクタークイズ一覧",
    lead: "キャラクター好きなら楽しめる、無料のキャラクタークイズ問題集ページです。",
    description:
      "人気キャラクター、登場作品、特徴、セリフ、見た目に関するクイズをまとめています。スキマ時間の暇つぶしとしてはもちろん、好きな作品の知識チェックにもおすすめです。気になる問題からぜひ挑戦してみてください。",
    seoTitle:
      "キャラクタークイズ一覧｜人気キャラで遊べる無料問題集｜ひまQ",
    seoDescription:
      "キャラクタークイズを一覧で楽しめる無料問題集です。人気キャラクターや登場作品に関する問題を掲載。知識チェックや暇つぶしにおすすめです。",
    bgClass: "bg-gradient-to-br from-fuchsia-100 via-pink-100 to-rose-50",
    headingClass:
      "bg-gradient-to-r from-fuchsia-500 via-pink-400 to-rose-400",
    borderClass: "border-fuchsia-300",
    accentTextClass: "text-fuchsia-600",
    seoBoxClass: "bg-gradient-to-br from-fuchsia-50 via-pink-50 to-rose-50",
    chipClass:
      "bg-gradient-to-r from-fuchsia-500 via-pink-400 to-rose-400 text-white",
    recommendedFor: [
      "キャラクターが好きで知識を試したい人",
      "作品や見た目の特徴を当てる問題が好きな人",
      "スキマ時間に楽しく遊びたい人",
      "好きな作品の話題で盛り上がりたい人",
    ],
    relatedThemes: [
      { slug: "anime", label: "🎬 アニメクイズ" },
      { slug: "game", label: "🎮 ゲームクイズ" },
      { slug: "manga", label: "📚 漫画クイズ" },
    ],
  },
  manga: {
    name: "漫画",
    emoji: "📚",
    pageTitle: "漫画クイズ一覧",
    lead: "漫画好きなら楽しめる、無料の漫画クイズ問題集ページです。",
    description:
      "人気漫画、名作漫画、キャラクター、作品名、ストーリーに関するクイズをまとめています。スキマ時間の暇つぶしはもちろん、漫画好きの知識チェックにもおすすめです。気になる問題からぜひ挑戦してみてください。",
    seoTitle:
      "漫画クイズ一覧｜人気作品・名作漫画で遊べる無料問題集｜ひまQ",
    seoDescription:
      "漫画クイズを一覧で楽しめる無料問題集です。人気作品や名作漫画、キャラクターに関する問題を掲載。漫画好きの知識チェックや暇つぶしにおすすめです。",
    bgClass: "bg-gradient-to-br from-red-100 via-rose-100 to-pink-50",
    headingClass: "bg-gradient-to-r from-red-500 via-rose-400 to-pink-400",
    borderClass: "border-rose-300",
    accentTextClass: "text-rose-600",
    seoBoxClass: "bg-gradient-to-br from-red-50 via-rose-50 to-pink-50",
    chipClass:
      "bg-gradient-to-r from-red-500 via-rose-400 to-pink-400 text-white",
    recommendedFor: [
      "漫画が好きで知識を試したい人",
      "人気作品や名作漫画の問題で遊びたい人",
      "スキマ時間に気軽に暇つぶししたい人",
      "好きな作品の話題で盛り上がりたい人",
    ],
    relatedThemes: [
      { slug: "anime", label: "🎬 アニメクイズ" },
      { slug: "character", label: "🧸 キャラクタークイズ" },
      { slug: "game", label: "🎮 ゲームクイズ" },
    ],
  },
};

function getThemeConfig(theme: string) {
  return themeConfigs[theme];
}

export async function generateStaticParams() {
  return Object.keys(themeConfigs).map((theme) => ({ theme }));
}

export async function generateMetadata({ params }: PageProps) {
  const { theme } = await params;
  const config = getThemeConfig(theme);

  if (!config) {
    return {
      title: "テーマクイズ｜ひまQ",
      description:
        "いろいろなジャンルのテーマクイズを楽しめるページです。",
    };
  }

  return {
    title: config.seoTitle,
    description: config.seoDescription,
  };
}

export default async function QuizBooksThemeCategoryPage({
  params,
}: PageProps) {
  const { theme } = await params;
  const config = getThemeConfig(theme);

  if (!config) notFound();

  const allItems = getAllQuizBooksMeta();

  const items = allItems.filter((item) => {
    const itemTheme = item.theme?.toLowerCase().trim();
    const itemTags = item.tags?.map((tag) => tag.toLowerCase().trim()) ?? [];
    return itemTheme === theme || itemTags.includes(theme);
  });

  return (
    <main className={`container mx-auto p-6 ${config.bgClass}`}>
      {/* ===== タイトル ===== */}
      <section className="text-center mb-10">
        <h1
          className={`
            inline-block
            text-3xl md:text-5xl font-extrabold
            px-6 py-3 md:px-10 md:py-4
            rounded-full
            ${config.headingClass}
            tracking-wide
            mb-4
            text-white
          `}
        >
          {config.emoji} {config.pageTitle}
        </h1>

        <p className="text-gray-800 md:text-lg font-medium">{config.lead}</p>

        <p className="text-gray-700 text-sm md:text-base mt-3 max-w-3xl mx-auto leading-relaxed">
          {config.description}
        </p>
      </section>

      {/* ===== 上部導線 ===== */}
      <section className="mb-8 max-w-5xl mx-auto">
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/quizbooks_theme"
            className="px-4 py-2 rounded-full border-2 border-black bg-white font-bold shadow hover:-translate-y-0.5 hover:scale-105 transition-all"
          >
            🎯 テーマ一覧へ
          </Link>

          {config.relatedThemes.map((related) => (
            <Link
              key={related.slug}
              href={`/quizbooks_theme/category/${related.slug}`}
              className={`px-4 py-2 rounded-full border-2 border-black font-bold shadow hover:-translate-y-0.5 hover:scale-105 transition-all ${config.chipClass}`}
            >
              {related.label}
            </Link>
          ))}
        </div>
      </section>

      {/* ===== 一覧 ===== */}
      <section aria-labelledby="theme-quiz-list-heading">
        <h2 className="sr-only" id="theme-quiz-list-heading">
          {config.pageTitle}
        </h2>

        {items.length > 0 ? (
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
                  href={`/quizbooks_theme/${b.slug}`}
                  className="group block p-5 active:scale-95"
                >
                  <p className={`text-xs font-bold mb-2 ${config.accentTextClass}`}>
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
                    ▶ このクイズに挑戦する
                  </p>
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="max-w-3xl mx-auto bg-white border-2 border-black rounded-2xl p-6 shadow-md text-center">
            <h2 className="text-2xl md:text-3xl font-extrabold mb-3">
              もうすぐ公開予定です
            </h2>
            <p className="text-gray-700 leading-relaxed">
              このテーマのクイズは現在準備中です。
              先に他のテーマクイズで遊びながら、公開を楽しみにお待ちください。
            </p>

            <div className="mt-5">
              <Link
                href="/quizbooks_theme"
                className="inline-block px-5 py-2 rounded-full border-2 border-black bg-yellow-100 font-bold shadow hover:scale-105 transition-all"
              >
                テーマ一覧に戻る
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* ===== SEO補足 ===== */}
      <section
        className={`mt-12 max-w-4xl mx-auto rounded-2xl border-2 ${config.borderClass} p-6 shadow-md ${config.seoBoxClass}`}
      >
        <h2 className="text-2xl md:text-3xl font-extrabold mb-4 text-center">
          📘 {config.name}クイズとは？
        </h2>

        <p className="text-gray-700 leading-relaxed mb-6 text-center">
          {config.name}クイズは、好きなジャンルの知識を気軽に試せる人気のクイズです。
          作品名、キャラクター、ルール、豆知識、話題のトピックなどを楽しみながら、
          暇つぶしにも知識チェックにも使えるのが魅力です。
          得意ジャンルに挑戦したい人にも、新しいテーマを気軽に楽しみたい人にもおすすめです。
        </p>

        <h3 className="text-xl md:text-2xl font-bold mb-4 text-center">
          こんな人におすすめ
        </h3>

        <div className="flex justify-center">
          <ul className="text-gray-700 leading-relaxed space-y-2 list-disc pl-5 max-w-md text-left">
            {config.recommendedFor.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* ===== 関連テーマ ===== */}
      <section className="mt-10 max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-4">
          関連テーマから探す
        </h2>

        <p className="text-center text-gray-700 text-sm md:text-base mb-5 max-w-3xl mx-auto leading-relaxed">
          ほかのジャンルのクイズもあわせて遊びたい人向けに、関連するテーマをまとめました。
          気になるジャンルがあれば、そこから新しい問題にも挑戦してみてください。
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          {config.relatedThemes.map((related) => (
            <Link
              key={related.slug}
              href={`/quizbooks_theme/category/${related.slug}`}
              className={`px-4 py-2 rounded-full border-2 border-black font-bold shadow hover:-translate-y-0.5 hover:scale-105 transition-all ${config.chipClass}`}
            >
              {related.label}
            </Link>
          ))}

          <Link
            href="/quizbooks_theme"
            className="px-4 py-2 rounded-full border-2 border-black bg-white font-bold shadow hover:-translate-y-0.5 hover:scale-105 transition-all"
          >
            🎯 テーマ一覧へ
          </Link>
        </div>
      </section>
    </main>
  );
}