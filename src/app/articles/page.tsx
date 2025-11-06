// app/articles/page.tsx
import Link from "next/link";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import Image from "next/image";

interface ArticleMeta {
  id: string;
  title: string;
  date: string;
  thumbnail?: string;
  description?: string;
}

// --- 記事データを取得 ---
async function getAllArticlesData(): Promise<ArticleMeta[]> {
  const articlesDirectory = path.join(process.cwd(), "src", "articles");
  const fileNames = fs.readdirSync(articlesDirectory).filter((f) => f.endsWith(".md"));

  const allArticlesData = fileNames.map((fileName) => {
    const id = fileName.replace(/\.md$/, "");
    const fullPath = path.join(articlesDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const matterResult = matter(fileContents);

    return {
      id,
      ...(matterResult.data as {
        title: string;
        date: string;
        thumbnail?: string;
        description?: string;
      }),
    } as ArticleMeta;
  });

  // 日付の新しい順にソート
  return allArticlesData.sort((a, b) => {
    if (!a.date || !b.date) return 0;
    return a.date < b.date ? 1 : -1;
  });
}

// --- ページコンポーネント ---
export default async function ArticlesPage() {
  const articles = await getAllArticlesData();

  return (
    <div className="container mx-auto px-4 py-2 sm:py-8">
      <h1 className="text-3xl sm:text-4xl font-bold text-center mb-6 sm:mb-12 text-gray-900">
        記事一覧
      </h1>

      {articles.length === 0 ? (
        <p className="text-center text-gray-600">記事がまだありません。</p>
      ) : (
        <div className="flex flex-col gap-6">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/article/${article.id}`}
              className="flex flex-col sm:flex-row bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden"
            >
              {article.thumbnail && (
                <div className="sm:w-1/3 w-full h-42 sm:h-auto relative">
                  <Image
                    src={article.thumbnail}
                    alt={article.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              <div className="p-5 sm:p-8 flex flex-col justify-between sm:w-2/3">
                <div>
                  <h3 className="font-bold text-2xl mb-3 text-gray-900 line-clamp-2">
                    {article.title}
                  </h3>

                  {article.description && (
                    <p className="text-gray-700 text-sm sm:mb-4 line-clamp-3">
                      {article.description}
                    </p>
                  )}
                </div>

                <p className="text-gray-600 text-sm mt-2 sm:mt-4">
                  <time
                    dateTime={
                      article.date ? new Date(article.date).toISOString() : undefined
                    }
                  >
                    {article.date
                      ? new Date(article.date).toLocaleDateString("ja-JP")
                      : ""}
                  </time>
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
