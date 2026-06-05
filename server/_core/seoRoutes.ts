import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getAllCategories, getArticleById, getPublishedArticles, getPublishedEvents } from "../db";
import { buildSitemapXml, renderArticleHtml, SITE_URL, type SitemapUrl } from "./seo";

let templatePromise: Promise<string> | null = null;

async function loadAppTemplate() {
  if (!templatePromise) {
    templatePromise = (async () => {
      const runtimeDir = path.dirname(fileURLToPath(import.meta.url));
      const candidates = [
        path.resolve(runtimeDir, "public", "index.html"),
        path.resolve(process.cwd(), "dist", "public", "index.html"),
      ];

      for (const candidate of candidates) {
        try {
          return await fs.readFile(candidate, "utf-8");
        } catch {
          // Try the next candidate.
        }
      }

      throw new Error("Unable to load app HTML template");
    })();
  }

  return templatePromise;
}

const STATIC_SITEMAP_URLS: SitemapUrl[] = [
  { loc: `${SITE_URL}/`, priority: 1.0, changefreq: "daily" },
  { loc: `${SITE_URL}/about`, priority: 0.7, changefreq: "monthly" },
  { loc: `${SITE_URL}/events`, priority: 0.8, changefreq: "weekly" },
  { loc: `${SITE_URL}/legal`, priority: 0.3, changefreq: "monthly" },
  { loc: `${SITE_URL}/privacy`, priority: 0.3, changefreq: "monthly" },
];

function getLatestEventUpdate(events: Array<{ eventDate?: Date | string | null; updatedAt?: Date | string | null }>) {
  return events.reduce<Date | string | null | undefined>((latest, event) => {
    const candidate = event.updatedAt || event.eventDate;
    if (!candidate) {
      return latest;
    }

    if (!latest) {
      return candidate;
    }

    return new Date(candidate).getTime() > new Date(latest).getTime() ? candidate : latest;
  }, undefined);
}

function resolveSettled<T>(label: string, result: PromiseSettledResult<T>, fallback: T) {
  if (result.status === "fulfilled") {
    return result.value;
  }

  console.error(`[SEO] ${label} fetch failed:`, result.reason);
  return fallback;
}

function writeXmlResponse(res: any, xml: string) {
  res.statusCode = 200;
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=900, stale-while-revalidate=86400");
  res.setHeader("Content-Type", "application/xml");
  res.end(xml, "utf-8");
}

export function registerSeoRoutes(app: any) {
  app.get(["/api/render-article", "/article/:id"], async (req: any, res: any) => {
    const articleId = Number(req.params?.id || req.query.id);

    if (!Number.isInteger(articleId) || articleId <= 0) {
      res.status(400).send("Invalid article id");
      return;
    }

    try {
      const [template, article] = await Promise.all([loadAppTemplate(), getArticleById(articleId)]);

      if (!article) {
        res.status(404).type("html").send(template);
        return;
      }

      res.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=86400");
      res.type("html").send(renderArticleHtml(template, article));
    } catch (error) {
      console.error("[SEO] Article render failed:", error);
      res.status(500).send("Article render failed");
    }
  });

  app.get(["/api/sitemap", "/sitemap.xml"], async (_req: any, res: any) => {
    try {
      const [articlesResult, categoriesResult, eventsResult] = await Promise.allSettled([
        getPublishedArticles(),
        getAllCategories(),
        getPublishedEvents(),
      ]);

      const articles = resolveSettled("Published articles", articlesResult, []);
      const categories = resolveSettled("Categories", categoriesResult, []);
      const events = resolveSettled("Published events", eventsResult, []);
      const latestEventUpdate = getLatestEventUpdate(events);

      const urls = [
        ...STATIC_SITEMAP_URLS.map((entry) =>
          entry.loc.endsWith("/events") ? { ...entry, lastmod: latestEventUpdate } : entry,
        ),
        ...categories.map((category) => ({
          loc: `${SITE_URL}/category/${category.slug}`,
          changefreq: "weekly" as const,
          lastmod: category.createdAt,
          priority: 0.6,
        })),
        ...articles.map((article) => ({
          loc: `${SITE_URL}/article/${article.id}`,
          changefreq: "weekly" as const,
          lastmod: article.updatedAt || article.publishedAt,
          priority: 0.9,
        })),
      ];

      writeXmlResponse(res, buildSitemapXml(urls));
    } catch (error) {
      console.error("[SEO] Sitemap render failed:", error);
      writeXmlResponse(res, buildSitemapXml(STATIC_SITEMAP_URLS));
    }
  });
}
