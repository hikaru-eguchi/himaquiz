// ArticleMDXWrapper.tsx
"use client";

import ArticleMDX from "./ArticleMDX";

export default function ArticleMDXWrapper({ mdxSource }: { mdxSource: any }) {
  return <ArticleMDX mdxSource={mdxSource} />;
}
