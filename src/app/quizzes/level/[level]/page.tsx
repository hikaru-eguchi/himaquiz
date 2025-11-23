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

interface PageProps {
  params: { level: string };
}

export default async function LevelPage({ params }: PageProps) {
  const allArticles = await getSortedArticlesData();

  // URLデコードして日本語レベルと比較
  const levelParam = decodeURIComponent(params.level);

  const filteredArticles = allArticles.filter(
    (article) => article.level === levelParam
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-6 text-center">{levelParam} レベルのクイズ</h2>

      {filteredArticles.length === 0 && (
        <p className="text-center text-gray-500">このレベルのクイズはまだありません。</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        {filteredArticles.map((article) => (
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
              {article.description && <p className="text-gray-600">{article.description}</p>}
              {article.genre && (
                <p className="text-sm text-gray-500 mt-2">ジャンル: {article.genre}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
