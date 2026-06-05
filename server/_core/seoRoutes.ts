import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getAllCategories, getArticleById, getPublishedArticles, getPublishedEvents } from "../db";
import { buildSitemapXml, renderArticleHtml, SITE_URL } from "./seo";

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
      const [articles, categories, events] = await Promise.all([
        getPublishedArticles(),
        getAllCategories(),
        getPublishedEvents(),
      ]);
      const latestEventUpdate = events.reduce<Date | string | null | undefined>((latest, event) => {
        const candidate = event.updatedAt || event.eventDate;
        if (!candidate) {
          return latest;
        }

        if (!latest) {
          return candidate;
        }

        return new Date(candidate).getTime() > new Date(latest).getTime() ? candidate : latest;
      }, undefined);

      const urls = [
        { loc: `${SITE_URL}/`, priority: 1.0, changefreq: "daily" as const },
        { loc: `${SITE_URL}/about`, priority: 0.7, changefreq: "monthly" as const },
        { loc: `${SITE_URL}/events`, priority: 0.8, changefreq: "weekly" as const, lastmod: latestEventUpdate },
        { loc: `${SITE_URL}/legal`, priority: 0.3, changefreq: "monthly" as const },
        { loc: `${SITE_URL}/privacy`, priority: 0.3, changefreq: "monthly" as const },
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

      res.set("Cache-Control", "public, s-maxage=900, stale-while-revalidate=86400");
      res.type("application/xml").send(buildSitemapXml(urls));
    } catch (error) {
      console.error("[SEO] Sitemap render failed:", error);
      res.status(500).send("Sitemap render failed");
    }
  });
}
