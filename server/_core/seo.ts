import { getMagazineDocumentProxyUrl } from "./magazineDocuments";

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
  metaDescription?: NullableText;
  publishedAt?: Date | null | string;
  sourceName?: NullableText;
  sourceUrl?: NullableText;
  tags?: NullableText;
  titleAr?: NullableText;
  titleEn?: NullableText;
  titleFr?: NullableText;
  updatedAt?: Date | null | string;
};

type MagazineLike = {
  coverImageUrl?: NullableText;
  id: number;
  issueNumber?: number | null;
  pdfUrl?: NullableText;
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
  const keywords = normalizeOptionalString(article.tags);
  const sourceUrl = toAbsoluteUrl(article.sourceUrl);

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
    isBasedOn: sourceUrl,
    keywords,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": toSiteUrl(`/article/${article.id}`),
    },
    publisher: buildOrganizationJsonLd(),
    url: toSiteUrl(`/article/${article.id}`),
  };
}

function formatArticleFallbackMetric(value: number) {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    const precision = millions >= 100 ? 0 : 1;
    return `${millions.toFixed(precision).replace(/\\.0$/, "")}M`;
  }

  if (value >= 1_000) {
    const thousands = value / 1_000;
    const precision = thousands >= 100 ? 0 : 1;
    return `${thousands.toFixed(precision).replace(/\\.0$/, "")}K`;
  }

  return `${value}`;
}

