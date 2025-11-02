'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function PrivacyPage() {
const sections = [
    { id: 'name', title: '1. 運営者プロフィール' },
    { id: 'sitename', title: '2. サイト名' },
    { id: 'otoiawase', title: '3. お問い合わせ' },
    { id: 'koukoku', title: '4. 広告について' },
    { id: 'menseki', title: '5. 免責事項' },
    { id: 'privacy', title: '6. プライバシーポリシー' },
  ];

  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="bg-white shadow-lg rounded-xl p-12">
      <h1 className="text-5xl font-extrabold text-gray-900 mb-8 text-center">サイト紹介</h1>
      
      {/* 目次 */}
      <div className="mx-auto border rounded-lg p-4 w-full max-w-md">
        <div className="flex justify-center items-center mb-2 space-x-4">
          <div className="text-2xl font-bold text-center mb-2">目次</div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-600 hover:text-gray-900 font-bold"
          >
            {isOpen ? '[閉じる]' : '[開く]'}
          </button>
        </div>
        <div className="flex justify-center items-center mb-2 space-x-4">
          {isOpen && (
            <ul className="list-none space-y-2 text-left">
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
      </div>
      
      <div className="prose prose-lg max-w-3xl mx-auto text-gray-600">
        <h2 id="name" className="text-3xl font-bold text-gray-800 mt-5 mb-4">運営者プロフィール</h2>
        <Image
          src="/images/man.png"
          alt="男性の写真"
          width={160}       // 横幅
          height={160}      // 高さ
          quality={100}
          className="profile-img"
        />
        <p>
          ひかる：20代独身男性。甘いものが大好きで、特にアイスは一日に5つ食べることもある。インドアな性格で、休みの日もずっと家にいる。運動は苦手（一応元バスケ部）。
        </p>
        <p>
          当サイトでは、話題の役立つ情報をわかりやすく、気軽に読める形でお届けしていきます。
        </p>
        <h2 id="sitename" className="text-3xl font-bold text-gray-800 mt-5 mb-4">サイト名</h2>
        <p>
          サイト名は「トレンドラボ」（
          <a 
            href="https://www.trendlab.jp/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-blue-600 hover:underline"
          >
            https://www.trendlab.jp/
          </a>
          ）と言います。
        </p>
        <p>このサイトは、最新のトレンドや役立つ情報を、どこよりも分かりやすく解説することを目的としたウェブサイトです。</p>
        <h2 id="otoiawase" className="text-3xl font-bold text-gray-800 mt-5 mb-4">お問い合わせ</h2>
        <p>
          ご意見・ご感想・ご質問などがありましたら、以下👇のお問い合わせフォームよりご連絡ください。
        </p>
        {/* contact ページへのリンク */}
        <Link href="/contact">
          <button className="px-4 py-2 rounded hover:underline">
            お問い合わせページ
          </button>
        </Link>
        <h2 id="okukoku" className="text-3xl font-bold text-gray-800 mt-5 mb-4">広告について</h2>
        <p>
          「当サイトでは、一部の記事にてアフィリエイト広告（成果報酬型広告）を利用しています。購入等に関しては、リンク先の公式サイトの情報をご確認の上、ご判断をお願いいたします。
        </p>
        <h2 id="menseki" className="text-3xl font-bold text-gray-800 mt-5 mb-4">免責事項</h2>
        <p>
          掲載内容には十分注意を払っていますが、情報の正確性・安全性を保証するものではありません。商品の購入やサービスの利用などはご自身の責任でお願いいたします。
        </p>
        <h2 id="privacy" className="text-3xl font-bold text-gray-800 mt-5 mb-4">プライバシーポリシー</h2>
        <p>
          プライバシーポリシーについては、以下👇のリンクからご覧ください。
        </p>
        {/* privacy ページへのリンク */}
        <Link href="/privacy">
          <button className="px-4 hover:underline">
            プライバシーポリシー
          </button>
        </Link>
      </div>
    </div>
  );
}
