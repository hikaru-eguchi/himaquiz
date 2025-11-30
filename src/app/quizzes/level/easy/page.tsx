// src/app/quizzes/level/easy/page.tsx
import Link from "next/link";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import Pagination from "@/app/components/Pagination";
import LevelFilterButtons from "@/app/components/LevelFilterButtons";

export const metadata = {
  title: "かんたんレベルのクイズ｜ひまQ",
  description:
    "ひまQでは、頭を鍛えるかんたんクイズを多数掲載。脳トレクイズや面白クイズで、ちょっとした空き時間に脳を鍛えよう。",
};

interface ArticleMeta {
  id: string;
  title: string;
  date: string;
  description?: string;
  genre?: string;
  level?: string;
}

// ジャンルごとの背景色
function getGenreBg(genre?: string) {
  switch (genre) {
    case "心理系":
      return "bg-gradient-to-br from-pink-100 via-pink-300 to-purple-100";
    case "知識系":
      return "bg-gradient-to-br from-sky-100 via-sky-300 to-teal-100";
    case "雑学系":
      return "bg-gradient-to-br from-yellow-100 via-green-300 to-green-100";
    default:
      return "bg-gray-100";
  }
}

// Markdown記事取得
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

  return allArticlesData.sort((a, b) => (a.date < b.date ? 1 : -1));
}

type PageProps = {
  searchParams?: { page?: string };
};

export default async function EasyLevelPage({ searchParams }: PageProps) {
  const levelParam = "かんたん";
  const currentPage = Number(searchParams?.page) || 1;

  const allArticles = await getSortedArticlesData();

  // 難易度「かんたん」のみ抽出（ジャンルは問わない）
  const filteredArticles = allArticles.filter(
    (article) => article.level === levelParam
  );

  // ページネーション
  const ARTICLES_PER_PAGE = 12;
  const totalPages = Math.ceil(filteredArticles.length / ARTICLES_PER_PAGE);
  const startIndex = (currentPage - 1) * ARTICLES_PER_PAGE;
  const paginatedArticles = filteredArticles.slice(
    startIndex,
    startIndex + ARTICLES_PER_PAGE
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <p className="text-center text-lg md:text-xl font-extrabold text-gray-800 leading-relaxed -mt-2 mb-6">
        頭を鍛える暇つぶし！『ひまQ』は、暇つぶししながら頭を鍛えられる脳トレ＆面白クイズが満載。空き時間に脳力をアップしよう！
      </p>

      {/* 難易度ボタン */}
      <div className="m-6">
        <LevelFilterButtons />
      </div>

      <h1 className="text-3xl font-bold mb-2 text-center">
        かんたんレベル<span className="block sm:inline"> の クイズ</span>
      </h1>

      {/* クイズ数 */}
      <p className="text-center text-xl md:text-2xl font-extrabold mb-6">
        ＜クイズ数：{filteredArticles.length} 個＞
      </p>

      {filteredArticles.length === 0 && (
        <p className="text-center text-gray-500">
          この難易度のクイズはまだありません。
        </p>
      )}

      {/* クイズ一覧 */}
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

              <p className="text-sm text-gray-700">{article.description}</p>

              {article.genre && (
                <p className="text-sm text-gray-700 mt-5">ジャンル: {article.genre}</p>
              )}

              {article.level && (
                <p className="text-sm text-gray-700">難易度: {article.level}</p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* ページネーション */}
      <div className="mt-10">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          basePath={`/quizzes/level/${encodeURIComponent(levelParam)}`}
        />
      </div>
    </div>
  );
}
