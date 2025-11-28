import Link from "next/link";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import Pagination from "../components/Pagination";
import LevelFilterButtons from "@/app/components/LevelFilterButtons";

export const metadata = {
  title: "全てのクイズ｜ひまQ",
  description:
    "ひまQでは、簡単に遊べるクイズを多数掲載。クイズを楽しんで脳トレしよう！",
};

interface ArticleMeta {
  id: string;
  title: string;
  date: string;
  description?: string;
  genre?: string;
  level?: string;
}

// ★ ジャンルごとに背景色を変える関数（ポップで薄め）
function getGenreBg(genre?: string) {
  switch (genre) {
    case "心理系":
      // パステルピンク × ラベンダー
      return "bg-gradient-to-br from-pink-100 via-pink-300 to-purple-100";
    case "知識系":
      // パステルブルー × ミント
      return "bg-gradient-to-br from-sky-100 via-sky-300 to-teal-100";
    case "雑学系":
      // クリーム × パステルグリーン
      return "bg-gradient-to-br from-yellow-100 via-green-300 to-green-100";
    default:
      return "bg-gray-100";
  }
}

// すべてのMarkdown記事を取得
async function getSortedArticlesData(): Promise<ArticleMeta[]> {
  const articlesDirectory = path.join(process.cwd(), "src", "articles");
  const fileNames = fs.readdirSync(articlesDirectory);

  const allArticlesData = fileNames.map((fileName) => {
    const id = fileName.replace(/\.md$/, "");
    const fullPath = path.join(articlesDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const matterResult = matter(fileContents);

    return {
      id,
      title: matterResult.data.title,
      date: matterResult.data.date,
      description: matterResult.data.description,
      genre: matterResult.data.quiz?.genre,
      level: matterResult.data.quiz?.level,
    };
  });

  // 日付降順
  return allArticlesData.sort((a, b) => (a.date < b.date ? 1 : -1));
}

type PageProps = {
  searchParams?: {
    page?: string;
  };
};

export default async function QuizzesPage({ searchParams }: PageProps) {
  const currentPage = Number(searchParams?.page) || 1;

  const allArticles = await getSortedArticlesData();

  // ページネーション設定
  const ARTICLES_PER_PAGE = 12;
  const totalPages = Math.ceil(allArticles.length / ARTICLES_PER_PAGE);

  const startIndex = (currentPage - 1) * ARTICLES_PER_PAGE;
  const paginatedArticles = allArticles.slice(
    startIndex,
    startIndex + ARTICLES_PER_PAGE
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <p className="text-center text-lg md:text-xl font-extrabold text-gray-800 leading-relaxed -mt-2 mb-6">
        ひまな時間にぴったり！「ひまQ」は簡単に遊べる脳トレクイズや暇つぶしクイズが満載です。クイズで頭の体操をしよう！
      </p>

      {/* 難易度ボタン */}
      <div className="m-6">
        <LevelFilterButtons/>
      </div>

      <h1 className="text-3xl font-bold mb-2 text-center leading-tight">
        全て の クイズ
      </h1>

      {/* ★ クイズ数表示（中央） */}
      <p
        className="text-center text-xl md:text-2xl font-extrabold mb-6"
      >
        ＜クイズ数：{allArticles.length} 個＞
      </p>

      {/* ===== すべてのクイズ一覧 ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {paginatedArticles.map((article) => (
          <Link
            key={article.id}
            href={`/article/${article.id}`}
            className={`block rounded-xl shadow-md hover:shadow-2xl border border-black transition-shadow duration-300 ease-in-out overflow-hidden group ${getGenreBg(article.genre)}`}
          >
            <div className="p-1 sm:p-2 bg-white rounded-lg m-5">
              <h3 className="font-bold text-2xl mb-2 text-gray-900 group-hover:text-brand-dark transition-colors">
                {article.title}
              </h3>

              <p className="text-sm text-gray-700">
                {article.description}
              </p>

              {article.genre && (
                <p className="text-sm text-gray-700 mt-5">
                  ジャンル: {article.genre}
                </p>
              )}

              {article.level && (
                <p className="text-sm text-gray-700">
                  難易度: {article.level}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* ▼▼ ページネーション ▼▼ */}
      <div className="mt-10">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          basePath="/quizzes"
        />
      </div>
    </div>
  );
}
