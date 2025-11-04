"use client";

import { useEffect, useState } from "react";

type Props = {
  content: string;
};

type Heading = {
  id: string;
  text: string;
  level: number;
};

export default function TableOfContents({ content }: Props) {
  const [headings, setHeadings] = useState<Heading[]>([]);

  useEffect(() => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, "text/html");

    // ✅ h2タグだけ取得
    const elements = Array.from(doc.querySelectorAll("h2"));

    const headingList = elements
      .filter((el) => {
        const text = el.textContent?.trim() || "";
        return text !== "" && text !== "目次";
      })
      .map((el, index) => ({
        id:
          el.id ||
          el.textContent?.replace(/\s+/g, "-").toLowerCase() + `-${index}` ||
          `heading-${index}`,
        text: el.textContent || "",
        level: 2,
      }));

    setHeadings(headingList);
  }, [content]);

  if (headings.length === 0) return null;

  return (
    <nav className="border border-black rounded-lg p-4 my-6 bg-white max-w-[50%] mx-auto">
      {/* タイトル部分 */}
      <p className="font-bold text-center text-2xl mb-3 border-b border-gray-400 pb-1">
        目次
      </p>

      {/* リスト部分 */}
      <ul className="text-lg space-y-2">
        {headings.map((h, index) => (
          <li key={h.id || index}>
            <a
              href={`#${h.id}`}
              className="block text-center hover:underline text-gray-700"
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
