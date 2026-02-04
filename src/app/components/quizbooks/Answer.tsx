export default function Answer({ children }: { children: React.ReactNode }) {
  return (
    <details className="my-3 rounded-xl border-2 border-black bg-white p-3">
      <summary className="cursor-pointer font-extrabold select-none md:text-xl">
        答えを見る
      </summary>
      <div className="mt-2 text-2xl md:text-3xl font-bold">{children}</div>
    </details>
  );
}
