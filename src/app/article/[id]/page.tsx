import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import remarkGfm from "remark-gfm";
import remarkSlug from "remark-slug";
import remarkAutolinkHeadings from "remark-autolink-headings";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

// 👇 追加：TableOfContentsコンポーネントを読み込む
import TableOfContents from "@/app/components//TableOfContents";
import QuizMDXWrapper from "@/app/components/QuizMDXWrapper";

// ===== 型定義 =====
interface QuizData {
  title: string;
  question: string;
  choices: string[];
  answer: number;
  displayAnswer?: string;
  hint: string;
}

interface ArticleData {
  id: string;
  title: string;
  date: string;
  contentHtml: string;
  description?: string;
  thumbnail?: string;
  quiz?: QuizData;
}

// ===== 記事一覧を取得（関連記事用にも再利用） =====
async function getAllArticles(): Promise<ArticleData[]> {
  const dir = path.join(process.cwd(), "src", "articles");
  const fileNames = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));

  return fileNames.map((fileName) => {
    const id = fileName.replace(/\.md$/, "");
    const fullPath = path.join(dir, fileName);
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const matterResult = matter(fileContents);
    const { title, date, description, thumbnail } = matterResult.data as {
      title: string;
      date: string;
      description?: string;
      thumbnail?: string;
    };

    return { id, title, date, description, thumbnail, contentHtml: "" };
  });
}

// ===== 静的生成するパス =====
export async function generateStaticParams() {
  const articlesDirectory = path.join(process.cwd(), "src", "articles");
  const fileNames = fs.readdirSync(articlesDirectory);

  return fileNames.map((fileName) => ({
    id: fileName.replace(/\.md$/, ""),
  }));
}

// ===== 記事データ取得関数 =====
async function getArticleData(id: string): Promise<ArticleData> {
  const fullPath = path.join(process.cwd(), "src", "articles", `${decodeURIComponent(id)}.md`);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const matterResult = matter(fileContents);

  const { description, thumbnail, quiz } = matterResult.data as {
    description?: string;
    thumbnail?: string;
    quiz?: QuizData;
  };

  // remarkプラグインでslugと自動リンクを追加
  const processedContent = await remark()
    .use(remarkGfm)
    .use(remarkSlug)
    // 👇 remark-toc は削除（自動で目次を挿入すると干渉するため）
    .use(remarkAutolinkHeadings, { behavior: "append" })
    .use(html)
    .process(matterResult.content);

  const contentHtml = processedContent.toString();

  return {
    id,
    contentHtml,
    ...(matterResult.data as { title: string; date: string }),
    description,
    thumbnail,
    quiz,
  };
}

// ===== メタデータ生成 =====
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const articleData = await getArticleData(id);

  const description =
    articleData.description ||
    `${new Date(articleData.date).toLocaleDateString("ja-JP")} の記事: ${articleData.title}`;

  return {
    title: articleData.title,
    description,
    openGraph: {
      title: articleData.title,
      description,
      url: `https://www.hima-quiz.com/article/${id}`,
      siteName: "ひまQ",
      images: [
        {
          url: articleData.thumbnail || "/images/ogp-default.jpg",
          width: 1200,
          height: 630,
          alt: articleData.title,
        },
      ],
      type: "article",
      publishedTime: new Date(articleData.date).toISOString(),
      locale: "ja_JP",
    },
  };
}

// ===== 記事ページ本体 =====
export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const articleData = await getArticleData(id);

  // 👇 関連記事を取得（自分以外の新しい記事上位4件）
  const allArticles = await getAllArticles();
  const relatedArticles = allArticles
    .filter((a) => a.id !== id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 4);

  return (
    <article className="max-w-5xl mx-auto p-8 md:p-12 bg-white shadow-lg rounded-xl">
      {/* タイトル */}
      <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-6 text-center">
        {articleData.title}
      </h1>

      {/* サムネイル表示 */}
      {articleData.thumbnail && (
        <div className="w-full flex justify-center mb-2">
          <div className="w-[255px] h-[160px] md:w-[540px] md:h-[300px] relative rounded-lg overflow-hidden shadow-md border">
            <Image
              src={articleData.thumbnail}
              alt={articleData.title}
              fill
              className="object-cover"
            />
          </div>
        </div>
      )}

      {/* 👇 ここにTableOfContentsを追加 */}
      <TableOfContents content={articleData.contentHtml} />

      {/* 👇 QuizMDXWrapper で本文とクイズを表示 */}
      {articleData.quiz ? (
        <QuizMDXWrapper quiz={articleData.quiz}>
          <div
            className="prose prose-lg md:prose-xl max-w-none mx-auto text-gray-700 mt-6"
            dangerouslySetInnerHTML={{ __html: articleData.contentHtml }}
          />
        </QuizMDXWrapper>
      ) : (
        <div
          className="prose prose-lg md:prose-xl max-w-none mx-auto text-gray-700 mt-6"
          dangerouslySetInnerHTML={{ __html: articleData.contentHtml }}
        />
      )}

      {/* 👇 関連記事セクション */}
      {relatedArticles.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
            おすすめクイズ
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedArticles.map((article) => (
              <Link
                key={article.id}
                href={`/article/${article.id}`}
                className="block bg-gray-50 rounded-lg shadow hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                {article.thumbnail && (
                  <div className="relative w-full h-40">
                    <Image
                      src={article.thumbnail}
                      alt={article.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2">
                    {article.title}
                  </h3>
                  {article.description && (
                    <p className="text-gray-600 text-sm line-clamp-2">{article.description}</p>
                  )}
                  <p className="text-gray-400 text-xs mt-2">
                    {new Date(article.date).toLocaleDateString("ja-JP")}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
