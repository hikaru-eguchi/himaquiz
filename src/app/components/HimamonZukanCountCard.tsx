type Props = {
  count: number | null;
  total?: number;
};

export default function HimamonZukanCountCard({ count, total = 80 }: Props) {
  if (count === null) return null;

  return (
    <div className="mx-auto mb-4 max-w-[360px] rounded-2xl border-2 border-yellow-400 bg-white px-4 py-3 shadow">
      <p className="text-sm md:text-base font-bold text-gray-600">
        📖 あつめたひまもん
      </p>
      <p className="text-3xl md:text-4xl font-black text-yellow-600">
        {count}/{total}
      </p>
    </div>
  );
}