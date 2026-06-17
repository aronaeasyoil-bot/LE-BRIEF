import { describe, expect, it } from "vitest";
import {
  buildReutersImageSearchCandidates,
  parseReutersNewsSitemapXml,
  parseSitemapIndexXml,
} from "./_core/reutersEnergy";

describe("Reuters automation parsers", () => {
  it("parses Reuters sitemap indexes", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://www.reuters.com/arc/outboundfeeds/news-sitemap/?outputType=xml</loc>
  </sitemap>
  <sitemap>
    <loc>https://www.reuters.com/arc/outboundfeeds/news-sitemap-2/?outputType=xml</loc>
  </sitemap>
</sitemapindex>`;

    expect(parseSitemapIndexXml(xml)).toEqual([
      "https://www.reuters.com/arc/outboundfeeds/news-sitemap/?outputType=xml",
      "https://www.reuters.com/arc/outboundfeeds/news-sitemap-2/?outputType=xml",
    ]);
  });

  it("parses Reuters news sitemap article metadata", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>https://www.reuters.com/business/energy/example-energy-story-2026-06-14/</loc>
    <lastmod>2026-06-14T06:00:00Z</lastmod>
    <news:news>
      <news:publication>
        <news:name>Reuters</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>2026-06-14T05:30:00Z</news:publication_date>
      <news:title><![CDATA[Example Energy Story]]></news:title>
      <news:keywords>oil, OPEC, Africa</news:keywords>
      <news:stock_tickers>NYSE:CVX</news:stock_tickers>
    </news:news>
    <image:image>
      <image:loc>https://example.com/image.jpg</image:loc>
    </image:image>
  </url>
</urlset>`;

    const [article] = parseReutersNewsSitemapXml(xml);

    expect(article.loc).toBe("https://www.reuters.com/business/energy/example-energy-story-2026-06-14/");
    expect(article.title).toBe("Example Energy Story");
    expect(article.publishedAt).toBe("2026-06-14T05:30:00Z");
    expect(article.lastmod).toBe("2026-06-14T06:00:00Z");
    expect(article.keywords).toEqual(["oil", "OPEC", "Africa"]);
    expect(article.stockTickers).toEqual(["NYSE:CVX"]);
    expect(article.metadata).toEqual({
      imageUrls: ["https://example.com/image.jpg"],
    });
  });

  it("builds title-driven image search candidates", () => {
    const candidates = buildReutersImageSearchCandidates({
      categorySlug: "petrole-gaz",
      imageQuery: "oil refinery at sunset",
      keywords: ["oil", "Nigeria", "refinery"],
      sourceSummary: "Nigeria refinery output and fuel supply tensions",
      sourceTitle: "Nigeria boosts refinery output as fuel tensions ease",
    });

    expect(candidates[0]).toBe("oil refinery at sunset");
    expect(candidates.some((candidate) => candidate.startsWith("nigeria boosts refinery output"))).toBe(true);
    expect(candidates).toContain("oil nigeria refinery");
    expect(candidates).toContain("oil refinery energy industry africa");
  });
});
