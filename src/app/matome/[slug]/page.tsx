import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllMatome, getMatomeBySlug } from "@/lib/matome";
import { marked } from "marked";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  const items = getAllMatome();

    return items.map((item) => ({
    slug: item.slug,
    }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const item = getMatomeBySlug(slug);

  if (!item) {
    return {
      title: "まとめ記事が見つかりません｜ひまQ",
    };
  }

  return {
    title: `${item.title}｜ひまQ`,
    description: item.description,
  };
}

export default async function MatomeDetailPage({ params }: Props) {
  const { slug } = await params;
  const item = getMatomeBySlug(slug);

  if (!item) {
    notFound();
  }

  const relatedItems = getAllMatome()
    .filter((matome) => matome.slug !== slug)
    .slice(0, 3);

  return (
    <main className="bg-gradient-to-b from-yellow-50 via-orange-50 to-sky-50 py-4 md:py-10">
      <article className="mx-auto max-w-[880px] px-4">
        <div className="mb-5">
          <Link
            href="/matome"
            className="inline-flex rounded-full border-2 border-black bg-white px-4 py-2 text-sm font-black text-gray-700 shadow-md transition-all hover:scale-105"
          >
            ← まとめ一覧へ戻る
          </Link>
        </div>

        <header className="rounded-[28px] border-2 border-black bg-white p-5 text-center shadow-[6px_6px_0_rgba(0,0,0,0.85)] md:p-8">
          <div
            className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl border-2 border-black bg-gradient-to-br ${item.color || "from-orange-300 via-yellow-300 to-pink-300"} text-4xl shadow-lg`}
          >
            {item.emoji || "📚"}
          </div>

          <p className="mx-auto mb-3 inline-block rounded-full border-2 border-black bg-red-500 px-4 py-1 text-sm font-black text-white shadow-md rotate-[-2deg]">
            {item.badge || "まとめ"}
          </p>

          <h1 className="text-3xl font-black leading-tight text-gray-900 md:text-5xl">
            {item.title}
          </h1>

          <p className="mx-auto mt-4 max-w-[720px] text-base font-bold leading-relaxed text-gray-700 md:text-lg">
            {item.description}
          </p>

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {item.tags?.map((tag) => (
              <span
                key={tag}
                className="rounded-full border-2 border-black bg-yellow-100 px-3 py-1 text-xs font-black text-gray-800 shadow-sm md:text-sm"
              >
                #{tag}
              </span>
            ))}
          </div>
        </header>

        <section className="mt-6 rounded-[28px] border-2 border-black bg-white p-5 shadow-[6px_6px_0_rgba(0,0,0,0.85)] md:p-8">
            <div
                className="prose prose-lg max-w-none prose-headings:font-black prose-p:font-bold prose-p:leading-8"
                dangerouslySetInnerHTML={{
                __html: marked(item.content),
                }}
            />
        </section>

        <section className="mt-6 rounded-[28px] border-2 border-black bg-gradient-to-br from-pink-200 via-yellow-100 to-sky-200 p-5 text-center shadow-[6px_6px_0_rgba(0,0,0,0.85)] md:p-8">
          <p className="text-2xl font-black text-gray-900 md:text-3xl">
            🎮 読んだらそのまま遊んでみよう！
          </p>

          <p className="mx-auto mt-3 max-w-[620px] text-sm font-bold leading-relaxed text-gray-700 md:text-base">
            まとめ記事を読んだあとは、実際にひまQのクイズに挑戦できます。
            ひとりでも、友達とでも、空き時間にサクッと遊べます。
          </p>

          <Link
            href={item.ctaHref || "/"}
            className="mt-5 inline-flex rounded-full border-2 border-black bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-3 text-base font-black text-white shadow-xl transition-all hover:scale-105 md:text-xl"
          >
            {item.ctaText || "ひまQで遊ぶ"} →
          </Link>
        </section>

        <section className="mt-8">
          <h2 className="mb-4 text-center text-2xl font-black text-gray-900 md:text-3xl">
            🔥 他のまとめも読む
          </h2>

          <div className="grid gap-4 md:grid-cols-3">
            {relatedItems.map((related) => (
              <Link
                key={related.slug}
                href={`/matome/${related.slug}`}
                className="group rounded-3xl border-2 border-black bg-white p-4 shadow-[4px_4px_0_rgba(0,0,0,0.85)] transition-all hover:-translate-y-1 hover:shadow-[7px_7px_0_rgba(0,0,0,0.85)]"
              >
                <div
                  className={`mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-black bg-gradient-to-br ${related.color} text-2xl shadow-md`}
                >
                  {related.emoji}
                </div>

                <p className="mb-1 inline-block rounded-full bg-red-500 px-2 py-0.5 text-xs font-black text-white">
                  {related.badge}
                </p>

                <h3 className="text-base font-black leading-snug text-gray-900 group-hover:text-orange-500">
                  {related.title}
                </h3>
              </Link>
            ))}
          </div>
        </section>
      </article>
    </main>
  );
}