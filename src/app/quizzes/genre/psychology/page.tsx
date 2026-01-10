// src/app/quizzes/genre/雑学系/page.tsx
import Link from "next/link";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import Pagination from "@/app/components/Pagination";
import LevelFilterButtons from "@/app/components/LevelFilterButtons";

export const metadata = {
  title: "心理系クイズで暇つぶし｜ひまQ",
  description:
    "ひまQの心理系クイズは、性格や考え方が分かる楽しい問題が中心。空き時間にみんなで遊んで盛り上がれる暇つぶしクイズです。",
};

interface ArticleMeta {
  id: string;
  title: string;
  date: string;
  description?: string;
  genre?: string;
  level?: string;
}

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

export default async function TriviaAllPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const genreParam = "psychology"; // ★ 英語表記に変更
  const params = await searchParams;
  const currentPage = Number(params?.page) || 1;

  const allArticles = await getSortedArticlesData();

  // ジャンル「心理系」のクイズだけ（難易度は問わない）
  const filteredArticles = allArticles.filter(
    (article) => article.genre === "心理系" // 表示は日本語で判定
  );

  const ARTICLES_PER_PAGE = 12;
  const totalPages = Math.ceil(filteredArticles.length / ARTICLES_PER_PAGE);

  const startIndex = (currentPage - 1) * ARTICLES_PER_PAGE;
  const paginatedArticles = filteredArticles.slice(
    startIndex,
    startIndex + ARTICLES_PER_PAGE
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <p className="text-center text-md md:text-xl font-extrabold text-gray-800 leading-relaxed -mt-2 mb-6">
        みんなで遊べる暇つぶしクイズ『ひまQ』は、暇つぶしにぴったりな、ひとりでも、みんなでも盛り上がれるクイズが満載です。
      </p>

      {/* 難易度ボタン */}
      <div className="m-6">
        <LevelFilterButtons genre={genreParam} /> {/* 英語の genre を渡す */}
      </div>

      <h1 className="text-3xl font-bold mb-2 text-center text-pink-600 leading-tight">
        心理系の楽しい暇つぶしクイズ
      </h1>

      <p className="text-center text-xl md:text-2xl font-extrabold mb-6">
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
            className={`block rounded-xl shadow-md hover:shadow-2xl border border-black transition-shadow duration-300 ease-in-out overflow-hidden group ${getGenreBg(article.genre)}`}
          >
            <div className="p-1 sm:p-2 bg-white rounded-lg m-5">
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
