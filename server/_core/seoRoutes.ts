import fs from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";
import {
  getAllCategories,
  getArticleById,
  getMagazineById,
  getMagazinePaymentRequestByAccessToken,
  getMagazines,
  getPublishedArticles,
  getPublishedEvents,
} from "../db";
import {
  buildPreviewPdfBuffer,
  grantMagazineAccess,
  hasApprovedMagazineAccess,
  hasUnlockedMagazineAccess,
} from "./magazinePaywall";
import { resolveMagazineDocumentUrl } from "./magazineDocuments";
import {
  buildNewsSitemapXml,
  buildRobotsTxt,
  buildRssXml,
  buildSitemapXml,
  renderArticleHtml,
  renderMagazineHtml,
  SITE_URL,
  type SitemapUrl,
} from "./seo";

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

const NO_CACHE_HEADER = "public, max-age=0, must-revalidate";

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

function pickCategoryName(category: {
  nameAr?: string | null;
  nameEn?: string | null;
  nameFr?: string | null;
  slug?: string | null;
}) {
  return category.nameFr || category.nameEn || category.nameAr || category.slug || undefined;
}

function attachArticleCategories<
  TArticle extends {
    categoryId?: number | null;
  },
>(
  articles: TArticle[],
  categories: Array<{
    id: number;
    nameAr?: string | null;
    nameEn?: string | null;
    nameFr?: string | null;
    slug?: string | null;
  }>,
) {
  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  return articles.map((article) => {
    const category = article.categoryId ? categoryMap.get(article.categoryId) : undefined;
    return {
      ...article,
      categoryName: category ? pickCategoryName(category) : undefined,
      categorySlug: category?.slug || undefined,
    };
  });
}

async function fetchSeoContent() {
  const [articlesResult, categoriesResult, eventsResult, magazinesResult] = await Promise.allSettled([
    getPublishedArticles(),
    getAllCategories(),
    getPublishedEvents(),
    getMagazines(),
  ]);

  const categories = resolveSettled("Categories", categoriesResult, []);
  const articles = attachArticleCategories(
    resolveSettled("Published articles", articlesResult, []),
    categories,
  );
  const events = resolveSettled("Published events", eventsResult, []);
  const magazines = resolveSettled("Magazines", magazinesResult, []);

  return { articles, categories, events, magazines };
}

function writeXmlResponse(res: any, xml: string, contentType = "application/xml") {
  res.statusCode = 200;
  res.setHeader("Cache-Control", NO_CACHE_HEADER);
  res.setHeader("Content-Type", contentType);
  res.end(xml, "utf-8");
}

function writeTextResponse(res: any, body: string, contentType = "text/plain; charset=UTF-8") {
  res.statusCode = 200;
  res.setHeader("Cache-Control", NO_CACHE_HEADER);
  res.setHeader("Content-Type", contentType);
  res.end(body, "utf-8");
}

