import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import QuizMDXWrapper from "@/app/components/QuizMDXWrapper";

export const metadata = {
  title: "頭を鍛える暇つぶしクイズ｜ひまQ",
  description:
    "ひまQでは、頭を鍛える暇つぶしクイズを多数掲載。脳トレクイズや面白クイズで、ちょっとした空き時間に脳を鍛えよう。",
};

// ===== 型定義 =====
interface QuizData {
  title: string;
  hint: string;
  question: string;
  choices: string[];
  answer: number;
  displayAnswer?: string;
  answerExplanation?: string;
  trivia?: string;
  genre?: string;
  level?: string;
}

interface ArticleMeta {
  id: string;
  title: string;
  date: string;
  description?: string;
  genre?: string;
  level?: string;
  quiz?: QuizData;
}

// ★ ジャンルごとに背景色を変える関数
function getGenreBg(genre?: string) {
  switch (genre) {
    case "心理系":
      // パステルピンク × ラベンダー
      return "bg-gradient-to-br from-pink-100 via-pink-300 to-purple-100";
    case "知識系":
      // パステルブルー × ミント
      return "bg-gradient-to-br from-sky-100 via-sky-300 to-teal-100";
    case "雑学系":
      // クリーム × パステルグリーン
      return "bg-gradient-to-br from-yellow-100 via-green-300 to-green-100";
    default:
      return "bg-gray-100";
  }
}

