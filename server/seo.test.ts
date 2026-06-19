import { describe, expect, it } from "vitest";
import { buildNewsSitemapXml, buildRobotsTxt, buildRssXml, buildSitemapXml, renderArticleHtml, renderMagazineHtml } from "./_core/seo";

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
      metaDescription: "Meta description de test",
      publishedAt: "2026-06-05T00:00:00.000Z",
      sourceName: "Reuters",
      sourceUrl: "https://www.reuters.com/business/energy/test-source/",
      tags: "energie, afrique",
      titleFr: "Article test",
      updatedAt: "2026-06-05T12:00:00.000Z",
    });

    expect(html).toContain("Article test | LE BRIEF");
    expect(html).toContain('property="og:type"');
    expect(html).toContain("https://www.lebrief.energy/article/42");
    expect(html).toContain("https://www.lebrief.energy/manus-storage/le-brief/images/test.jpg");
    expect(html).toContain('"@type":"NewsArticle"');
    expect(html).toContain("Awa Ndiaye");
    expect(html).toContain('property="article:published_time"');
    expect(html).toContain('rel="alternate"');
    expect(html).toContain("Meta description de test");
    expect(html).toContain("Source initiale");
    expect(html).toContain("https://www.reuters.com/business/energy/test-source/");
  });

  it("renders magazine-specific metadata and cover preview", () => {
    const html = renderMagazineHtml(template, {
      coverImageUrl: "/manus-storage/le-brief/covers/magazine-88.jpg",
      id: 88,
      issueNumber: 88,
      pdfUrl: "/manus-storage/le-brief/pdfs/magazine-88.pdf",
      publishedAt: "2026-06-19T00:00:00.000Z",
      titleFr: "LE BRIEF - Edition speciale Senegal",
      updatedAt: "2026-06-19T12:00:00.000Z",
    });

    expect(html).toContain("LE BRIEF - Edition speciale Senegal | LE BRIEF");
    expect(html).toContain("https://www.lebrief.energy/magazine/88");
    expect(html).toContain("https://www.lebrief.energy/manus-storage/le-brief/covers/magazine-88.jpg");
    expect(html).toContain('"@type":"PublicationIssue"');
    expect(html).toContain("Numero 88");
    expect(html).toContain("Telecharger le PDF");
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

  it("builds a news sitemap for recent articles only", () => {
    const xml = buildNewsSitemapXml([
      {
        id: 42,
        language: "fr",
        publishedAt: new Date().toISOString(),
        titleFr: "Titre actualite",
      },
      {
        id: 43,
        language: "fr",
        publishedAt: "2026-01-01T00:00:00.000Z",
        titleFr: "Ancienne actualite",
      },
    ]);

    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">')).toBe(true);
    expect(xml).toContain("<news:name>LE BRIEF</news:name>");
    expect(xml).toContain("<loc>https://www.lebrief.energy/article/42</loc>");
    expect(xml).not.toContain("<loc>https://www.lebrief.energy/article/43</loc>");
  });

  it("builds an RSS feed and robots.txt", () => {
    const rss = buildRssXml([
      {
        authorName: "LE BRIEF",
        categoryName: "Energie",
        id: 42,
        imageUrl: "/manus-storage/le-brief/images/test.jpg",
        publishedAt: "2026-06-05T00:00:00.000Z",
        titleFr: "Titre RSS",
      },
    ]);
    const robots = buildRobotsTxt();

    expect(rss.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"')).toBe(true);
    expect(rss).toContain("<title>Titre RSS</title>");
    expect(rss).toContain("<link>https://www.lebrief.energy/article/42</link>");
    expect(rss).toContain('atom:link href="https://www.lebrief.energy/rss.xml"');
    expect(robots).toContain("Sitemap: https://www.lebrief.energy/sitemap.xml");
    expect(robots).toContain("Sitemap: https://www.lebrief.energy/news-sitemap.xml");
  });
});
