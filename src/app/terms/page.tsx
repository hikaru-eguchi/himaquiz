"use client";

import { useState } from "react";

export default function TermsPage() {
  const sections = [
    { id: "intro", title: "1. はじめに" },
    { id: "prohibited", title: "2. 禁止事項" },
    { id: "content", title: "3. 投稿コンテンツについて" },
    { id: "operation", title: "4. 運営の対応" },
    { id: "disclaimer", title: "5. 免責事項" },
    { id: "revision", title: "6. 規約の変更" },
  ];

  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="bg-white shadow-lg rounded-xl p-8 sm:p-12">
      <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 mb-8 text-center">
        利用規約
      </h1>

      {/* 目次 */}
      <div className="mx-auto border rounded-lg p-4 w-full max-w-md">
        <div className="flex justify-center items-center mb-2 space-x-4">
          <div className="text-2xl font-bold">目次</div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-600 hover:text-gray-900 font-bold"
          >
            {isOpen ? "[閉じる]" : "[開く]"}
          </button>
        </div>

        {isOpen && (
          <ul className="list-none space-y-2 text-left flex flex-col items-center">
            {sections.map((sec) => (
              <li key={sec.id}>
                <a href={`#${sec.id}`} className="hover:underline">
                  {sec.title}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="prose prose-lg max-w-3xl mx-auto text-gray-700">

        <h2 id="intro" className="text-3xl font-bold text-gray-800 mt-8 mb-4">
          はじめに
        </h2>

        <p>
          この利用規約（以下、「本規約」といいます。）は、「ひまQ」（以下、「当サイト」といいます。）をご利用いただく際の条件を定めるものです。
        </p>

        <p>
          当サイトをご利用いただいた時点で、本規約に同意いただいたものとみなします。
        </p>

        <h2
          id="prohibited"
          className="text-3xl font-bold text-gray-800 mt-8 mb-4"
        >
          禁止事項
        </h2>

        <p>
          当サイトでは、すべての利用者が安心して楽しめる環境を維持するため、以下の行為を禁止します。
        </p>

        <ul>
          <li>暴言、誹謗中傷、嫌がらせ行為</li>
          <li>脅迫や威圧的な表現</li>
          <li>差別的・侮辱的な表現</li>
          <li>性的・過激・公序良俗に反する内容</li>
          <li>他人の個人情報の投稿・公開</li>
          <li>広告・宣伝・勧誘・スパム行為</li>
          <li>他人になりすます行為</li>
          <li>法令に違反する行為、またはそのおそれのある行為</li>
          <li>その他、運営が不適切と判断する行為</li>
        </ul>

        <h2
          id="content"
          className="text-3xl font-bold text-gray-800 mt-8 mb-4"
        >
          投稿コンテンツについて
        </h2>

        <p>
          ユーザーは、以下を含む投稿機能を利用する際、本規約を遵守するものとします。
        </p>

        <ul>
          <li>プレゼントメッセージ</li>
          <li>自作クイズ</li>
          <li>プロフィール</li>
          <li>ユーザー名</li>
          <li>その他、ユーザーが投稿・入力する内容</li>
        </ul>

        <p>
          投稿内容については、投稿者自身が責任を負うものとします。
        </p>

        <h2
          id="operation"
          className="text-3xl font-bold text-gray-800 mt-8 mb-4"
        >
          運営の対応
        </h2>

        <p>
          プレゼントメッセージ、自作クイズ、プロフィール、ユーザー名その他ユーザーが投稿した内容について、運営が不適切と判断した場合は、予告なく削除・非公開・編集・利用制限等の対応を行う場合があります。
        </p>

        <p>悪質な場合には、以下の対応を行うことがあります。</p>

        <ul>
          <li>投稿の削除・編集・非公開</li>
          <li>一部機能の利用制限</li>
          <li>アカウントの停止・削除</li>
          <li>必要に応じて関係機関への通報</li>
        </ul>

        <h2
          id="disclaimer"
          className="text-3xl font-bold text-gray-800 mt-8 mb-4"
        >
          免責事項
        </h2>

        <p>
          当サイトは、掲載内容およびユーザーが投稿した内容について、その正確性・完全性・安全性を保証するものではありません。
        </p>

        <p>
          当サイトの利用により生じたいかなる損害についても、運営は故意または重大な過失がある場合を除き、責任を負いません。
        </p>

        <h2
          id="revision"
          className="text-3xl font-bold text-gray-800 mt-8 mb-4"
        >
          規約の変更
        </h2>

        <p>
          本規約は、必要に応じて予告なく変更することがあります。
        </p>

        <p>
          変更後の利用規約は、当サイトへ掲載した時点から効力を生じるものとします。
        </p>

        <p className="mt-10 text-sm text-gray-500 text-right">
          最終更新日：2026年6月30日
        </p>

      </div>
    </div>
  );
}