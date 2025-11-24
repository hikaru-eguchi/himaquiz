"use client";

import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string; // 例: "/posts" や "/favorites"
}

export default function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  const prevPage = currentPage > 1 ? currentPage - 1 : 1;
  const nextPage = currentPage < totalPages ? currentPage + 1 : totalPages;

  return (
    <div className="flex justify-center items-center gap-4 my-6">
      {/* 前へ */}
      <Link
        href={`${basePath}?page=${prevPage}`}
        className={`px-4 py-2 rounded bg-gray-200 ${
          currentPage === 1 ? "opacity-50 pointer-events-none" : ""
        }`}
      >
        前へ
      </Link>

      {/* ページ番号 */}
      <span>
        {currentPage} / {totalPages}
      </span>

      {/* 次へ */}
      <Link
        href={`${basePath}?page=${nextPage}`}
        className={`px-4 py-2 rounded bg-gray-200 ${
          currentPage === totalPages ? "opacity-50 pointer-events-none" : ""
        }`}
      >
        次へ
      </Link>
    </div>
  );
}
