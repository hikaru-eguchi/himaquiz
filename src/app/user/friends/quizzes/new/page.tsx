"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function FriendQuizNewPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [question, setQuestion] = useState("");
  const [choice1, setChoice1] = useState("");
  const [choice2, setChoice2] = useState("");
  const [choice3, setChoice3] = useState("");
  const [choice4, setChoice4] = useState("");
  const [correctChoice, setCorrectChoice] = useState(1);
  const [hint, setHint] = useState("");
  const [posting, setPosting] = useState(false);

  const submit = async () => {
    if (!question.trim()) {
      alert("問題を入力してください");
      return;
    }

    if (!choice1.trim() || !choice2.trim() || !choice3.trim() || !choice4.trim()) {
      alert("4つの答えを入力してください");
      return;
    }

    setPosting(true);

    const { error } = await supabase.rpc("create_friend_quiz", {
      p_question: question.trim(),
      p_choice_1: choice1.trim(),
      p_choice_2: choice2.trim(),
      p_choice_3: choice3.trim(),
      p_choice_4: choice4.trim(),
      p_correct_choice: correctChoice,
      p_hint: hint.trim(),
    });

    setPosting(false);

    if (error) {
      if (error.message.includes("daily quiz limit reached")) {
        alert("クイズ投稿は1日1回までです。");
        return;
      }

      alert(error.message || "投稿に失敗しました");
      return;
    }

    alert("クイズを公開しました！100Pゲット！");
    router.push("/user/friends");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-orange-50">
      <div className="mx-auto max-w-md p-4">
        <div className="text-center">
          <h1 className="text-2xl font-black text-gray-900">
            ✏️ クイズを投稿する
          </h1>

          <p className="mt-2 text-sm font-bold text-gray-500">
            1日1回だけ投稿できます。公開すると100Pゲット！
          </p>
        </div>

        <div className="mt-5 space-y-4 rounded-2xl bg-white p-4 shadow-sm">
          <div>
            <label className="text-sm font-black text-gray-700">
              問題（60文字まで）
            </label>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={60}
              placeholder="例：今日私が食べた朝ご飯は？"
              className="mt-1 w-full rounded-xl border px-3 py-3 font-bold"
            />
            <p className="mt-1 text-right text-xs text-gray-400">
              {question.length}/60
            </p>
          </div>

          {[1, 2, 3, 4].map((no) => {
            const value =
              no === 1
                ? choice1
                : no === 2
                  ? choice2
                  : no === 3
                    ? choice3
                    : choice4;

            const setter =
              no === 1
                ? setChoice1
                : no === 2
                  ? setChoice2
                  : no === 3
                    ? setChoice3
                    : setChoice4;

            return (
              <div key={no}>
                <label className="text-sm font-black text-gray-700">
                  答え{no}（20文字まで）
                </label>

                <div className="mt-1 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCorrectChoice(no)}
                    className={`w-16 rounded-xl text-xs font-black ${
                      correctChoice === no
                        ? "bg-green-500 text-white"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    正解にする
                  </button>

                  <input
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    maxLength={20}
                    placeholder={no === 1 ? "例：おにぎり" : `答え${no}`}
                    className="flex-1 rounded-xl border px-3 py-3 font-bold"
                  />
                </div>

                <p className="mt-1 text-right text-xs text-gray-400">
                  {value.length}/20
                </p>
              </div>
            );
          })}

          <div>
            <label className="text-sm font-black text-gray-700">
              ヒント（40文字まで・任意）
            </label>
            <input
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              maxLength={40}
              placeholder="例：手作りです"
              className="mt-1 w-full rounded-xl border px-3 py-3 font-bold"
            />
            <p className="mt-1 text-right text-xs text-gray-400">
              {hint.length}/40
            </p>
          </div>

          <button
            onClick={submit}
            disabled={posting}
            className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-orange-400 py-3 font-black text-white shadow-md hover:brightness-110 active:scale-95 disabled:opacity-50"
          >
            {posting ? "投稿中..." : "この内容で公開する"}
          </button>

          <button
            onClick={() => router.push("/user/friends")}
            className="w-full rounded-xl bg-gray-100 py-3 font-bold text-gray-700"
          >
            戻る
          </button>
        </div>
      </div>
    </div>
  );
}