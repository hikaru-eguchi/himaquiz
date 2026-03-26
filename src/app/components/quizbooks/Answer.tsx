export default function Answer({ children }: { children: React.ReactNode }) {
  return (
    <details className="
      inline-block
      rounded-2xl
      border-2 border-black
      bg-gradient-to-r from-yellow-100 via-orange-100 to-pink-100
      px-5 py-3
      shadow-[0_4px_0_0_#000]
    ">
      <summary className="cursor-pointer font-extrabold select-none md:text-xl">
        答えを見る
      </summary>
      <div className="mt-2 text-2xl md:text-3xl font-bold">{children}</div>
    </details>
  );
}
