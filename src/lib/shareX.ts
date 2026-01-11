// lib/shareX.ts
export function openXShare(params: {
  text: string;
  url?: string; // 省略可
}) {
  const shareUrl = new URL("https://twitter.com/intent/tweet");
  shareUrl.searchParams.set("text", params.text);
  if (params.url) shareUrl.searchParams.set("url", params.url);
  window.open(shareUrl.toString(), "_blank", "noopener,noreferrer");
}

export function getSiteUrl() {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.hima-quiz.com";
  return raw.replace(/\/+$/, "");
}

export function buildTopUrl() {
  const siteUrl = getSiteUrl();
  return `${siteUrl}/`;
}
