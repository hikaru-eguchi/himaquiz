'use client';

import { useState } from 'react';

export default function PrivacyPage() {
const sections = [
    { id: 'purpose', title: '1. 個人情報の利用目的' },
    { id: 'ads', title: '2. 広告について' },
    { id: 'analytics', title: '3. アクセス解析ツールについて' },
    { id: 'disclaimer', title: '4. 免責事項' },
    { id: 'copyright', title: '5. 著作権について' },
    { id: 'policy-change', title: '6. プライバシーポリシーの変更について' },
  ];

  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="bg-white shadow-lg rounded-xl p-12">
      <h1 className="text-5xl font-extrabold text-gray-900 mb-8 text-center">プライバシーポリシー</h1>
      
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
        <h2 className="text-3xl font-bold text-gray-800 mt-5 mb-4">プライバシーポリシー</h2>
        <p>
          「トレンドラボ」（以下、当サイト）では、訪問者のプライバシー情報を適切に保護し、取り扱うことを大切にしています。当サイトのプライバシーポリシーを以下の通り定めます。
        </p>
        <h3 id="purpose">1. 個人情報の利用目的</h3>
        <p>
          当サイトでは、お問い合わせや記事へのコメントの際に、お名前やメールアドレスなどの個人情報をご入力いただく場合があります。これらの個人情報は、ご質問への回答や必要な情報を電子メール等でご連絡する目的以外には利用いたしません。
        </p>
        <h3 id="ads">2. 広告について</h3>
        <p>
          当サイトは、第三者配信の広告サービス（Google AdSenseなど）を利用しています。これらの広告配信事業者は、訪問者の興味に応じた広告を表示するために、Cookie（クッキー）を使用することがあります。Cookieには氏名や住所、メールアドレスなどの個人情報は含まれません。Cookieを無効にする設定およびGoogle AdSenseに関する詳細は、<a href="https://policies.google.com/technologies/ads?hl=ja" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">Googleのポリシーと規約ページ</a>をご覧ください。
        </p>
        <h3 id="analytics">3. アクセス解析ツールについて</h3>
        <p>
          当サイトでは、Googleによるアクセス解析ツール「Googleアナリティクス」を利用する場合があります。Googleアナリティクスは、トラフィックデータの収集のためにCookieを使用しています。このトラフィックデータは匿名で収集されており、個人を特定するものではありません。この機能はクッキーを無効にすることで収集を拒否することが出来ますので、お使いのブラウザの設定をご確認ください。この規約に関しての詳細は、<a href="https://marketingplatform.google.com/about/analytics/terms/jp/" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">Googleアナリティクスサービス利用規約のページ</a>や<a href="https://policies.google.com/technologies/ads?hl=ja" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">Googleポリシーと規約ページ</a>をご覧ください。
        </p>
        <h3 id="disclaimer">4. 免責事項</h3>
        <p>
          当サイトからリンクやバナーなどによって他のサイトに移動された場合、移動先サイトで提供される情報・サービス等について一切の責任を負いません。当サイトに掲載している内容について、できる限り正確な情報を提供するよう努めていますが、誤情報が入り込んだり、情報が古くなっている可能性があります。当サイトに掲載された内容によって生じた損害等の一切の責任を負いかねますのでご了承ください。
        </p>
        <h3 id="copyright">5. 著作権について</h3>
        <p>
          当サイトに掲載されている文章や画像等の著作物の無断転載を禁止します。引用の際は、引用元としての明記をお願いいたします。
        </p>
        <h3 id="policy-change">6. プライバシーポリシーの変更について</h3>
        <p>
          当サイトは、個人情報に関して適用される日本の法令を遵守するとともに、本ポリシーの内容を適宜見直し、改善に努めます。修正された最新のプライバシーポリシーは常に本ページにて開示されます。
        </p>
      </div>
    </div>
  );
}
