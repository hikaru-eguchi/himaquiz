import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import remarkSlug from "remark-slug";
import remarkAutolinkHeadings from "remark-autolink-headings";
import TableOfContents from "@/app/components/TableOfContents";
import ArticleMDXWrapper from "./ArticleMDXWrapper"; // クライアント側MDX表示

interface ArticleData {
  id: string;
  title: string;
  date: string;
  mdxSource: any;
  description?: string;
  thumbnail?: string;
}

async function getAllArticles(): Promise<ArticleData[]> {
  const dir = path.join(process.cwd(), "src/articles");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"));

  return files.map((file) => {
    const id = file.replace(/\.mdx$/, "");
    const { title, date, description, thumbnail } = matter(fs.readFileSync(path.join(dir, file), "utf8")).data as any;
    return { id, title, date, description, thumbnail, mdxSource: null };
  });
}

async function getArticleData(id: string): Promise<ArticleData> {
  const fileName = id.endsWith(".mdx") ? id : `${id}.mdx`;
  const filePath = path.join(process.cwd(), "src/articles", decodeURIComponent(fileName));
  const fileContents = fs.readFileSync(filePath, "utf8");
  const { data } = matter(fileContents);

  const mdxSource = await serialize(fileContents, {
    mdxOptions: {
      remarkPlugins: [remarkGfm, remarkSlug, remarkAutolinkHeadings],
    },
  });

  return { id, mdxSource, ...(data as any) };
}

export async function generateStaticParams() {
  const dir = path.join(process.cwd(), "src/articles");
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith(".mdx"))
    .map((file) => ({ id: file.replace(/\.mdx$/, "") }));
}

export async function generateMetadata({ params }: { params: { id: string } | Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const article = await getArticleData(resolvedParams.id);
  return {
    title: article.title,
    description: article.description || "",
    openGraph: {
      title: article.title,
      description: article.description || "",
      url: `https://www.hima-quiz.com/article/${article.id}`,
      siteName: "ひまQ",
      images: [{ url: article.thumbnail || "/images/ogp-default.jpg", width: 1200, height: 630, alt: article.title }],
      type: "article",
      publishedTime: new Date(article.date).toISOString(),
      locale: "ja_JP",
    },
  };
}

export default async function ArticleDetailPage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const article = await getArticleData(resolvedParams.id);
  const allArticles = await getAllArticles();
  const relatedArticles = allArticles.filter((a) => a.id !== article.id).slice(0, 4);

  return (
    <article className="max-w-5xl mx-auto p-8 md:p-12 bg-white shadow-lg rounded-xl">
      <h1 className="text-2xl sm:text-3xl text-gray-900 mb-6 text-center">{article.title}</h1>

      <TableOfContents content={article.mdxSource?.compiledSource || ""} />

      {/* ここでクライアントコンポーネントを呼ぶ */}
      <ArticleMDXWrapper mdxSource={article.mdxSource} />

      {relatedArticles.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl text-gray-900 mb-8 text-center">おすすめクイズ</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedArticles.map((a) => (
              <Link key={a.id} href={`/article/${a.id}`} className="block bg-gray-50 rounded-lg shadow hover:shadow-lg transition-all duration-300 overflow-hidden">
                {a.thumbnail && (
                  <div className="relative w-full h-40">
                    <Image src={a.thumbnail} alt={a.title} fill className="object-cover" />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="text-lg text-gray-900 line-clamp-2 mb-2">{a.title}</h3>
                  {a.description && <p className="text-gray-600 text-sm line-clamp-2">{a.description}</p>}
                  <p className="text-gray-400 text-xs mt-2">{new Date(a.date).toLocaleDateString("ja-JP")}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
