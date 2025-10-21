export default function ProfilePage() {
  return (
    <div className="bg-white shadow-lg rounded-xl p-12">
      <h1 className="text-5xl font-extrabold text-gray-900 mb-6 text-center">プロフィール</h1>
      <div className="prose prose-lg max-w-none mx-auto text-gray-600 text-center">
        <p>ここにあなたのプロフィールが入ります。</p>
        <p>経歴や趣味など、自己紹介を自由に記述してください。</p>
      </div>
    </div>
  );
}
