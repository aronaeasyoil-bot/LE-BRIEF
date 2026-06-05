const SEO_START_MARKER = "<!-- LE_BRIEF_SEO_START -->";
const SEO_END_MARKER = "<!-- LE_BRIEF_SEO_END -->";
const APP_FALLBACK_MARKER = "<!-- LE_BRIEF_APP_FALLBACK -->";

export const SITE_NAME = "LE BRIEF";
export const SITE_URL = "https://www.lebrief.energy";
export const SITE_DESCRIPTION =
  "Strategic intelligence on energy, economy, investment, and events across Africa and the Middle East.";
export const DEFAULT_PREVIEW_IMAGE_URL = `${SITE_URL}/media/lebrief-share-preview.jpeg`;
export const CONTACT_EMAIL = "contact@lebrief.energy";
export const MAIN_SITEMAP_URL = `${SITE_URL}/sitemap.xml`;
export const NEWS_SITEMAP_URL = `${SITE_URL}/news-sitemap.xml`;
export const RSS_FEED_URL = `${SITE_URL}/rss.xml`;

type NullableText = null | string | undefined;

type ArticleLike = {
  id: number;
  authorName?: NullableText;
  categoryName?: NullableText;
  categorySlug?: NullableText;
  contentAr?: NullableText;
  contentEn?: NullableText;
  contentFr?: NullableText;
  excerptAr?: NullableText;
  excerptEn?: NullableText;
  excerptFr?: NullableText;
  imageUrl?: NullableText;
  language?: NullableText;
  publishedAt?: Date | null | string;
  titleAr?: NullableText;
  titleEn?: NullableText;
  titleFr?: NullableText;
  updatedAt?: Date | null | string;
};

export type SitemapUrl = {
  changefreq?: "daily" | "monthly" | "weekly";
  lastmod?: Date | null | string;
  loc: string;
  priority?: number;
};

export function normalizeOptionalString(value?: NullableText) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed || undefined;
}