function formatArticleFallbackEditionDate(value?: Date | null | string, language = "fr") {
  if (!value) {
    return undefined;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  const locale = language === "ar" ? "ar-SA" : language === "en" ? "en-US" : "fr-FR";
  return date.toLocaleDateString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function buildArticleFallbackMetrics(article: ArticleLike) {
  const publishedAt = article.publishedAt ? new Date(article.publishedAt) : undefined;
  const ageDays =
    publishedAt && !Number.isNaN(publishedAt.getTime())
      ? Math.min(Math.max(Math.floor((Date.now() - publishedAt.getTime()) / (24 * 60 * 60 * 1000)), 0), 365)
      : 21;
  const seed = Math.abs((article.id * 9301 + 49297) % 233280);
  const freshnessBoost = Math.max(0, 45 - Math.min(ageDays, 45)) * 540;
  const categoryBoost =
    article.categorySlug === "petrole-gaz"
      ? 11000
      : article.categorySlug === "energie"
        ? 8000
        : article.categorySlug === "economie"
          ? 7000
          : 5000;
  const views = 18000 + (seed % 32000) + categoryBoost + freshnessBoost;
  const shares = Math.round(views * (0.043 + ((seed % 18) / 1000)));
  const likes = Math.round(views * (0.24 + ((Math.floor(seed / 7) % 12) / 100)));

  return {
    likes: formatArticleFallbackMetric(likes),
    shares: formatArticleFallbackMetric(shares),
    views: formatArticleFallbackMetric(views),
  };
}

function getArticleFallbackLabels(language: string) {
  if (language === "ar") {
    return {
      edition: "الإصدار",
      likes: "إعجاب",
      shares: "مشاركة",
      views: "مشاهدات",
    };
  }

  if (language === "en") {
    return {
      edition: "Edition",
      likes: "Likes",
      shares: "Shares",
      views: "Views",
    };
  }

  return {
    edition: "Edition",
    likes: "Aimer",
    shares: "Partages",
    views: "Vues",
  };
}

function buildArticleFallbackMarkup(article: ArticleLike, title: string, description: string) {
  const authorName = normalizeOptionalString(article.authorName) || SITE_NAME;
  const language = pickArticleLanguageCode(article);
  const editionDate = formatArticleFallbackEditionDate(article.publishedAt, language);
  const editionLabel = language === "ar" ? "الإصدار" : "Edition";
  const publishedAt = toIsoDate(article.publishedAt);
  const sourceName = normalizeOptionalString(article.sourceName);
  const sourceUrl = toAbsoluteUrl(article.sourceUrl);
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
          ${sourceName && sourceUrl ? `<p style="margin:0 0 20px;color:#1f2937;font-size:15px;line-height:1.7;"><strong>Source initiale :</strong> <a href="${escapeHtml(sourceUrl)}" style="color:#b91c1c;text-decoration:none;">${escapeHtml(sourceName)}</a></p>` : ""}
          <p style="margin:0;color:#111827;font-size:16px;line-height:1.8;">${escapeHtml(content)}</p>
          <div style="margin:32px 0 0;padding-top:24px;border-top:1px solid #e5e7eb;">
            ${editionDate ? `<p style="margin:0;color:#4b5563;font-size:14px;font-weight:600;">${escapeHtml(editionLabel)} ${escapeHtml(editionDate)}</p>` : ""}
          </div>
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
  const metaDescription = normalizeOptionalString(article.metaDescription);
  if (metaDescription) {
    return truncateText(metaDescription, 260);
  }

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

function pickMagazineTitle(magazine: MagazineLike) {
  return (
    normalizeOptionalString(magazine.titleFr) ||
    normalizeOptionalString(magazine.titleEn) ||
    normalizeOptionalString(magazine.titleAr) ||
    `${SITE_NAME} Magazine`
  );
}

function pickMagazineDescription(magazine: MagazineLike) {
  return "";
}

function pickMagazineLead(magazine: MagazineLike) {
  const parts = [
    typeof magazine.issueNumber === "number" ? `Numero ${magazine.issueNumber}` : undefined,
    "Consultez la couverture et lisez ce numero directement sur LE BRIEF.",
  ].filter(Boolean);

  return parts.join(" - ");
}

function getMagazineReaderUrl(magazine: MagazineLike) {
  return toSiteUrl(`/magazine/${magazine.id}#reader`);
}

function getMagazineDocumentUrl(magazine: MagazineLike) {
  return magazine.pdfUrl ? getMagazineDocumentProxyUrl(magazine.id) : undefined;
}

function canEmbedMagazineDocument(magazine: MagazineLike) {
  return Boolean(magazine.pdfUrl);
}

function buildMagazineJsonLd(magazine: MagazineLike, title: string, description: string, imageUrl: string) {
  const publishedAt = toIsoDate(magazine.publishedAt);
  const updatedAt = toIsoDate(magazine.updatedAt) || publishedAt;
  const pdfUrl = toAbsoluteUrl(magazine.pdfUrl);

  return {
    "@context": "https://schema.org",
    "@type": "PublicationIssue",
    dateModified: updatedAt,
    datePublished: publishedAt,
    description,
    image: [imageUrl],
    isPartOf: {
      "@type": "Periodical",
      name: SITE_NAME,
      publisher: buildOrganizationJsonLd(),
    },
    issueNumber: typeof magazine.issueNumber === "number" ? `${magazine.issueNumber}` : undefined,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": toSiteUrl(`/magazine/${magazine.id}`),
    },
    name: title,
    publisher: buildOrganizationJsonLd(),
    url: toSiteUrl(`/magazine/${magazine.id}`),
    workExample: pdfUrl,
  };
}

function buildMagazineFallbackMarkup(magazine: MagazineLike, title: string, lead: string, imageUrl: string) {
  const issueNumber =
    typeof magazine.issueNumber === "number"
      ? `<p style="margin:0 0 14px;color:#b91c1c;font-size:14px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">Numero ${magazine.issueNumber}</p>`
      : "";
  const publishedAt = formatArticleFallbackEditionDate(magazine.publishedAt, "fr");
  const publishedLine = publishedAt
    ? `<p style="margin:18px 0 0;color:#4b5563;font-size:14px;font-weight:600;">Edition ${escapeHtml(publishedAt)}</p>`
    : "";
  const readerUrl = getMagazineReaderUrl(magazine);
  const documentUrl = getMagazineDocumentUrl(magazine);
  const canEmbedDocument = canEmbedMagazineDocument(magazine);
  const actionLink = `<a href="${escapeHtml(readerUrl)}" style="display:inline-block;margin-top:24px;background:#b91c1c;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:999px;">Lire le magazine sur LE BRIEF</a>`;
  const downloadLink = documentUrl
    ? `<a href="${escapeHtml(documentUrl)}" style="display:inline-block;margin-top:16px;color:#111827;text-decoration:none;font-weight:700;">Telecharger le PDF</a>`
    : "";
  const readerSection = canEmbedDocument && documentUrl
    ? `<section id="reader" style="margin-top:40px;border:1px solid #e5e7eb;border-radius:24px;overflow:hidden;background:#f8fafc;">
        <iframe src="${escapeHtml(`${documentUrl}#toolbar=0&navpanes=0&view=FitH`)}" title="${escapeHtml(title)}" style="display:block;width:100%;height:85vh;min-height:720px;border:0;"></iframe>
      </section>`
    : "";

  return `
      <main style="margin:0 auto;max-width:1080px;padding:160px 24px 48px;color:#111827;font-family:Inter,Arial,sans-serif;background:#ffffff;">
        <section style="display:grid;gap:32px;align-items:center;grid-template-columns:minmax(260px,380px) minmax(0,1fr);">
          <div>
            <a href="${escapeHtml(readerUrl)}" style="display:block;">
              <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(title)}" style="width:100%;height:auto;border-radius:24px;display:block;box-shadow:0 30px 70px rgba(15,23,42,.18);" />
            </a>
          </div>
          <div>
            <p style="margin:0 0 10px;color:#a16207;font-size:13px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;">Kiosque LE BRIEF</p>
            ${issueNumber}
            <h1 style="margin:0 0 16px;font-size:42px;line-height:1.15;">${escapeHtml(title)}</h1>
            <p style="margin:0;color:#374151;font-size:18px;line-height:1.75;">${escapeHtml(lead)}</p>
            ${actionLink}
            ${downloadLink}
            ${publishedLine}
          </div>
        </section>
        ${readerSection}
      </main>
  `.trim();
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

export function renderMagazineHtml(template: string, magazine: MagazineLike) {
  const title = pickMagazineTitle(magazine);
  const description = pickMagazineDescription(magazine);
  const lead = pickMagazineLead(magazine);
  const canonicalUrl = toSiteUrl(`/magazine/${magazine.id}`);
  const imageUrl = toAbsoluteUrl(magazine.coverImageUrl) || DEFAULT_PREVIEW_IMAGE_URL;
  const seoBlock = buildSeoBlock({
    canonicalUrl,
    description,
    imageUrl,
    jsonLd: [buildOrganizationJsonLd(), buildMagazineJsonLd(magazine, title, description, imageUrl)],
    title,
    type: "website",
  });

  const withSeo = replaceBetweenMarkers(template, SEO_START_MARKER, SEO_END_MARKER, seoBlock);
  return withSeo.replace(APP_FALLBACK_MARKER, buildMagazineFallbackMarkup(magazine, title, lead, imageUrl));
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
