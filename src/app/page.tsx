import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Image from "next/image";
import Pagination from "./components/Pagination";

interface ArticleMeta {
  id: string;
  title: string;
  date: string;
  thumbnail?: string;
  description?: string;
  genre?: string;
  level?: string;
}

async function getSortedArticlesData(): Promise<ArticleMeta[]> {
  const articlesDirectory = path.join(process.cwd(), 'src', 'articles');
  const fileNames = fs.readdirSync(articlesDirectory);

  const allArticlesData = fileNames.map((fileName) => {
    const id = fileName.replace(/\.md$/, '');
    const fullPath = path.join(articlesDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
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

  // Sort articles by date in descending order
  const sortedArticles = allArticlesData.sort((a, b) => {
    if (a.date < b.date) {
      return 1;
    } else {
      return -1;
    }
  });

  return sortedArticles;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams?: { page?: string };
}) {
  const currentPage = Number(searchParams?.page) || 1;

  const allArticles = await getSortedArticlesData();

  // 1ページあたりの記事数
  const ARTICLES_PER_PAGE = 12;

  // 総ページ数
  const totalPages = Math.ceil(allArticles.length / ARTICLES_PER_PAGE);

  // 現在のページに表示する記事を切り出し
  const startIndex = (currentPage - 1) * ARTICLES_PER_PAGE;
  const paginatedArticles = allArticles.slice(
    startIndex,
    startIndex + ARTICLES_PER_PAGE
  );

  return (
    <div className="container mx-auto px-4 py-2 sm:py-8">
      <p className="text-center text-xl md:text-2xl font-extrabold text-gray-800 leading-relaxed -mt-2 mb-2"> ひまな時間にぴったり！「ひまQ」は簡単に遊べる脳トレクイズや暇つぶしクイズが満載です。クイズで頭の体操をしよう！ </p>
      
      {/* ★ クイズ数表示（中央） */}
      <p
        className="text-center text-xl md:text-2xl font-extrabold mb-6 bg-gradient-to-r from-blue-500 via-sky-400 to-blue-300 bg-clip-text text-transparent"
      >
        ＜クイズ数：{allArticles.length} 個＞
      </p>
      <section>
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
                <p className="text-sm text-gray-500 mt-2">
                  ジャンル: {article.genre}
                </p>
                <p className="text-sm text-gray-500">
                  難易度: {article.level}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ▼▼ ページネーション ▼▼ */}
      <div className="mt-10">
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          basePath="/" 
        />
      </div>
    </div>
  );
}
