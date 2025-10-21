export default function PrivacyPage() {
  return (
    <div className="bg-white shadow-lg rounded-xl p-12">
      <h1 className="text-5xl font-extrabold text-gray-900 mb-8 text-center">プライバシーポリシー</h1>
      <div className="prose prose-lg max-w-3xl mx-auto text-gray-600">
        <p>
          当サイトでは、第三者配信の広告サービス（Googleアドセンス）を利用しており、ユーザーの興味に応じた商品やサービスの広告を表示するため、クッキー（Cookie）を使用しております。クッキーを使用することで当サイトはお客様のコンピュータを識別できるようになりますが、お客様個人を特定できるものではありません。
        </p>
        <h2 className="text-3xl font-bold text-gray-800 mt-10 mb-4">アクセス解析ツールについて</h2>
        <p>
          当サイトでは、Googleによるアクセス解析ツール「Googleアナリティクス」を利用しています。このGoogleアナリティクスはトラフィックデータの収集のためにクッキーを使用しております。トラフィックデータは匿名で収集されており、個人を特定するものではありません。
        </p>
        <p>
          この機能はクッキーを無効にすることで収集を拒否することが出来ますので、お使いのブラウザの設定をご確認ください。この規約に関しての詳細は、<a href="https://marketingplatform.google.com/about/analytics/terms/jp/" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">Googleアナリティクスサービス利用規約のページ</a>や<a href="https://policies.google.com/technologies/ads?hl=ja" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">Googleポリシーと規約ページ</a>をご覧ください。
        </p>
      </div>
    </div>
  );
}