export function registerSeoRoutes(app: any) {
  app.get(["/api/render-article", "/article/:id"], async (req: any, res: any) => {
    const articleId = Number(req.params?.id || req.query.id);

    if (!Number.isInteger(articleId) || articleId <= 0) {
      res.status(400).send("Invalid article id");
      return;
    }

    try {
      const [template, article, categories] = await Promise.all([
        loadAppTemplate(),
        getArticleById(articleId),
        getAllCategories(),
      ]);

      if (!article) {
        res.status(404).type("html").send(template);
        return;
      }

      const [enrichedArticle] = attachArticleCategories([article], categories);

      res.set("Cache-Control", NO_CACHE_HEADER);
      res.type("html").send(renderArticleHtml(template, enrichedArticle));
    } catch (error) {
      console.error("[SEO] Article render failed:", error);
      res.status(500).send("Article render failed");
    }
  });

  app.get(["/api/render-magazine", "/magazine/:id"], async (req: any, res: any) => {
    const magazineId = Number(req.params?.id || req.query.id);

    if (!Number.isInteger(magazineId) || magazineId <= 0) {
      res.status(400).send("Invalid magazine id");
      return;
    }

    try {
      const magazine = await getMagazineById(magazineId);

      if (req.query?.asset === "file") {
        if (!magazine?.pdfUrl) {
          res.status(404).send("Magazine file not found");
          return;
        }

        const unlocked = hasUnlockedMagazineAccess(req, magazine);
        const approved = hasApprovedMagazineAccess(req, magazine);
        if (req.query?.download && magazine.isPremium && !approved) {
          res.status(403).send("Magazine download is locked until payment validation.");
          return;
        }

        const resolvedUrl = await resolveMagazineDocumentUrl(magazine.pdfUrl);
        if (!resolvedUrl) {
          res.status(404).send("Magazine file not found");
          return;
        }

        if (magazine.isPremium && !unlocked) {
          const upstream = await fetch(resolvedUrl, {
            headers: {
              "User-Agent": "LE BRIEF Magazine Proxy",
            },
            redirect: "follow",
          });

          if (!upstream.ok) {
            res.status(502).send("Unable to fetch the magazine file");
            return;
          }

          const previewBuffer = await buildPreviewPdfBuffer(
            Buffer.from(await upstream.arrayBuffer()),
            Math.max(Number(magazine.previewPageCount || 3), 1),
          );
          const fileName =
            typeof magazine.issueNumber === "number"
              ? `LE-BRIEF-Magazine-${magazine.issueNumber}-preview.pdf`
              : `LE-BRIEF-Magazine-${magazine.id}-preview.pdf`;

          res.status(200);
          res.setHeader("Cache-Control", NO_CACHE_HEADER);
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader("Content-Length", String(previewBuffer.byteLength));
          res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
          res.end(previewBuffer);
          return;
        }

        const upstream = await fetch(resolvedUrl, {
          headers: {
            "User-Agent": "LE BRIEF Magazine Proxy",
          },
          redirect: "follow",
        });

        if (!upstream.ok) {
          res.status(502).send("Unable to fetch the magazine file");
          return;
        }

        const buffer = Buffer.from(await upstream.arrayBuffer());
        const upstreamType = upstream.headers.get("content-type") || "application/pdf";
        const upstreamLength = upstream.headers.get("content-length");
        const fileName =
          typeof magazine.issueNumber === "number"
            ? `LE-BRIEF-Magazine-${magazine.issueNumber}.pdf`
            : `LE-BRIEF-Magazine-${magazine.id}.pdf`;

        res.status(200);
        res.setHeader("Cache-Control", NO_CACHE_HEADER);
        res.setHeader("Content-Type", upstreamType.includes("pdf") ? upstreamType : "application/pdf");
        res.setHeader(
          "Content-Disposition",
          req.query?.download ? `attachment; filename="${fileName}"` : `inline; filename="${fileName}"`,
        );

        if (upstreamLength) {
          res.setHeader("Content-Length", upstreamLength);
        }

        res.end(buffer);
        return;
      }

      const template = await loadAppTemplate();

      if (!magazine) {
        res.status(404).type("html").send(template);
        return;
      }

      res.set("Cache-Control", NO_CACHE_HEADER);
      res.type("html").send(renderMagazineHtml(template, magazine));
    } catch (error) {
      console.error("[SEO] Magazine render failed:", error);
      res.status(500).send("Magazine render failed");
    }
  });

  app.get("/api/magazine-access", async (req: any, res: any) => {
    const magazineId = Number(req.query?.magazineId);
    const accessToken = typeof req.query?.token === "string" ? req.query.token.trim() : "";

    if (!Number.isInteger(magazineId) || magazineId <= 0 || !accessToken) {
      res.redirect(302, `${SITE_URL}/`);
      return;
    }

    try {
      const request = await getMagazinePaymentRequestByAccessToken(accessToken);
      if (!request || request.magazineId !== magazineId || request.status !== "approved") {
        res.redirect(302, `${SITE_URL}/magazine/${magazineId}`);
        return;
      }

      grantMagazineAccess(req, res, magazineId);
      res.redirect(302, `${SITE_URL}/magazine/${magazineId}#reader`);
    } catch (error) {
      console.error("[SEO] Magazine access route failed:", error);
      res.redirect(302, `${SITE_URL}/magazine/${magazineId}`);
    }
  });

  app.get("/api/magazine-file/:id", async (req: any, res: any) => {
    const magazineId = Number(req.params?.id);

    if (!Number.isInteger(magazineId) || magazineId <= 0) {
      res.status(400).send("Invalid magazine id");
      return;
    }

    try {
      const magazine = await getMagazineById(magazineId);
      if (!magazine?.pdfUrl) {
        res.status(404).send("Magazine file not found");
        return;
      }

      const unlocked = hasUnlockedMagazineAccess(req, magazine);
      const approved = hasApprovedMagazineAccess(req, magazine);
      if (req.query?.download && magazine.isPremium && !approved) {
        res.status(403).send("Magazine download is locked until payment validation.");
        return;
      }

      const resolvedUrl = await resolveMagazineDocumentUrl(magazine.pdfUrl);
      if (!resolvedUrl) {
        res.status(404).send("Magazine file not found");
        return;
      }

      if (magazine.isPremium && !unlocked) {
        const upstream = await fetch(resolvedUrl, {
          headers: {
            "User-Agent": "LE BRIEF Magazine Proxy",
          },
          redirect: "follow",
        });

        if (!upstream.ok) {
          res.status(502).send("Unable to fetch the magazine file");
          return;
        }

        const previewBuffer = await buildPreviewPdfBuffer(
          Buffer.from(await upstream.arrayBuffer()),
          Math.max(Number(magazine.previewPageCount || 3), 1),
        );
        const fileName =
          typeof magazine.issueNumber === "number"
            ? `LE-BRIEF-Magazine-${magazine.issueNumber}-preview.pdf`
            : `LE-BRIEF-Magazine-${magazine.id}-preview.pdf`;

        res.status(200);
        res.setHeader("Cache-Control", NO_CACHE_HEADER);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Length", String(previewBuffer.byteLength));
        res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
        res.end(previewBuffer);
        return;
      }

      const upstream = await fetch(resolvedUrl, {
        headers: {
          ...(typeof req.headers?.range === "string" ? { Range: req.headers.range } : {}),
          "User-Agent": "LE BRIEF Magazine Proxy",
        },
        redirect: "follow",
      });

      if (!upstream.ok) {
        res.status(502).send("Unable to fetch the magazine file");
        return;
      }

      const upstreamType = upstream.headers.get("content-type") || "application/pdf";
      const upstreamLength = upstream.headers.get("content-length");
      const upstreamAcceptRanges = upstream.headers.get("accept-ranges");
      const upstreamContentRange = upstream.headers.get("content-range");
      const upstreamEtag = upstream.headers.get("etag");
      const upstreamLastModified = upstream.headers.get("last-modified");
      const fileName =
        typeof magazine.issueNumber === "number"
          ? `LE-BRIEF-Magazine-${magazine.issueNumber}.pdf`
          : `LE-BRIEF-Magazine-${magazine.id}.pdf`;

      res.status(upstream.status);
      res.setHeader("Cache-Control", NO_CACHE_HEADER);
      res.setHeader("Content-Type", upstreamType.includes("pdf") ? upstreamType : "application/pdf");
      res.setHeader(
        "Content-Disposition",
        req.query?.download ? `attachment; filename="${fileName}"` : `inline; filename="${fileName}"`,
      );

      if (upstreamLength) {
        res.setHeader("Content-Length", upstreamLength);
      }

      if (upstreamAcceptRanges) {
        res.setHeader("Accept-Ranges", upstreamAcceptRanges);
      }

      if (upstreamContentRange) {
        res.setHeader("Content-Range", upstreamContentRange);
      }

      if (upstreamEtag) {
        res.setHeader("ETag", upstreamEtag);
      }

      if (upstreamLastModified) {
        res.setHeader("Last-Modified", upstreamLastModified);
      }

      if (!upstream.body) {
        const buffer = Buffer.from(await upstream.arrayBuffer());
        res.end(buffer);
        return;
      }

      const stream = Readable.fromWeb(upstream.body as any);
      stream.on("error", (error) => {
        console.error("[SEO] Magazine stream failed:", error);
        if (!res.headersSent) {
          res.status(502).end("Unable to stream the magazine file");
          return;
        }
        res.destroy(error as Error);
      });

      stream.pipe(res);
      return;

    } catch (error) {
      console.error("[SEO] Magazine file proxy failed:", error);
      res.status(500).send("Magazine file proxy failed");
    }
  });

  app.get(["/api/sitemap", "/sitemap.xml"], async (_req: any, res: any) => {
    try {
      const { articles, categories, events, magazines } = await fetchSeoContent();
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
        ...magazines.map((magazine) => ({
          loc: `${SITE_URL}/magazine/${magazine.id}`,
          changefreq: "weekly" as const,
          lastmod: magazine.publishedAt || magazine.createdAt,
          priority: 0.8,
        })),
      ];

      writeXmlResponse(res, buildSitemapXml(urls));
    } catch (error) {
      console.error("[SEO] Sitemap render failed:", error);
      writeXmlResponse(res, buildSitemapXml(STATIC_SITEMAP_URLS));
    }
  });

  app.get(["/api/news-sitemap", "/news-sitemap.xml"], async (_req: any, res: any) => {
    try {
      const { articles } = await fetchSeoContent();
      writeXmlResponse(res, buildNewsSitemapXml(articles));
    } catch (error) {
      console.error("[SEO] News sitemap render failed:", error);
      writeXmlResponse(res, buildNewsSitemapXml([]));
    }
  });

  app.get(["/api/rss", "/rss.xml"], async (_req: any, res: any) => {
    try {
      const { articles } = await fetchSeoContent();
      writeXmlResponse(res, buildRssXml(articles), "application/rss+xml; charset=UTF-8");
    } catch (error) {
      console.error("[SEO] RSS render failed:", error);
      writeXmlResponse(res, buildRssXml([]), "application/rss+xml; charset=UTF-8");
    }
  });

  app.get(["/api/robots", "/robots.txt"], async (_req: any, res: any) => {
    try {
      writeTextResponse(res, buildRobotsTxt());
    } catch (error) {
      console.error("[SEO] Robots render failed:", error);
      writeTextResponse(res, "User-agent: *\nAllow: /\n");
    }
  });
}
