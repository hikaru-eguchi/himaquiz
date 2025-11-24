import Link from "next/link";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import Image from "next/image";
import Pagination from "../../../components/Pagination";

interface ArticleMeta {
  id: string;
  title: string;
  date: string;
  thumbnail?: string;
  description?: string;
  genre?: string;
  level?: string;
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
      thumbnail: matterResult.data.thumbnail,
      description: matterResult.data.description,
      genre: matterResult.data.quiz?.genre,
      level: matterResult.data.quiz?.level,
    };
  });

  return allArticlesData.sort((a, b) => (a.date < b.date ? 1 : -1));
}

type PageProps = {
  params: {
    level: string;
  };
  searchParams?: {
    page?: string;
  };
};

export default async function LevelPage({ params, searchParams }: PageProps) {
  const levelParam = decodeURIComponent(params.level);
  const currentPage = Number(searchParams?.page) || 1;

  const allArticles = await getSortedArticlesData();

  // レベルで絞り込み
  const filteredArticles = allArticles.filter(
    (article) => article.level === levelParam
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
      <p className="text-center text-xl md:text-2xl font-extrabold text-gray-800 leading-relaxed -mt-2 mb-6"> ひまな時間にぴったり！「ひまQ」は簡単に遊べる脳トレクイズや暇つぶしクイズが満載です。クイズで頭の体操をしよう！ </p>
      <h2 className="text-3xl font-bold mb-6 text-center">
        {levelParam} レベルのクイズ
      </h2>

      {filteredArticles.length === 0 && (
        <p className="text-center text-gray-500">
          このレベルのクイズはまだありません。
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        {paginatedArticles.map((article) => (
          <Link
            key={article.id}
            href={`/article/${article.id}`}
            className="block bg-white rounded-xl shadow-md hover:shadow-2xl transition-shadow duration-300 ease-in-out overflow-hidden group"
          >
            {article.thumbnail && (
              <Image
                src={article.thumbnail}
                alt={article.title}
                width={600}
                height={400}
                className="w-full h-42 sm:h-48 object-cover"
              />
            )}
            <div className="p-5 sm:p-8">
              <h3 className="font-bold text-2xl mb-3 text-gray-900 group-hover:text-brand-dark transition-colors">
                {article.title}
              </h3>

              {article.genre && (
                <p className="text-sm text-gray-500 mt-2">
                  ジャンル: {article.genre}
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
          basePath={`/quizzes/level/${encodeURIComponent(levelParam)}`}
        />
      </div>
    </div>
  );
}