function toPlainText(value?: NullableText) {
  return normalizeOptionalString(value)?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ") || "";
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trimEnd()}...`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeXml(value: string) {
  return escapeHtml(value);
}

function serializeJsonLd(value: Record<string, unknown>) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function toAbsoluteUrl(value?: NullableText) {
  const trimmed = normalizeOptionalString(value);

  if (!trimmed) {
    return undefined;
  }

  try {
    const normalized = /^https?:\/\//i.test(trimmed) ? encodeURI(trimmed) : encodeURI(trimmed);
    return new URL(normalized, SITE_URL).toString();
  } catch {
    return undefined;
  }
}

function toIsoDate(value?: Date | null | string) {
  if (!value) {
    return undefined;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString();
}

function toSitemapLastmod(value?: Date | null | string) {
  const isoDate = toIsoDate(value);
  return isoDate ? isoDate.slice(0, 10) : undefined;
}

function toRfc822Date(value?: Date | null | string) {
  if (!value) {
    return undefined;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toUTCString();
}

function normalizeSitemapLoc(value: string) {
  try {
    return new URL(value).toString();
  } catch {
    return undefined;
  }
}

function toSiteUrl(path: string) {
  return new URL(path, SITE_URL).toString();
}

function replaceBetweenMarkers(template: string, startMarker: string, endMarker: string, replacement: string) {
  const startIndex = template.indexOf(startMarker);
  const endIndex = template.indexOf(endMarker);

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    throw new Error(`Template markers not found: ${startMarker} / ${endMarker}`);
  }

  return `${template.slice(0, startIndex)}${replacement}${template.slice(endIndex + endMarker.length)}`;
}

function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    email: "contact@lebrief.energy",
    logo: {
      "@type": "ImageObject",
      url: DEFAULT_PREVIEW_IMAGE_URL,
    },
    name: SITE_NAME,
    url: SITE_URL,
  };
}

function buildSeoBlock({
  canonicalUrl,
  description,
  imageUrl,
  jsonLd,
  title,
  type,
  articleMeta,
}: {
  articleMeta?: {
    authorName?: string;
    modifiedAt?: string;
    publishedAt?: string;
    section?: string;
  };
  canonicalUrl: string;
  description: string;
  imageUrl: string;
  jsonLd: Array<Record<string, unknown>>;
  title: string;
  type: "article" | "website";
}) {
  const escapedTitle = escapeHtml(title);
  const escapedDescription = escapeHtml(description);
  const escapedCanonicalUrl = escapeHtml(canonicalUrl);
  const escapedImageUrl = escapeHtml(imageUrl);

  const jsonLdMarkup = jsonLd
    .map((entry) => `<script type="application/ld+json">${serializeJsonLd(entry)}</script>`)
    .join("\n    ");
  const escapedAuthorName = articleMeta?.authorName ? escapeHtml(articleMeta.authorName) : "";
  const escapedSection = articleMeta?.section ? escapeHtml(articleMeta.section) : "";

  return `${SEO_START_MARKER}
    <title>${escapedTitle}</title>
    <meta
      name="description"
      content="${escapedDescription}" />
    <meta
      name="robots"
      content="index,follow,max-image-preview:large" />
    <meta
      name="googlebot"
      content="index,follow,max-image-preview:large" />
    <link
      rel="canonical"
      href="${escapedCanonicalUrl}" />
    <link
      rel="alternate"
      type="application/rss+xml"
      title="${SITE_NAME} RSS"
      href="${RSS_FEED_URL}" />
    <meta
      property="og:type"
      content="${type}" />
    <meta
      property="og:site_name"
      content="${SITE_NAME}" />
    <meta
      property="og:title"
      content="${escapedTitle}" />
    <meta
      property="og:description"
      content="${escapedDescription}" />
    <meta
      property="og:url"
      content="${escapedCanonicalUrl}" />
    <meta
      property="og:image"
      content="${escapedImageUrl}" />
    <meta
      property="og:image:alt"
      content="${escapedTitle}" />
    ${escapedAuthorName ? `<meta
      name="author"
      content="${escapedAuthorName}" />` : ""}
    ${type === "article" && articleMeta?.publishedAt ? `<meta
      property="article:published_time"
      content="${escapeHtml(articleMeta.publishedAt)}" />` : ""}
    ${type === "article" && articleMeta?.modifiedAt ? `<meta
      property="article:modified_time"
      content="${escapeHtml(articleMeta.modifiedAt)}" />` : ""}
    ${type === "article" && escapedAuthorName ? `<meta
      property="article:author"
      content="${escapedAuthorName}" />` : ""}
    ${type === "article" && escapedSection ? `<meta
      property="article:section"
      content="${escapedSection}" />` : ""}
    <meta
      name="twitter:card"
      content="summary_large_image" />
    <meta
      name="twitter:title"
      content="${escapedTitle}" />
    <meta
      name="twitter:description"
      content="${escapedDescription}" />
    <meta
      name="twitter:image"
      content="${escapedImageUrl}" />
    ${jsonLdMarkup}
    ${SEO_END_MARKER}`;
}

function pickArticleLanguageCode(article: ArticleLike) {
  const normalizedLanguage = normalizeOptionalString(article.language)?.toLowerCase();

  if (normalizedLanguage === "ar" || normalizedLanguage === "en" || normalizedLanguage === "fr") {
    return normalizedLanguage;
  }

  if (
    normalizeOptionalString(article.titleAr) ||
    normalizeOptionalString(article.excerptAr) ||
    normalizeOptionalString(article.contentAr)
  ) {
    return "ar";
  }

  if (
    normalizeOptionalString(article.titleEn) ||
    normalizeOptionalString(article.excerptEn) ||
    normalizeOptionalString(article.contentEn)
  ) {
    return "en";
  }

  return "fr";
}

function buildArticleJsonLd(article: ArticleLike, title: string, description: string, imageUrl: string) {
  const publishedAt = toIsoDate(article.publishedAt);
  const updatedAt = toIsoDate(article.updatedAt) || publishedAt;
  const authorName = normalizeOptionalString(article.authorName);
  const categoryName = normalizeOptionalString(article.categoryName);
  const language = pickArticleLanguageCode(article);

  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    author: authorName
      ? {
          "@type": "Person",
          name: authorName,
        }
      : {
          "@type": "Organization",
          name: SITE_NAME,
        },
    articleSection: categoryName,
    dateModified: updatedAt,
    datePublished: publishedAt,
    description,
    headline: title,
    image: [imageUrl],
    inLanguage: language,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": toSiteUrl(`/article/${article.id}`),
    },
    publisher: buildOrganizationJsonLd(),
    url: toSiteUrl(`/article/${article.id}`),
  };
}

function buildArticleFallbackMarkup(article: ArticleLike, title: string, description: string) {
  const authorName = normalizeOptionalString(article.authorName) || SITE_NAME;
  const publishedAt = toIsoDate(article.publishedAt);
  const content = truncateText(
    toPlainText(article.contentFr) || toPlainText(article.contentEn) || toPlainText(article.contentAr) || description,
    1400,
  );

  return `
      <main style="margin:0 auto;max-width:960px;padding:160px 24px 48px;color:#111827;font-family:Inter,Arial,sans-serif;background:#ffffff;">
        <article>
          <p style="margin:0 0 12px;color:#b91c1c;font-size:14px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">LE BRIEF</p>
          <h1 style="margin:0 0 16px;font-size:40px;line-height:1.15;">${escapeHtml(title)}</h1>
          <p style="margin:0 0 10px;color:#4b5563;font-size:15px;">${escapeHtml(authorName)}${publishedAt ? ` • ${escapeHtml(publishedAt.slice(0, 10))}` : ""}</p>
          <p style="margin:0 0 20px;color:#374151;font-size:18px;line-height:1.7;">${escapeHtml(description)}</p>
          <p style="margin:0;color:#111827;font-size:16px;line-height:1.8;">${escapeHtml(content)}</p>
        </article>
      </main>
  `.trim();
}

export function pickArticleTitle(article: ArticleLike) {
  return (
    normalizeOptionalString(article.titleFr) ||
    normalizeOptionalString(article.titleEn) ||
    normalizeOptionalString(article.titleAr) ||
    `${SITE_NAME} Article`
  );
}

export function pickArticleDescription(article: ArticleLike) {
  const excerpt =
    normalizeOptionalString(article.excerptFr) ||
    normalizeOptionalString(article.excerptEn) ||
    normalizeOptionalString(article.excerptAr);

  if (excerpt) {
    return truncateText(excerpt, 260);
  }

  const content =
    toPlainText(article.contentFr) ||
    toPlainText(article.contentEn) ||
    toPlainText(article.contentAr) ||
    SITE_DESCRIPTION;

  return truncateText(content, 260);
}

export function renderArticleHtml(template: string, article: ArticleLike) {
  const title = pickArticleTitle(article);
  const description = pickArticleDescription(article);
  const canonicalUrl = toSiteUrl(`/article/${article.id}`);
  const imageUrl = toAbsoluteUrl(article.imageUrl) || DEFAULT_PREVIEW_IMAGE_URL;
  const publishedAt = toIsoDate(article.publishedAt);
  const modifiedAt = toIsoDate(article.updatedAt) || publishedAt;
  const authorName = normalizeOptionalString(article.authorName);
  const section = normalizeOptionalString(article.categoryName);
  const seoBlock = buildSeoBlock({
    articleMeta: {
      authorName,
      modifiedAt,
      publishedAt,
      section,
    },
    canonicalUrl,
    description,
    imageUrl,
    jsonLd: [buildOrganizationJsonLd(), buildArticleJsonLd(article, title, description, imageUrl)],
    title: `${title} | ${SITE_NAME}`,
    type: "article",
  });

  const withSeo = replaceBetweenMarkers(template, SEO_START_MARKER, SEO_END_MARKER, seoBlock);
  return withSeo.replace(APP_FALLBACK_MARKER, buildArticleFallbackMarkup(article, title, description));
}

export function buildSitemapXml(urls: SitemapUrl[]) {
  const uniqueUrls = new Map<string, SitemapUrl>();

  for (const entry of urls) {
    const loc = normalizeSitemapLoc(entry.loc);
    if (!loc) {
      continue;
    }

    if (!uniqueUrls.has(loc)) {
      uniqueUrls.set(loc, { ...entry, loc });
    }
  }

  const entries = Array.from(uniqueUrls.values())
    .map((entry) => {
      const lastmod = toSitemapLastmod(entry.lastmod);
      return [
        "  <url>",
        `    <loc>${escapeXml(entry.loc)}</loc>`,
        lastmod ? `    <lastmod>${escapeXml(lastmod)}</lastmod>` : "",
        entry.changefreq ? `    <changefreq>${entry.changefreq}</changefreq>` : "",
        typeof entry.priority === "number" ? `    <priority>${entry.priority.toFixed(1)}</priority>` : "",
        "  </url>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

export function buildNewsSitemapXml(articles: ArticleLike[]) {
  const cutoff = Date.now() - 48 * 60 * 60 * 1000;
  const uniqueArticles = new Map<string, ArticleLike>();

  for (const article of articles) {
    const loc = normalizeSitemapLoc(toSiteUrl(`/article/${article.id}`));
    const publishedAt = article.publishedAt ? new Date(article.publishedAt) : undefined;

    if (!loc || !publishedAt || Number.isNaN(publishedAt.getTime()) || publishedAt.getTime() < cutoff) {
      continue;
    }

    if (!uniqueArticles.has(loc)) {
      uniqueArticles.set(loc, article);
    }
  }

  const entries = Array.from(uniqueArticles.entries())
    .map(([loc, article]) => {
      const title = escapeXml(pickArticleTitle(article));
      const publicationDate = toIsoDate(article.publishedAt);
      const language = escapeXml(pickArticleLanguageCode(article));

      return [
        "  <url>",
        `    <loc>${escapeXml(loc)}</loc>`,
        "    <news:news>",
        "      <news:publication>",
        `        <news:name>${escapeXml(SITE_NAME)}</news:name>`,
        `        <news:language>${language}</news:language>`,
        "      </news:publication>",
        publicationDate ? `      <news:publication_date>${escapeXml(publicationDate)}</news:publication_date>` : "",
        `      <news:title>${title}</news:title>`,
        "    </news:news>",
        "  </url>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n${entries}\n</urlset>\n`;
}

