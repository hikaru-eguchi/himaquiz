import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import remarkGfm from 'remark-gfm';
import type { Metadata } from 'next';

interface ArticleData {
  id: string;
  title: string;
  date: string;
  contentHtml: string;
  description?: string;
  thumbnail?: string;
}

export async function generateStaticParams() {
  const articlesDirectory = path.join(process.cwd(), 'src', 'articles');
  const fileNames = fs.readdirSync(articlesDirectory);

  return fileNames.map((fileName) => ({
    id: fileName.replace(/\.md$/, ''),
  }));
}

async function getArticleData(id: string): Promise<ArticleData> {
  const fullPath = path.join(process.cwd(), 'src', 'articles', `${decodeURIComponent(id)}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');

  const matterResult = matter(fileContents);

  const processedContent = await remark().use(html).use(remarkGfm).process(matterResult.content);
  const contentHtml = processedContent.toString();

  // front-matter から description と thumbnail を取得
  const { description, thumbnail } = matterResult.data as {
    description?: string;
    thumbnail?: string;
  };

  return {
    id,
    contentHtml,
    ...(matterResult.data as { title: string; date: string;}),
    description,
    thumbnail,
  };
}

// 記事ごとのメタ情報を生成
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const awaitedParams = await Promise.resolve(params);
  const articleData = await getArticleData(awaitedParams.id);

  return {
    title: articleData.title,
    description:
      articleData.description ||
      `${new Date(articleData.date).toLocaleDateString('ja-JP')} の記事: ${articleData.title}`,
    openGraph: {
      title: articleData.title,
      description:
        articleData.description ||
        `${new Date(articleData.date).toLocaleDateString('ja-JP')} の記事: ${articleData.title}`,
      url: `https://www.trendlab.jp/article/${params.id}`,
      siteName: 'トレンドラボ',
      images: [
        {
          url: articleData.thumbnail || '/images/ogp-default.jpg',
          width: 1200,
          height: 630,
          alt: articleData.title,
        },
      ],
      type: 'article',
      publishedTime: new Date(articleData.date).toISOString(),
      locale: 'ja_JP',
    },
  };
}

export default async function ArticleDetailPage({ params }: { params: { id: string } }) {
  const awaitedParams = await Promise.resolve(params);
  const id = awaitedParams.id;
  const articleData = await getArticleData(id);

  return (
    <article className="max-w-5xl mx-auto p-8 md:p-12 bg-white shadow-lg rounded-xl">
      {/* タイトル */}
      <h1 className="text-5xl md:text-3xl font-extrabold text-gray-900 mb-6 text-center">
        {articleData.title}
      </h1>

      {/* 著者・日付 */}
      <p className="text-gray-500 text-center mb-8 text-sm md:text-base">
        <time dateTime={new Date(articleData.date).toISOString()}>
          {new Date(articleData.date).toLocaleDateString('ja-JP')}
        </time>{' '}
      </p>

      {/* 記事本文 */}
      <div
        className="prose prose-lg md:prose-xl max-w-none mx-auto text-gray-700"
        dangerouslySetInnerHTML={{ __html: articleData.contentHtml }}
      />
    </article>
  );
}
