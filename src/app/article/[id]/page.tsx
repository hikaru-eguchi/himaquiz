import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import remarkGfm from "remark-gfm";
import remarkSlug from "remark-slug";
import remarkAutolinkHeadings from "remark-autolink-headings";
import type { Metadata } from "next";
import Link from "next/link";
import BackButton from "@/app/components/BackButton";

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
  genre?: string;
  level?: string;
}

interface ArticleData {
  id: string;
  title: string;
  date: string;
  contentHtml: string;
  description?: string;
  quiz?: QuizData;
}

// ★ ジャンルごとに背景色を変える関数（ポップで薄め）
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

// ===== 記事一覧を取得（関連記事用にも再利用） =====
async function getAllArticles(): Promise<ArticleData[]> {
  const dir = path.join(process.cwd(), "src", "articles");
  const fileNames = fs.readdirSync(dir).filter((f) => f.endsWith(".md")).sort();;

  return fileNames.map((fileName) => {
    const id = fileName.replace(/\.md$/, "");
    const fullPath = path.join(dir, fileName);
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const matterResult = matter(fileContents);
    const { title, date, description, quiz } = matterResult.data as {
      title: string;
      date: string;
      description?: string;
      quiz?: QuizData;
    };

    return { id, title, date, description, quiz, contentHtml: "" };
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

  const { description, quiz } = matterResult.data as {
    description?: string;
    quiz?: QuizData;
  };

  const processedContent = await remark()
    .use(remarkGfm)
    .use(remarkSlug)
    .use(remarkAutolinkHeadings, { behavior: "append" })
    .use(html)
    .process(matterResult.content);

  const contentHtml = processedContent.toString();

  return {
    id,
    contentHtml,
    ...(matterResult.data as { title: string; date: string }),
    description,
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

  const allArticlesSorted = (await getAllArticles())
    .filter((a) => a.quiz?.genre === articleData.quiz?.genre) // クイズがある記事だけ
    .sort(
      (a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
    ); // 日付順（昇順）

  const decodedId = decodeURIComponent(id);

  const currentIndex = allArticlesSorted.findIndex((a) => a.id === decodedId);

  const prevArticle =
    currentIndex > 0 ? allArticlesSorted[currentIndex - 1] : null;

  const nextArticle =
    currentIndex >= 0 && currentIndex < allArticlesSorted.length - 1
      ? allArticlesSorted[currentIndex + 1]
      : null;

  // 👇 関連記事を取得（自分以外・同じ難易度の記事のみ・上位4件）
  const allArticles = await getAllArticles();
  const relatedArticles = allArticles
    .filter((a) => a.id !== id)
    .filter((a) => a.quiz?.genre === articleData.quiz?.genre)
    .sort(() => Math.random() - 0.5)
    .slice(0, 4);

  return (
    <article className="max-w-5xl mx-auto p-8 md:p-12 bg-white shadow-lg rounded-xl">
      {/* 左上：一覧に戻る */}
      {/* <div className="mb-4">
        <Link
          href="/quizzes"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-sm"
        >
          ← 一覧に戻る
        </Link>
      </div> */}
      {/* 左上：前のページに戻る */}
      <div className="mb-4">
        <BackButton />
      </div>
      {/* タイトル */}
      <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-6 text-center">
        {articleData.title}
      </h1>

      {/* TableOfContents */}
      <TableOfContents content={articleData.contentHtml} />

      {/* 本文とクイズ */}
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

      {/* 前/次の問題ボタン */}
      <div className="mt-6 flex items-center justify-between gap-3">
        {nextArticle ? (
          <Link
            href={`/article/${nextArticle.id}`}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
          >
            ← 前の問題
          </Link>
        ) : (
          <div />
        )}

        {prevArticle ? (
          <Link
            href={`/article/${prevArticle.id}`}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
          >
            次の問題 →
          </Link>
        ) : (
          <div />
        )}
      </div>

      {/* おすすめクイズ */}
      {relatedArticles.length > 0 && (
        <section
          className="mt-16 p-3 rounded-lg"
          style={{
            background: "linear-gradient(90deg, #ffd36b, #fff87d, #a0e8ff)"
          }}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 text-center">
            おすすめクイズ！
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedArticles.map((article) => (
              <Link
                key={article.id}
                href={`/article/${article.id}`}
                className={`block rounded-lg border border-black shadow hover:shadow-lg transition-all duration-300 overflow-hidden ${getGenreBg(article.quiz?.genre)}`}
              >
                <div className="p-2 bg-white rounded-lg m-5">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2">
                    {article.title}
                  </h3>

                  {article.description && (
                    <p className="text-gray-700 text-sm line-clamp-2">{article.description}</p>
                  )}

                  {article.quiz?.genre && (
                    <p className="text-sm text-gray-800 mt-3">ジャンル：{article.quiz.genre}</p>
                  )}

                  {article.quiz?.level && (
                    <p className="text-sm text-gray-800">難易度：{article.quiz.level}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
