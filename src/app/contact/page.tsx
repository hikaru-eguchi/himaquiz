export default function ContactPage() {
  return (
    <div className="bg-white shadow-lg rounded-xl p-12">
      <h1 className="text-5xl font-extrabold text-gray-900 mb-8 text-center">お問い合わせ</h1>
      <form className="max-w-2xl mx-auto">
        <div className="mb-6">
          <label htmlFor="name" className="block text-gray-700 font-bold mb-2 text-lg">お名前</label>
          <input type="text" id="name" name="name" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand" />
        </div>
        <div className="mb-6">
          <label htmlFor="email" className="block text-gray-700 font-bold mb-2 text-lg">メールアドレス</label>
          <input type="email" id="email" name="email" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand" />
        </div>
        <div className="mb-8">
          <label htmlFor="message" className="block text-gray-700 font-bold mb-2 text-lg">メッセージ</label>
          <textarea id="message" name="message" rows={5} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"></textarea>
        </div>
        <div className="text-center">
          <button type="submit" className="bg-brand text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-dark transition-transform transform hover:scale-105">
            送信
          </button>
        </div>
      </form>
    </div>
  );
}
