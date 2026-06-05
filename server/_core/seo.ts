const SEO_START_MARKER = "<!-- LE_BRIEF_SEO_START -->";
const SEO_END_MARKER = "<!-- LE_BRIEF_SEO_END -->";
const APP_FALLBACK_MARKER = "<!-- LE_BRIEF_APP_FALLBACK -->";

export const SITE_NAME = "LE BRIEF";
export const SITE_URL = "https://www.lebrief.energy";
export const SITE_DESCRIPTION =
  "Strategic intelligence on energy, economy, investment, and events across Africa and the Middle East.";
export const DEFAULT_PREVIEW_IMAGE_URL = `${SITE_URL}/media/lebrief-share-preview.jpeg`;

type NullableText = null | string | undefined;

type ArticleLike = {
  id: number;
  authorName?: NullableText;
  contentAr?: NullableText;
  contentEn?: NullableText;
  contentFr?: NullableText;
  excerptAr?: NullableText;
  excerptEn?: NullableText;
  excerptFr?: NullableText;
  imageUrl?: NullableText;
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
    logo: DEFAULT_PREVIEW_IMAGE_URL,
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
}: {
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

function buildArticleJsonLd(article: ArticleLike, title: string, description: string, imageUrl: string) {
  const publishedAt = toIsoDate(article.publishedAt);
  const updatedAt = toIsoDate(article.updatedAt) || publishedAt;

  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    author: {
      "@type": "Organization",
      name: normalizeOptionalString(article.authorName) || SITE_NAME,
    },
    dateModified: updatedAt,
    datePublished: publishedAt,
    description,
    headline: title,
    image: [imageUrl],
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": toSiteUrl(`/article/${article.id}`),
    },
    publisher: buildOrganizationJsonLd(),
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
  const seoBlock = buildSeoBlock({
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

export function toAbsoluteContentUrl(value?: NullableText) {
  return toAbsoluteUrl(value);
}