async function getSortedArticlesData(): Promise<ArticleMeta[]> {
  const articlesDirectory = path.join(process.cwd(), 'src', 'articles');
  const fileNames = fs.readdirSync(articlesDirectory);

  const allArticlesData = fileNames.map((fileName) => {
    const id = fileName.replace(/\.md$/, '');
    const fullPath = path.join(articlesDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const matterResult = matter(fileContents);
    const data = matterResult.data as {
      quiz?: {
        title: string;
        question: string;
        hint: string;
        trivia?: string;
        choices: string[];
        answer: number;
        displayAnswer?: string;
        answerExplanation?: string;
        genre?: string;
        level?: string;
      };
    };

    return {
      id,
      title: matterResult.data.title,
      date: matterResult.data.date,
      description: matterResult.data.description,
      genre: matterResult.data.quiz?.genre,
      level: matterResult.data.quiz?.level,
      quiz: data.quiz ? {
        title: data.quiz.title,
        question: data.quiz.question,
        hint: data.quiz.hint,
        trivia: data.quiz.trivia,
        choices: data.quiz.choices,
        answer: data.quiz.answer,
        displayAnswer: data.quiz.displayAnswer,
        answerExplanation: data.quiz.answerExplanation,
        genre: data.quiz.genre,
        level: data.quiz.level,
      } : undefined
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
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const currentPage = Number(params?.page) || 1;

  const allArticles = await getSortedArticlesData();

  // ランダムで今日のクイズを選択
  const quizArticles = allArticles.filter(a => a.quiz);
  const randomQuizArticle =
    quizArticles.length > 0
      ? quizArticles[Math.floor(Math.random() * quizArticles.length)]
      : null;

  // 1ページあたりの記事数
  const ARTICLES_PER_PAGE = 12;

  // 総ページ数
  const totalPages = Math.ceil(allArticles.length / ARTICLES_PER_PAGE);

  // 現在のページ記事
  const startIndex = (currentPage - 1) * ARTICLES_PER_PAGE;
  const paginatedArticles = allArticles.slice(
    startIndex,
    startIndex + ARTICLES_PER_PAGE
  );

  return (
    <div className="container mx-auto px-4 py-2 sm:py-8">

      <p className="text-center text-lg md:text-xl font-extrabold text-gray-800 leading-relaxed -mt-2 mb-6">
        頭を鍛える暇つぶし！『ひまQ』は、暇つぶししながら頭を鍛えられる脳トレ＆面白クイズが満載。空き時間に脳力をアップしよう！
      </p>

      <h1
        className="text-3xl font-bold mb-2 text-center leading-tight"
        style={{
          background: "linear-gradient(90deg, #007BFF, #4C6EF5, #845EF7)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        頭を鍛える暇つぶしクイズ｜脳トレ＆面白問題が満載！
      </h1>

      {/* 今日のクイズ表示 */}
      <div className='max-w-[700px] mx-auto border-2 border-black rounded-xl m-5 p-5 bg-gradient-to-b from-red-0 via-red-100 to-red-200'>
        <h2 className="
          text-2xl md:text-4xl 
          font-extrabold 
          mb-3 
          text-center 
          bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 
          text-transparent 
          bg-clip-text 
          drop-shadow-2xl
          animate-bounce
          animate-pulse
        ">
          今日のチャレンジクイズ！🔥
        </h2>
        <p className="text-lg md:text-xl mb-2 text-center leading-tight mb-4 underline">
          まずはこの問題！あなたは解けるかな？
        </p>
        {randomQuizArticle?.quiz && (
          <QuizMDXWrapper quiz={randomQuizArticle.quiz} />
        )}
      </div>
      
        <p className="text-xl md:text-2xl mb-2 text-center leading-tight mt-5 mb-5">
          他のクイズはこちら👇
        </p>

      <div className="max-w-[700px] mx-auto border-2 border-black rounded-xl m-5 p-5 bg-gradient-to-b from-blue-0 via-blue-50 to-blue-100">
        <p className="text-2xl md:text-3xl font-bold mb-2 text-center leading-tight drop-shadow-xl text-blue-500">
          📚ジャンルから選ぶ📚
        </p>
        <p className="text-lg md:text-xl mb-2 text-center leading-tight mb-4">
          あなたはどれが好き？ジャンルを選ぼう！
        </p>
        <div className="flex flex-wrap justify-center gap-2 md:gap-5">
          <Link href="/quizzes/genre/psychology">
            <button className="text-xl md:text-2xl px-3 md:px-5 py-1 md:py-2 border-2 border-black rounded-full font-bold shadow-sm bg-gradient-to-br from-pink-100 via-pink-300 to-purple-100 hover:scale-105 transition-all">
              心理系
            </button>
          </Link>

          <Link href="/quizzes/genre/knowledge">
            <button className="text-xl md:text-2xl px-3 md:px-5 py-1 md:py-2 border-2 border-black rounded-full font-bold shadow-sm bg-gradient-to-br from-sky-100 via-sky-300 to-teal-100 hover:scale-105 transition-all">
              知識系
            </button>
          </Link>

          <Link href="/quizzes/genre/trivia">
            <button className="text-xl md:text-2xl px-3 md:px-5 py-1 md:py-2 border-2 border-black rounded-full font-bold shadow-sm bg-gradient-to-br from-yellow-100 via-green-300 to-green-100 hover:scale-105 transition-all">
              雑学系
            </button>
          </Link>
        </div>
      </div>

      <div className="max-w-[700px] mx-auto border-2 border-black rounded-xl m-5 p-5 bg-gradient-to-b from-yellow-0 via-yellow-50 to-yellow-100">
        <p className="text-2xl md:text-3xl font-bold mb-2 text-center leading-tight drop-shadow-xl text-yellow-500">
          ⭐難易度から選ぶ⭐
        </p>
        <p className="text-lg md:text-xl mb-2 text-center leading-tight mb-4">
          どのレベルまで解ける？レベルを選んでね！
        </p>
        <div className="flex flex-wrap justify-center gap-2 md:gap-5">
          <Link href="/quizzes/level/easy">
            <button className="text-xl md:text-2xl px-3 py-1 md:px-5 md:py-2 bg-white border-2 border-black rounded-full font-bold hover:scale-105 transition-all">
              かんたん
            </button>
          </Link>

          <Link href="/quizzes/level/normal">
            <button className="text-xl md:text-2xl px-3 py-1 md:px-5 md:py-2 bg-white border-2 border-black rounded-full font-bold hover:scale-105 transition-all">
              ふつう
            </button>
          </Link>

          <Link href="/quizzes/level/hard">
            <button className="text-xl md:text-2xl px-3 py-1 md:px-5 md:py-2 bg-white border-2 border-black rounded-full font-bold hover:scale-105 transition-all">
              難しい
            </button>
          </Link>
        </div>
      </div>

      <div className="max-w-[700px] mx-auto border-2 border-black rounded-xl m-5 p-5 bg-gradient-to-b from-purple-0 via-purple-100 to-purple-200">
        <p className="text-2xl md:text-3xl font-bold mb-2 text-center leading-tight drop-shadow-xl text-purple-500">
          👑ゲームで遊ぶ👑
        </p>
        <p className="text-lg md:text-xl mb-2 text-center leading-tight mb-4">
          腕試しをしたい人にオススメ！
        </p>
        <div className="flex justify-center gap-3 md:gap-5 flex-wrap">
          {/* 連続正解チャレンジ */}
          <div className="text-center max-w-[260px] mb-3 md:mb-0">
            <Link href="/streak-challenge" className="w-full md:w-auto flex justify-center">
              <button className="w-[220px] md:w-[260px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-gradient-to-r from-red-500 to-orange-400 text-white hover:scale-110 transition-all">
                連続正解チャレンジ
              </button>
            </Link>
            <p className="mt-2 text-sm md:text-base text-gray-700 leading-tight">
              何問連続で正解できるか挑戦！
            </p>
            <p className="text-sm md:text-base text-gray-700 leading-tight">
              集中力と実力を試せるゲームです。
            </p>
          </div>
          {/* クイズダンジョン */}
          <div className="text-center max-w-[260px]">
            <Link href="/quiz-master" className="w-full md:w-auto flex justify-center">
              <button className="w-[220px] md:w-[260px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-gradient-to-r from-purple-500 to-indigo-400 text-white hover:scale-110 transition-all">
                クイズダンジョン
              </button>
            </Link>
            <p className="mt-2 text-sm md:text-base text-gray-700 leading-tight">
              ダンジョン形式で進む本格派クイズ。
            </p>
            <p className="text-sm md:text-base text-gray-700 leading-tight">
              君は深層まで進めるか！？
            </p>
          </div>
          {/* 時間制限クイズ */}
          <div className="text-center max-w-[260px]">
            <Link href="/time-quiz" className="w-full md:w-auto flex justify-center">
              <button className="w-[220px] md:w-[260px] px-4 md:px-6 text-xl md:text-2xl py-2 border-2 border-black rounded-full font-bold shadow-xl bg-gradient-to-r from-[#4A0000] via-[#8B0000] to-[#D40000] text-white hover:scale-110 transition-all">
                時間制限クイズ
              </button>
            </Link>
            <p className="mt-2 text-sm md:text-base text-gray-700 leading-tight">
              時間内に何問正解できるかな？
            </p>
            <p className="text-sm md:text-base text-gray-700 leading-tight">
              友達や家族と対決してみよう！
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