export function buildRssXml(articles: ArticleLike[]) {
  const lastBuildDate =
    toRfc822Date(articles[0]?.updatedAt || articles[0]?.publishedAt) || new Date().toUTCString();

  const items = articles
    .map((article) => {
      const title = escapeXml(pickArticleTitle(article));
      const description = escapeXml(pickArticleDescription(article));
      const loc = toSiteUrl(`/article/${article.id}`);
      const pubDate = toRfc822Date(article.publishedAt || article.updatedAt) || lastBuildDate;
      const authorName = normalizeOptionalString(article.authorName);
      const categoryName = normalizeOptionalString(article.categoryName);

      return [
        "    <item>",
        `      <title>${title}</title>`,
        `      <link>${escapeXml(loc)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(loc)}</guid>`,
        `      <description>${description}</description>`,
        `      <pubDate>${escapeXml(pubDate)}</pubDate>`,
        authorName ? `      <author>${escapeXml(`${CONTACT_EMAIL} (${authorName})`)}</author>` : "",
        categoryName ? `      <category>${escapeXml(categoryName)}</category>` : "",
        "    </item>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n  <channel>\n    <title>${escapeXml(SITE_NAME)}</title>\n    <link>${escapeXml(SITE_URL)}</link>\n    <description>${escapeXml(SITE_DESCRIPTION)}</description>\n    <language>fr</language>\n    <lastBuildDate>${escapeXml(lastBuildDate)}</lastBuildDate>\n    <atom:link href="${escapeXml(RSS_FEED_URL)}" rel="self" type="application/rss+xml" />\n${items}\n  </channel>\n</rss>\n`;
}

export function buildRobotsTxt() {
  return `User-agent: *\nAllow: /\n\nSitemap: ${MAIN_SITEMAP_URL}\nSitemap: ${NEWS_SITEMAP_URL}\n`;
}

export function toAbsoluteContentUrl(value?: NullableText) {
  return toAbsoluteUrl(value);
}
