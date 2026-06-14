import { getAllCategories, createArticle, getArticleBySourceUrl, getAutomaticSourceItemById, getAutomaticSourceItemBySourceUrl, getPendingAutomaticSourceItems, createAutomaticSourceItem, getSourceAutomationSettings, touchSourceAutomationRunStatus, updateAutomaticSourceItem } from "../db";
import { submitSearchConsoleSitemaps } from "./searchConsole";
import { ENV } from "./env";
import { createOpenAiJsonCompletion } from "./openai";
import { storagePut } from "../storage";

const REUTERS_NEWS_SITEMAP_INDEX_URL =
  "https://www.reuters.com/arc/outboundfeeds/news-sitemap-index/?outputType=xml";
const USER_AGENT =
  "Mozilla/5.0 (compatible; LEBRIEFBot/1.0; +https://www.lebrief.energy/robots.txt)";
const INTERNAL_FALLBACK_IMAGE_URL = "/media/lebrief-share-preview.jpeg";
const ENERGY_PATH_PREFIX = "/business/energy/";
const MAX_AUTOMATIC_PUBLICATIONS_PER_RUN = 5;
const AUTOMATION_INTERVAL_MS = 2 * 60 * 60 * 1000;

type ReutersSitemapArticle = {
  keywords: string[];
  lastmod: string | undefined;
  loc: string;
  metadata: Record<string, unknown>;
  publishedAt: string | undefined;
  sourceSummary: string | undefined;
  stockTickers: string[];
  title: string;
};

type GeneratedArticleDraft = {
  analysis: string;
  body: string;
  categorySlug: string;
  chapeau: string;
  imageQuery: string;
  metaDescription: string;
  tags: string[];
  titleSeo: string;
};

type ReutersRunResult = {
  autoPublish: boolean;
  detected: number;
  errors: number;
  published: number;
  scanned: number;
};

type ReutersAutomationTriggerResult = {
  forced: boolean;
  nextEligibleAt?: string;
  ran: boolean;
  reason?: "not_due";
  result?: ReutersRunResult;
};

let reutersAutomationInFlight: Promise<ReutersRunResult> | null = null;

function isAutoPublishConfigured() {
  return Boolean(ENV.openAiApiKey || ENV.forgeApiKey);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractTagValue(block: string, tagName: string) {
  const regex = new RegExp(`<${escapeRegExp(tagName)}>([\\s\\S]*?)</${escapeRegExp(tagName)}>`, "i");
  const match = block.match(regex);
  return match ? decodeXmlEntities(match[1].trim()) : undefined;
}

function extractTagValues(block: string, tagName: string) {
  const regex = new RegExp(`<${escapeRegExp(tagName)}>([\\s\\S]*?)</${escapeRegExp(tagName)}>`, "gi");
  return Array.from(block.matchAll(regex), (match) => decodeXmlEntities(match[1].trim())).filter(Boolean);
}

function decodeXmlEntities(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2F;/gi, "/");
}

function toIsoString(value?: Date | string | null) {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

function toDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
}

function toIsoStringFromDate(date?: Date) {
  if (!date) return undefined;
  return date.toISOString();
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value.trim();
  }

  return `${value.slice(0, maxLength - 1).trimEnd()}...`;
}

function sanitizeText(value?: string | null) {
  return value?.replace(/\s+/g, " ").trim() || "";
}

function sanitizeParagraphs(value: string) {
  return value
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .join("\n\n");
}

