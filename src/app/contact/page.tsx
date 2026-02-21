'use client';

import { useState } from 'react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(false);
    setError('');

    if (!name || !email || !message) {
      setError('すべての項目を入力してください。');
      return;
    }

    if (!validateEmail(email)) {
      setError('有効なメールアドレスを入力してください。');
      return;
    }

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });

      if (!res.ok) throw new Error('送信に失敗しました');

      setSubmitted(true);
      setName('');
      setEmail('');
      setMessage('');
    } catch (err) {
      setError('送信中にエラーが発生しました');
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-xl p-8 sm:p-12">
      <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 mb-6 text-center">お問い合わせ</h1>
      <p className="text-lg sm:text-xl text-center mb-5">
        サイト、クイズに関するご意見などありましたらご記入ください。
      </p>

      <form className="max-w-2xl mx-auto" onSubmit={handleSubmit}>
        <div className="mb-6">
          <label htmlFor="name" className="block text-gray-700 font-bold mb-2 text-lg">お名前</label>
          <input
            type="text"
            id="name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="email" className="block text-gray-700 font-bold mb-2 text-lg">メールアドレス</label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
          />
        </div>

        <div className="mb-8">
          <label htmlFor="message" className="block text-gray-700 font-bold mb-2 text-lg">メッセージ</label>
          <textarea
            id="message"
            name="message"
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
          />
        </div>

        {error && <p className="text-center text-red-600 font-bold mb-4">{error}</p>}

        <div className="text-center">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transform hover:scale-105 transition-transform"
          >
            送信
          </button>
        </div>
      </form>

      {submitted && (
        <p className="text-center mt-8 font-bold text-xl">
          送信しました！
        </p>
      )}
    </div>
  );
}
