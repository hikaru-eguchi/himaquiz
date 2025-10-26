/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://www.trendlab.jp', // ←あなたのサイトURL
  generateRobotsTxt: true,            // robots.txt も自動生成
  sitemapSize: 7000,                  // 1つのsitemapに含めるURL上限
  generateIndexSitemap: true,         // 複数sitemapに分割される場合はtrue推奨
  changefreq: 'weekly',               // 更新頻度のデフォルト値
  priority: 0.7,                      // ページ優先度のデフォルト値
};
