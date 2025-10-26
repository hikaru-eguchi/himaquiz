import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import remarkGfm from 'remark-gfm';

interface ArticleData {
  id: string;
  title: string;
  date: string;
  author: string;
  contentHtml: string;
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

  // Use gray-matter to parse the post metadata section
  const matterResult = matter(fileContents);

  // Use remark to convert markdown into HTML string
  const processedContent = await remark().use(html).use(remarkGfm).process(matterResult.content);
  const contentHtml = processedContent.toString();

  // Combine the data with the id and contentHtml
  return {
    id,
    contentHtml,
    ...(matterResult.data as { title: string; date: string; author: string }),
  };
}

export default async function ArticleDetailPage({ params }: { params: { id: string } }) {
  const awaitedParams = await Promise.resolve(params); // Explicitly await, even if not a Promise
  const id = (awaitedParams as { id: string }).id;
  const articleData = await getArticleData(id);

  return (
    <div className="bg-white shadow-lg rounded-xl p-12">
      <h1 className="text-5xl font-extrabold text-gray-900 mb-8 text-center text-red-500">{articleData.title}</h1>
      <p className="text-gray-500 text-center mb-4">
        <time dateTime={new Date(articleData.date).toISOString()}>{new Date(articleData.date).toLocaleDateString('ja-JP')}</time> by {articleData.author}
      </p>
      <div className="prose prose-lg max-w-3xl mx-auto text-gray-600" dangerouslySetInnerHTML={{ __html: articleData.contentHtml }} />
    </div>
  );
}
