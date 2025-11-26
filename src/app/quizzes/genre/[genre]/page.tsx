import Link from "next/link";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import Pagination from "../../../components/Pagination";

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
  params: {
    genre: string;
  };
  searchParams?: {
    page?: string;
  };
};

export default async function GenrePage({ params, searchParams }: PageProps) {
  const genreParam = decodeURIComponent(params.genre);
  const currentPage = Number(searchParams?.page) || 1;

  const allArticles = await getSortedArticlesData();

  // 指定ジャンルのみに絞る
  const filteredArticles = allArticles.filter(
    (article) => article.genre === genreParam
  );

  // ページネーション設定
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
        ひまな時間にぴったり！「ひまQ」は簡単に遊べる脳トレクイズや暇つぶしクイズが満載です。クイズで頭の体操をしよう！
      </p>

      <h2 className="text-3xl font-bold mb-2 text-center">
        {genreParam} クイズ
      </h2>

      {/* ★ クイズ数表示（中央） */}
      <p
        className="text-center text-xl md:text-2xl font-extrabold mb-6 bg-gradient-to-r from-blue-500 via-sky-400 to-blue-300 bg-clip-text text-transparent"
      >
        ＜クイズ数：{filteredArticles.length} 個＞
      </p>

      {filteredArticles.length === 0 && (
        <p className="text-center text-gray-500">
          このジャンルのクイズはまだありません。
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {paginatedArticles.map((article) => (
          <Link
            key={article.id}
            href={`/article/${article.id}`}
            className={`block rounded-xl shadow-md hover:shadow-2xl transition-shadow duration-300 ease-in-out overflow-hidden group ${getGenreBg(article.genre)}`}
          >
            <div className="p-5 sm:p-6">
              <h3 className="font-bold text-2xl mb-2 text-gray-900 group-hover:text-brand-dark transition-colors">
                {article.title}
              </h3>

              <p className="text-sm text-gray-700">{article.description}</p>

              {article.level && (
                <p className="text-sm text-gray-700 mt-5">
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
          basePath={`/quizzes/genre/${encodeURIComponent(genreParam)}`}
        />
      </div>
    </div>
  );
}
