import { describe, expect, it } from "vitest";
import { buildSitemapXml, renderArticleHtml } from "./_core/seo";

const template = `<!doctype html>
<html lang="en">
  <head>
    <!-- LE_BRIEF_SEO_START -->
    <title>Default</title>
    <!-- LE_BRIEF_SEO_END -->
  </head>
  <body>
    <div id="root"><!-- LE_BRIEF_APP_FALLBACK --></div>
  </body>
</html>`;

describe("seo helpers", () => {
  it("renders article-specific metadata and fallback body", () => {
    const html = renderArticleHtml(template, {
      authorName: "Awa Ndiaye",
      contentFr: "Contenu de test pour l'article.",
      excerptFr: "Resume de test",
      id: 42,
      imageUrl: "/manus-storage/le-brief/images/test.jpg",
      publishedAt: "2026-06-05T00:00:00.000Z",
      titleFr: "Article test",
      updatedAt: "2026-06-05T12:00:00.000Z",
    });

    expect(html).toContain("Article test | LE BRIEF");
    expect(html).toContain('property="og:type"');
    expect(html).toContain("https://www.lebrief.energy/article/42");
    expect(html).toContain("https://www.lebrief.energy/manus-storage/le-brief/images/test.jpg");
    expect(html).toContain('"@type":"NewsArticle"');
    expect(html).toContain("Awa Ndiaye");
  });

  it("builds a sitemap containing canonical URLs", () => {
    const xml = buildSitemapXml([
      {
        changefreq: "daily",
        lastmod: "2026-06-05T00:00:00.000Z",
        loc: "https://www.lebrief.energy/",
        priority: 1,
      },
      {
        changefreq: "weekly",
        loc: "https://www.lebrief.energy/article/42",
        priority: 0.9,
      },
    ]);

    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')).toBe(true);
    expect(xml).toContain("<loc>https://www.lebrief.energy/</loc>");
    expect(xml).toContain("<loc>https://www.lebrief.energy/article/42</loc>");
    expect(xml).toContain("<lastmod>2026-06-05</lastmod>");
    expect(xml).toContain("<changefreq>daily</changefreq>");
  });
});