function sanitizeTags(tags: string[]) {
  const uniqueTags = new Set<string>();

  for (const tag of tags) {
    const normalized = sanitizeText(tag).replace(/^#/, "");
    if (!normalized) continue;
    uniqueTags.add(normalized);
    if (uniqueTags.size >= 8) break;
  }

  return Array.from(uniqueTags);
}

function sanitizeFilePart(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "image";
}

function guessExtension(contentType: string | null, url: string) {
  if (contentType?.includes("png")) return ".png";
  if (contentType?.includes("webp")) return ".webp";
  if (contentType?.includes("gif")) return ".gif";
  if (/\.(png|webp|gif|jpeg|jpg)(?:\?|$)/i.test(url)) {
    const match = url.match(/\.(png|webp|gif|jpeg|jpg)(?:\?|$)/i);
    const extension = match?.[1]?.toLowerCase() || "jpg";
    return extension === "jpeg" ? ".jpg" : `.${extension}`;
  }
  return ".jpg";
}

function buildImageFallbackQuery(title: string, keywords: string[], categorySlug: string) {
  const haystack = `${title} ${keywords.join(" ")} ${categorySlug}`.toLowerCase();

  if (/(solar|renewable|wind|photovolta|electricity|power grid|battery|green energy)/.test(haystack)) {
    return "africa renewable energy solar panels";
  }
  if (/(lng|gas|pipeline|natural gas)/.test(haystack)) {
    return "natural gas energy infrastructure africa";
  }
  if (/(refiner|oil|opec|brent|crude|diesel|petroleum)/.test(haystack)) {
    return "oil refinery energy industry africa";
  }
  if (/(africa|senegal|nigeria|angola|ghana|kenya|mozambique)/.test(haystack)) {
    return "africa energy infrastructure";
  }

  return "energy industry africa";
}

function normalizeCategorySlug(
  categories: Array<{ slug: string }>,
  requestedSlug: string,
  textFallback: string,
) {
  const requested = sanitizeText(requestedSlug).toLowerCase();
  const matchingCategory = categories.find((category) => category.slug === requested);
  if (matchingCategory) {
    return matchingCategory.slug;
  }

  const haystack = textFallback.toLowerCase();
  const priorityMap: Array<{ slug: string; pattern: RegExp }> = [
    { slug: "petrole-gaz", pattern: /(oil|crude|brent|petrol|diesel|gas|lng|opec|refiner|refinery|pipeline)/ },
    { slug: "renouvelables", pattern: /(solar|renewable|wind|hydrogen|battery|electricity|power grid|photovolta)/ },
    { slug: "investissements", pattern: /(investment|funding|deal|stake|finance)/ },
    { slug: "economie", pattern: /(market|price|economy|inflation|trade)/ },
    { slug: "geopolitique", pattern: /(sanction|conflict|diplomacy|government|policy)/ },
    { slug: "afrique", pattern: /(africa|senegal|nigeria|angola|ghana|kenya|mozambique|ivory coast|cote d'ivoire)/ },
    { slug: "moyen-orient", pattern: /(iran|iraq|saudi|uae|qatar|kuwait|oman)/ },
  ];

  for (const candidate of priorityMap) {
    if (candidate.pattern.test(haystack) && categories.some((category) => category.slug === candidate.slug)) {
      return candidate.slug;
    }
  }

  return categories.find((category) => category.slug === "energie")?.slug || categories[0]?.slug || "energie";
}

async function fetchXml(url: string) {
  const response = await fetch(url, {
    headers: {
      accept: "application/xml,text/xml,text/plain;q=0.9,*/*;q=0.8",
      "user-agent": USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new Error(`Reuters feed request failed (${response.status}) for ${url}`);
  }

  return response.text();
}

export function parseSitemapIndexXml(xml: string) {
  return Array.from(xml.matchAll(/<sitemap>([\s\S]*?)<\/sitemap>/gi))
    .map((match) => extractTagValue(match[1], "loc"))
    .filter((value): value is string => Boolean(value));
}

export function parseReutersNewsSitemapXml(xml: string): ReutersSitemapArticle[] {
  return Array.from(xml.matchAll(/<url>([\s\S]*?)<\/url>/gi)).flatMap((match) => {
      const block = match[1];
      const loc = extractTagValue(block, "loc");
      const title = extractTagValue(block, "news:title");

      if (!loc || !title) {
        return [];
      }

      const publishedAt = extractTagValue(block, "news:publication_date");
      const lastmod = extractTagValue(block, "lastmod");
      const keywords = (extractTagValue(block, "news:keywords") || "")
        .split(",")
        .map((value) => sanitizeText(value))
        .filter(Boolean);
      const stockTickers = (extractTagValue(block, "news:stock_tickers") || "")
        .split(",")
        .map((value) => sanitizeText(value))
        .filter(Boolean);
      const imageUrls = extractTagValues(block, "image:loc");

      return [{
        loc,
        title,
        publishedAt,
        lastmod,
        keywords,
        sourceSummary: undefined,
        stockTickers,
        metadata: {
          imageUrls,
        },
      }];
    });
}

function isReutersEnergyUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.endsWith("reuters.com") && parsed.pathname.startsWith(ENERGY_PATH_PREFIX);
  } catch {
    return false;
  }
}

async function loadReutersEnergyArticles() {
  const indexXml = await fetchXml(REUTERS_NEWS_SITEMAP_INDEX_URL);
  const sitemapUrls = parseSitemapIndexXml(indexXml).slice(0, 3);

  const nestedXmlDocuments = await Promise.all(sitemapUrls.map((sitemapUrl) => fetchXml(sitemapUrl)));
  const uniqueArticles = new Map<string, ReutersSitemapArticle>();

  for (const nestedXml of nestedXmlDocuments) {
    for (const article of parseReutersNewsSitemapXml(nestedXml)) {
      if (!isReutersEnergyUrl(article.loc)) {
        continue;
      }

      if (!uniqueArticles.has(article.loc)) {
        uniqueArticles.set(article.loc, article);
      }
    }
  }

  return Array.from(uniqueArticles.values()).sort((left, right) => {
    const leftTime = new Date(left.publishedAt || left.lastmod || 0).getTime();
    const rightTime = new Date(right.publishedAt || right.lastmod || 0).getTime();
    return rightTime - leftTime;
  });
}

async function upsertDetectedReutersArticle(article: ReutersSitemapArticle) {
  const existingItem = await getAutomaticSourceItemBySourceUrl(article.loc);
  const linkedArticle = await getArticleBySourceUrl(article.loc);
  const sourcePublishedAt = toDate(article.publishedAt || article.lastmod);
  const baseData = {
    provider: "reuters" as const,
    sourceSection: "energy",
    sourceUrl: article.loc,
    sourceTitle: article.title,
    sourceSummary: article.sourceSummary || null,
    sourceKeywords: article.keywords.join(", ") || null,
    sourcePublishedAt: sourcePublishedAt ?? null,
    sourceMetadataJson: JSON.stringify({
      ...article.metadata,
      keywords: article.keywords,
      stockTickers: article.stockTickers,
      lastmod: article.lastmod,
      publishedAt: article.publishedAt,
    }),
  };

  if (existingItem) {
    await updateAutomaticSourceItem(existingItem.id, {
      ...baseData,
      ...(linkedArticle
        ? {
            publishedArticleId: linkedArticle.id,
            publishedAt: linkedArticle.publishedAt ? new Date(linkedArticle.publishedAt) : new Date(),
            status: "published",
          }
        : {}),
    });
    return { detected: false, itemId: existingItem.id };
  }

  const itemId = await createAutomaticSourceItem({
    ...baseData,
    ...(linkedArticle
      ? {
          publishedArticleId: linkedArticle.id,
          publishedAt: linkedArticle.publishedAt ? new Date(linkedArticle.publishedAt) : new Date(),
          status: "published",
        }
      : {
          status: "detected",
        }),
  });

  return { detected: !linkedArticle, itemId };
}

async function generateDraftForReutersArticle(input: {
  categoryOptions: Array<{ nameFr: string; slug: string }>;
  keywords: string[];
  publishedAt?: string;
  sourceSummary?: string;
  sourceTitle: string;
  sourceUrl: string;
  stockTickers: string[];
}) {
  const categoryOptionsText = input.categoryOptions
    .map((category) => `${category.slug}: ${category.nameFr}`)
    .join(", ");

  const result = await createOpenAiJsonCompletion<GeneratedArticleDraft>(
    [
      {
        role: "system",
        content:
          "Tu es un redacteur senior de LE BRIEF. Tu rediges uniquement en francais. Tu ne copies jamais un texte source. Tu n'inventes pas de citations, chiffres ou faits non confirms dans les metadonnees fournies. Quand l'information source est limitee, tu le reconnais avec prudence et tu restes factuel. Retourne un objet JSON strict sans markdown.",
      },
      {
        role: "user",
        content: JSON.stringify(
          {
            instructions: {
              audience:
                "professionnels de l'energie, des investissements et des marches en Afrique et au Moyen-Orient",
              output: {
                titleSeo:
                  "titre SEO original en francais, 110 caracteres maximum, sans mention finale '| Reuters'",
                chapeau: "2 phrases maximum, ton journalistique",
                body:
                  "3 a 5 courts paragraphes factuels, texte original, sans recopier Reuters, sans puces, sans titre de section",
                analysis:
                  "2 courts paragraphes sous l'angle 'Analyse LE BRIEF', axes marches energie Afrique, geopolitique ou investissements selon le sujet",
                tags: "tableau JSON de 4 a 8 tags courts sans #",
                categorySlug: `une valeur parmi: ${categoryOptionsText}`,
                metaDescription: "145 a 160 caracteres, descriptive, originale",
                imageQuery:
                  "requete courte en anglais pour chercher une image libre de droits adaptee au sujet",
              },
              rules: [
                "Ne jamais copier ou paraphraser de longues formulations source",
                "Ne pas decrire une image Reuters",
                "Ne produire que du contenu original",
                "Ne pas inventer des details specifiques absents des metadonnees",
                "Le corps et l'analyse doivent etre distincts",
              ],
            },
            source: {
              provider: "Reuters",
              sourceTitle: input.sourceTitle,
              sourceUrl: input.sourceUrl,
              sourcePublishedAt: input.publishedAt || null,
              sourceSummary: input.sourceSummary || null,
              keywords: input.keywords,
              stockTickers: input.stockTickers,
            },
          },
          null,
          2,
        ),
      },
    ],
    { maxTokens: 2200, temperature: 0.5 },
  );

  return {
    titleSeo: truncate(sanitizeText(result.titleSeo), 110),
    chapeau: truncate(sanitizeText(result.chapeau), 320),
    body: sanitizeParagraphs(result.body || ""),
    analysis: sanitizeParagraphs(result.analysis || ""),
    categorySlug: sanitizeText(result.categorySlug).toLowerCase(),
    metaDescription: truncate(sanitizeText(result.metaDescription), 160),
    imageQuery: sanitizeText(result.imageQuery),
    tags: sanitizeTags(Array.isArray(result.tags) ? result.tags : []),
  };
}

async function searchPexelsImage(query: string) {
  if (!ENV.pexelsApiKey) {
    return undefined;
  }

  const url = new URL("https://api.pexels.com/v1/search");
  url.searchParams.set("query", query);
  url.searchParams.set("orientation", "landscape");
  url.searchParams.set("per_page", "1");

  const response = await fetch(url, {
    headers: {
      Authorization: ENV.pexelsApiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Pexels request failed (${response.status})`);
  }

  const payload = (await response.json()) as {
    photos?: Array<{
      alt?: string;
      src?: {
        large?: string;
        landscape?: string;
      };
    }>;
  };
  const photo = payload.photos?.[0];
  const remoteUrl = photo?.src?.landscape || photo?.src?.large;
  if (!remoteUrl) return undefined;

  return {
    alt: photo?.alt || query,
    provider: "pexels",
    remoteUrl,
  };
}

async function searchUnsplashImage(query: string) {
  if (!ENV.unsplashAccessKey) {
    return undefined;
  }

  const url = new URL("https://api.unsplash.com/search/photos");
  url.searchParams.set("query", query);
  url.searchParams.set("orientation", "landscape");
  url.searchParams.set("per_page", "1");
  url.searchParams.set("content_filter", "high");

  const response = await fetch(url, {
    headers: {
      Authorization: `Client-ID ${ENV.unsplashAccessKey}`,
      "Accept-Version": "v1",
    },
  });

  if (!response.ok) {
    throw new Error(`Unsplash request failed (${response.status})`);
  }

  const payload = (await response.json()) as {
    results?: Array<{
      alt_description?: string | null;
      description?: string | null;
      urls?: {
        regular?: string;
      };
    }>;
  };
  const photo = payload.results?.[0];
  const remoteUrl = photo?.urls?.regular;
  if (!remoteUrl) return undefined;

  return {
    alt: photo?.alt_description || photo?.description || query,
    provider: "unsplash",
    remoteUrl,
  };
}

async function persistRemoteImage(remoteUrl: string, label: string) {
  const response = await fetch(remoteUrl, {
    headers: {
      "user-agent": USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new Error(`Image download failed (${response.status})`);
  }

  if (!ENV.forgeApiKey || !ENV.forgeApiUrl) {
    return remoteUrl;
  }

  const contentType = response.headers.get("content-type");
  const buffer = Buffer.from(await response.arrayBuffer());
  const extension = guessExtension(contentType, remoteUrl);
  const fileName = sanitizeFilePart(label);
  const stored = await storagePut(
    `le-brief/images/automation/${Date.now()}-${fileName}${extension}`,
    buffer,
    contentType || "image/jpeg",
  );

  return stored.url;
}

async function resolveTopicImage(input: {
  categorySlug: string;
  imageQuery: string;
  keywords: string[];
  sourceTitle: string;
}) {
  const query =
    sanitizeText(input.imageQuery) ||
    buildImageFallbackQuery(input.sourceTitle, input.keywords, input.categorySlug);

  try {
    const providerMatch = (await searchPexelsImage(query)) || (await searchUnsplashImage(query));
    if (!providerMatch) {
      return INTERNAL_FALLBACK_IMAGE_URL;
    }

    return await persistRemoteImage(providerMatch.remoteUrl, providerMatch.alt);
  } catch (error) {
    console.error("[Reuters automation] Image selection failed:", error);
    return INTERNAL_FALLBACK_IMAGE_URL;
  }
}

async function publishDetectedReutersItem(itemId: number) {
  const item = await getAutomaticSourceItemById(itemId);
  if (!item) {
    throw new Error(`Automatic source item ${itemId} not found`);
  }

  if (item.publishedArticleId) {
    return { articleId: item.publishedArticleId, published: false };
  }

  const existingArticle = await getArticleBySourceUrl(item.sourceUrl);
  if (existingArticle) {
    await updateAutomaticSourceItem(item.id, {
      errorMessage: null,
      lastAttemptAt: new Date(),
      publishedArticleId: existingArticle.id,
      publishedAt: existingArticle.publishedAt ? new Date(existingArticle.publishedAt) : new Date(),
      status: "published",
    });
    return { articleId: existingArticle.id, published: false };
  }

  await updateAutomaticSourceItem(item.id, {
    errorMessage: null,
    lastAttemptAt: new Date(),
  });

  const categories = await getAllCategories();
  const categoryOptions = categories.map((category) => ({ nameFr: category.nameFr, slug: category.slug }));
  const keywords = sanitizeText(item.sourceKeywords)
    .split(",")
    .map((value) => sanitizeText(value))
    .filter(Boolean);
  const metadata = item.sourceMetadataJson ? JSON.parse(item.sourceMetadataJson) : {};
  const stockTickers = Array.isArray((metadata as any).stockTickers)
    ? (metadata as any).stockTickers.filter((value: unknown) => typeof value === "string")
    : [];
  const draft = await generateDraftForReutersArticle({
    categoryOptions,
    keywords,
    publishedAt: toIsoString(item.sourcePublishedAt),
    sourceSummary: item.sourceSummary || undefined,
    sourceTitle: item.sourceTitle,
    sourceUrl: item.sourceUrl,
    stockTickers,
  });

  const categorySlug = normalizeCategorySlug(
    categoryOptions,
    draft.categorySlug,
    `${item.sourceTitle} ${keywords.join(" ")}`,
  );
  const category = categories.find((entry) => entry.slug === categorySlug) || categories[0];
  if (!category) {
    throw new Error("No article category is available");
  }

  const imageUrl = await resolveTopicImage({
    categorySlug,
    imageQuery: draft.imageQuery,
    keywords,
    sourceTitle: item.sourceTitle,
  });
  const contentFr = sanitizeParagraphs(
    `${draft.body}\n\nAnalyse LE BRIEF\n${draft.analysis}`.trim(),
  );
  const articleId = await createArticle({
    authorName: "Rédaction LE BRIEF",
    categoryId: category.id,
    contentFr,
    excerptFr: draft.chapeau,
    featured: false,
    imageUrl,
    language: "fr",
    metaDescription: draft.metaDescription,
    published: true,
    publishedAt: new Date(),
    sourceName: "Reuters",
    sourceUrl: item.sourceUrl,
    tags: draft.tags.join(", "),
    titleFr: draft.titleSeo,
  });

  await updateAutomaticSourceItem(item.id, {
    errorMessage: null,
    generatedExcerptFr: draft.chapeau,
    generatedImageUrl: imageUrl,
    generatedMetaDescription: draft.metaDescription,
    generatedTags: draft.tags.join(", "),
    generatedTitleFr: draft.titleSeo,
    publishedArticleId: articleId,
    publishedAt: new Date(),
    status: "published",
  });

  try {
    await submitSearchConsoleSitemaps();
  } catch (error) {
    console.error("[Reuters automation] Search Console submit failed:", error);
  }

  return { articleId, published: true };
}

export async function publishAutomaticSourceItemById(itemId: number) {
  try {
    return await publishDetectedReutersItem(itemId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown publishing error";
    await updateAutomaticSourceItem(itemId, {
      errorMessage: truncate(message, 2000),
      lastAttemptAt: new Date(),
      status: "error",
    });
    throw error;
  }
}

async function runReutersEnergyAutomationWithLock() {
  if (reutersAutomationInFlight) {
    return reutersAutomationInFlight;
  }

  reutersAutomationInFlight = runReutersEnergyAutomation().finally(() => {
    reutersAutomationInFlight = null;
  });

  return reutersAutomationInFlight;
}

export async function triggerReutersEnergyAutomation(options?: {
  force?: boolean;
}): Promise<ReutersAutomationTriggerResult> {
  const force = Boolean(options?.force);

  if (!force) {
    const settings = await getSourceAutomationSettings("reuters");
    const lastRunAt = toDate(toIsoString(settings.lastRunAt));
    if (lastRunAt) {
      const nextEligibleAt = new Date(lastRunAt.getTime() + AUTOMATION_INTERVAL_MS);
      if (nextEligibleAt.getTime() > Date.now()) {
        return {
          forced: false,
          nextEligibleAt: toIsoStringFromDate(nextEligibleAt),
          ran: false,
          reason: "not_due",
        };
      }
    }
  }

  return {
    forced: force,
    ran: true,
    result: await runReutersEnergyAutomationWithLock(),
  };
}

export async function runReutersEnergyAutomation(): Promise<ReutersRunResult> {
  const settings = await getSourceAutomationSettings("reuters");
  const shouldAutoPublish = Boolean(settings.autoPublish && isAutoPublishConfigured());
  const result: ReutersRunResult = {
    autoPublish: shouldAutoPublish,
    detected: 0,
    errors: 0,
    published: 0,
    scanned: 0,
  };

  await touchSourceAutomationRunStatus("reuters", {
    lastError: null,
    lastRunAt: new Date(),
  });

  try {
    const articles = await loadReutersEnergyArticles();
    result.scanned = articles.length;

    for (const article of articles) {
      const detectionResult = await upsertDetectedReutersArticle(article);
      if (detectionResult.detected) {
        result.detected += 1;
      }
    }

    if (shouldAutoPublish) {
      const pendingItems = await getPendingAutomaticSourceItems("reuters", MAX_AUTOMATIC_PUBLICATIONS_PER_RUN);

      for (const pendingItem of pendingItems) {
        try {
          const publishResult = await publishAutomaticSourceItemById(pendingItem.id);
          if (publishResult.published) {
            result.published += 1;
          }
        } catch (error) {
          result.errors += 1;
          console.error("[Reuters automation] Automatic publication failed:", error);
        }
      }
    }

    await touchSourceAutomationRunStatus("reuters", {
      lastError: null,
      lastRunAt: new Date(),
      lastSuccessAt: new Date(),
    });
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown automation error";
    await touchSourceAutomationRunStatus("reuters", {
      lastError: truncate(message, 2000),
      lastRunAt: new Date(),
    });
    throw error;
  }
}
