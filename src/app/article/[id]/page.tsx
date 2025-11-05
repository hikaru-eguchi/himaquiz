import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import remarkGfm from "remark-gfm";
import remarkSlug from "remark-slug";
import remarkAutolinkHeadings from "remark-autolink-headings";
import type { Metadata } from "next";

// 👇 追加：TableOfContentsコンポーネントを読み込む
import TableOfContents from "@/app/components//TableOfContents";

// ===== 型定義 =====
interface ArticleData {
  id: string;
  title: string;
  date: string;
  contentHtml: string;
  description?: string;
  thumbnail?: string;
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

  const { description, thumbnail } = matterResult.data as {
    description?: string;
    thumbnail?: string;
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
      url: `https://www.trendlab.jp/article/${id}`,
      siteName: "トレンドラボ",
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

  return (
    <article className="max-w-5xl mx-auto p-8 md:p-12 bg-white shadow-lg rounded-xl">
      {/* タイトル */}
      <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-6 text-center">
        {articleData.title}
      </h1>

      {/* 投稿日時 */}
      <p className="text-gray-500 text-center mb-8 text-sm md:text-base">
        <time dateTime={new Date(articleData.date).toISOString()}>
          {new Date(articleData.date).toLocaleDateString("ja-JP")}
        </time>
      </p>

      {/* 👇 ここにTableOfContentsを追加 */}
      <TableOfContents content={articleData.contentHtml} />

      {/* 記事本文 */}
      <div
        className="prose prose-lg md:prose-xl max-w-none mx-auto text-gray-700"
        dangerouslySetInnerHTML={{ __html: articleData.contentHtml }}
      />
    </article>
  );
}
