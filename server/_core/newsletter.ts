import { createHmac, timingSafeEqual } from "node:crypto";
import { ENV } from "./env";
import { SITE_URL } from "./seo";
import {
  bulkUpsertSubscribers,
  createNewsletterCampaign,
  deleteSubscriberByEmail,
  getAllSubscribers,
  getExistingSubscriberEmails,
  getNewsletterCampaignById,
  getNewsletterCampaignByWeekKey,
  getPublishedArticles,
  updateNewsletterCampaign,
} from "../db";

const RESEND_API_BASE_URL = "https://api.resend.com/emails";
const DEFAULT_FROM_EMAIL = "LE BRIEF <newsletter@lebrief.energy>";
const RESEND_ONBOARDING_FROM_EMAIL = "LE BRIEF <onboarding@resend.dev>";
const DEFAULT_RECIPIENT_ANCHOR = "contact@lebrief.energy";
const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const RESEND_MAX_RECIPIENTS_PER_REQUEST = 50;
const RESEND_ANCHOR_RECIPIENT_COUNT = 1;
export const NEWSLETTER_RESEND_BCC_CHUNK_SIZE =
  RESEND_MAX_RECIPIENTS_PER_REQUEST - RESEND_ANCHOR_RECIPIENT_COUNT;
type NewsletterLanguage = "fr" | "en" | "ar";

const SENEGAL_PRIORITY_TERMS = [
  "senegal",
  "dakar",
  "senelec",
  "petrosen",
  "sangomar",
  "gta",
  "grand tortue ahmeyim",
  "gandon",
];

const AFRICAN_PRIORITY_TERMS = [
  "africa",
  "afrique",
  "african",
  "africain",
  "africaine",
  "africaines",
  "africains",
  "algeria",
  "algerie",
  "angola",
  "benin",
  "botswana",
  "burkina",
  "burundi",
  "cameroon",
  "cameroun",
  "cape verde",
  "cap-vert",
  "central african republic",
  "republique centrafricaine",
  "chad",
  "tchad",
  "comoros",
  "comores",
  "congo",
  "cote d'ivoire",
  "cote divoire",
  "côte d'ivoire",
  "djibouti",
  "egypt",
  "egypte",
  "égypte",
  "equatorial guinea",
  "guinee equatoriale",
  "eritrea",
  "erythree",
  "eswatini",
  "ethiopia",
  "ethiopie",
  "gabon",
  "gambia",
  "gambie",
  "ghana",
  "guinea",
  "guinee",
  "guinée",
  "guinea-bissau",
  "guinee-bissau",
  "kenya",
  "lesotho",
  "liberia",
  "liberia",
  "libya",
  "libye",
  "madagascar",
  "malawi",
  "mali",
  "mauritania",
  "mauritanie",
  "mauritius",
  "maurice",
  "morocco",
  "maroc",
  "mozambique",
  "namibia",
  "niger",
  "nigeria",
  "rwanda",
  "sao tome",
  "sao tome-et-principe",
  "seychelles",
  "sierra leone",
  "somalia",
  "somalie",
  "south africa",
  "afrique du sud",
  "south sudan",
  "soudan du sud",
  "sudan",
  "soudan",
  "tanzania",
  "tanzanie",
  "togo",
  "tunisia",
  "tunisie",
  "uganda",
  "zambia",
  "zambie",
  "zimbabwe",
];

const DAILY_NEWSLETTER_COPY: Record<
  NewsletterLanguage,
  {
    bodyIntro: string;
    ctaLabel: string;
    footerNote: string;
    headlineLabel: string;
    readMoreLabel: string;
    secondaryLabel: string;
    subjectPrefix: string;
    subtitle: string;
    titlePrefix: string;
    unsubscribePrefix: string;
  }
> = {
  ar: {
    bodyIntro: "ابرز الموضوعات المنشورة على LE BRIEF خلال اخر 24 ساعة.",
    ctaLabel: "اقرا المقال",
    footerNote: "تصلك هذه النشرة لان بريدك الالكتروني مسجل لدى LE BRIEF.",
    headlineLabel: "ابرز خبر",
    readMoreLabel: "اكمل القراءة",
    secondaryLabel: "اهم ما يجب متابعته",
    subjectPrefix: "LE BRIEF | الاخبار اليومية",
    subtitle: "موجز يومي عن الطاقة والاسواق والاستثمار في افريقيا",
    titlePrefix: "النشرة اليومية",
    unsubscribePrefix: "الغاء الاشتراك",
  },
  en: {
    bodyIntro: "The key LE BRIEF stories published over the last 24 hours.",
    ctaLabel: "Read the story",
    footerNote: "You are receiving this newsletter because your email address is subscribed to LE BRIEF.",
    headlineLabel: "Top story",
    readMoreLabel: "Continue reading",
    secondaryLabel: "More to watch",
    subjectPrefix: "LE BRIEF | Daily briefing",
    subtitle: "Daily energy, markets, and investment intelligence from Africa",
    titlePrefix: "Daily newsletter",
    unsubscribePrefix: "Unsubscribe",
  },
  fr: {
    bodyIntro: "Les sujets majeurs publies sur LE BRIEF au cours des dernieres 24 heures.",
    ctaLabel: "Lire l'article",
    footerNote: "Vous recevez cette newsletter car votre adresse email est inscrite sur LE BRIEF.",
    headlineLabel: "Temps fort",
    readMoreLabel: "Continuer la lecture",
    secondaryLabel: "A lire aussi",
    subjectPrefix: "LE BRIEF | Le point quotidien",
    subtitle: "Brief quotidien Energie, marches et investissements en Afrique",
    titlePrefix: "Newsletter quotidienne",
    unsubscribePrefix: "Se desinscrire",
  },
};

function normalizeText(value?: string | null) {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/\u00a0/g, " ").trim();
}

function normalizeComparableText(value?: string | null) {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function normalizeNewsletterEmail(email: string) {
  return normalizeText(email)
    .replace(/^["'<(]+/, "")
    .replace(/[>"'):,;]+$/, "")
    .toLowerCase();
}

export function extractEmailsFromText(rawText: string) {
  const matches = rawText.match(EMAIL_REGEX) || [];
  const uniqueEmails = new Set<string>();

  for (const match of matches) {
    const normalized = normalizeNewsletterEmail(match);
    if (normalized) {
      uniqueEmails.add(normalized);
    }
  }

  return Array.from(uniqueEmails);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function getLocalizedArticleField(
  article: any,
  field: "excerpt" | "title",
  language: NewsletterLanguage = "fr",
) {
  const suffix = language.charAt(0).toUpperCase() + language.slice(1);
  return (
    normalizeText(article[`${field}${suffix}`]) ||
    normalizeText(article[`${field}Fr`]) ||
    normalizeText(article[`${field}En`]) ||
    normalizeText(article[`${field}Ar`]) ||
    ""
  );
}

function getArticleTitle(article: any, language: NewsletterLanguage = "fr") {
  return getLocalizedArticleField(article, "title", language) || "Article LE BRIEF";
}

function getArticleExcerpt(article: any, language: NewsletterLanguage = "fr") {
  return getLocalizedArticleField(article, "excerpt", language);
}

function hasArticleCustomImage(article: any) {
  return Boolean(normalizeText(article.imageUrl));
}

function getArticleImageUrl(article: any) {
  const imageUrl = normalizeText(article.imageUrl);
  if (!imageUrl) {
    return `${SITE_URL}/media/lebrief-share-preview.jpeg`;
  }

  return imageUrl.startsWith("http") ? imageUrl : new URL(imageUrl, SITE_URL).toString();
}

function getArticleUrl(articleId: number) {
  return `${SITE_URL}/article/${articleId}`;
}

function buildArticleComparableCorpus(article: any) {
  return normalizeComparableText(
    [
      article.titleFr,
      article.titleEn,
      article.titleAr,
      article.excerptFr,
      article.excerptEn,
      article.excerptAr,
    ]
      .map((value) => normalizeText(value))
      .filter(Boolean)
      .join(" "),
  );
}

function containsAnyTerm(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function scoreDailyNewsletterArticle(article: any, language: NewsletterLanguage = "fr") {
  const comparableTitle = normalizeComparableText(
    [
      getArticleTitle(article, language),
      article.titleFr,
      article.titleEn,
      article.titleAr,
    ]
      .map((value) => normalizeText(value))
      .filter(Boolean)
      .join(" "),
  );
  const comparableExcerpt = normalizeComparableText(
    [
      getArticleExcerpt(article, language),
      article.excerptFr,
      article.excerptEn,
      article.excerptAr,
    ]
      .map((value) => normalizeText(value))
      .filter(Boolean)
      .join(" "),
  );
  const comparableCorpus = buildArticleComparableCorpus(article);

  let score = 0;

  if (hasArticleCustomImage(article)) {
    score += 80;
  }

  if (containsAnyTerm(comparableTitle, SENEGAL_PRIORITY_TERMS)) {
    score += 500;
  } else if (containsAnyTerm(comparableExcerpt, SENEGAL_PRIORITY_TERMS) || containsAnyTerm(comparableCorpus, SENEGAL_PRIORITY_TERMS)) {
    score += 360;
  }

  if (containsAnyTerm(comparableTitle, AFRICAN_PRIORITY_TERMS)) {
    score += 240;
  } else if (containsAnyTerm(comparableExcerpt, AFRICAN_PRIORITY_TERMS) || containsAnyTerm(comparableCorpus, AFRICAN_PRIORITY_TERMS)) {
    score += 140;
  }

  if (normalizeText(getArticleExcerpt(article, language))) {
    score += 20;
  }

  if (article.publishedAt) {
    const publishedAt = new Date(article.publishedAt).getTime();
    if (!Number.isNaN(publishedAt)) {
      score += publishedAt / 1_000_000_000_000;
    }
  }

  return score;
}

export function selectDailyNewsletterArticles(
  articles: any[],
  language: NewsletterLanguage = "fr",
  limit = 5,
) {
  const ranked = [...articles].sort((left, right) => {
    const scoreDifference =
      scoreDailyNewsletterArticle(right, language) -
      scoreDailyNewsletterArticle(left, language);

    if (scoreDifference !== 0) {
      return scoreDifference;
    }

    const rightPublished = right.publishedAt ? new Date(right.publishedAt).getTime() : 0;
    const leftPublished = left.publishedAt ? new Date(left.publishedAt).getTime() : 0;
    return rightPublished - leftPublished;
  });

  return ranked.slice(0, limit);
}

function formatNewsletterDate(value: Date, language: NewsletterLanguage = "fr") {
  const locale =
    language === "en" ? "en-US" : language === "ar" ? "ar-SA" : "fr-FR";

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(value);
}

function formatFrenchDate(value: Date) {
  return formatNewsletterDate(value, "fr");
}

function getWeeklyWindow(referenceDate = new Date()) {
  const anchor = new Date(
    Date.UTC(
      referenceDate.getUTCFullYear(),
      referenceDate.getUTCMonth(),
      referenceDate.getUTCDate(),
      0,
      0,
      0,
      0,
    ),
  );
  const day = anchor.getUTCDay();
  const offsetToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(anchor);
  start.setUTCDate(anchor.getUTCDate() + offsetToMonday);
  const endExclusive = new Date(start);
  endExclusive.setUTCDate(start.getUTCDate() + 7);

  return {
    endExclusive,
    start,
    weekKey: start.toISOString().slice(0, 10),
  };
}

function getNewsletterSigningSecret() {
  return ENV.cookieSecret || "lebrief-newsletter-secret";
}

export function createNewsletterUnsubscribeToken(email: string) {
  const normalizedEmail = normalizeNewsletterEmail(email);
  return createHmac("sha256", getNewsletterSigningSecret())
    .update(normalizedEmail)
    .digest("hex");
}

export function buildNewsletterUnsubscribeUrl(email: string) {
  const normalizedEmail = normalizeNewsletterEmail(email);
  const token = createNewsletterUnsubscribeToken(normalizedEmail);
  const url = new URL("/api/newsletter/unsubscribe", SITE_URL);
  url.searchParams.set("email", normalizedEmail);
  url.searchParams.set("token", token);
  return url.toString();
}

export function verifyNewsletterUnsubscribeToken(email: string, token: string) {
  const expected = createNewsletterUnsubscribeToken(email);
  const expectedBuffer = Buffer.from(expected, "utf8");
  const actualBuffer = Buffer.from(token, "utf8");

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
}

export async function unsubscribeNewsletterEmail(email: string, token: string) {
  const normalizedEmail = normalizeNewsletterEmail(email);
  if (!normalizedEmail || !verifyNewsletterUnsubscribeToken(normalizedEmail, token)) {
    return false;
  }

  await deleteSubscriberByEmail(normalizedEmail);
  return true;
}

export async function importSubscribersFromText(
  rawText: string,
  options: {
    defaultLanguage?: "fr" | "en" | "ar";
  } = {},
) {
  const extractedEmails = extractEmailsFromText(rawText);
  if (extractedEmails.length === 0) {
    return {
      duplicateCount: 0,
      importedCount: 0,
      totalDetected: 0,
    };
  }

  const existingEmails = new Set(await getExistingSubscriberEmails(extractedEmails));
  const items = extractedEmails.map((email) => ({
    email,
    language: options.defaultLanguage ?? "fr",
  }));

  await bulkUpsertSubscribers(items);

  return {
    duplicateCount: extractedEmails.filter((email) => existingEmails.has(email)).length,
    importedCount: extractedEmails.filter((email) => !existingEmails.has(email)).length,
    totalDetected: extractedEmails.length,
  };
}

function buildWeeklyNewsletterHtml(articles: any[], weekStart: Date) {
  const headlineArticle = articles[0];
  const otherArticles = articles.slice(1);
  const formattedWeek = formatFrenchDate(weekStart);

  const heroHtml = headlineArticle
    ? `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
        <tr>
          <td style="padding-bottom:24px;">
            <img src="${escapeHtml(getArticleImageUrl(headlineArticle))}" alt="${escapeHtml(getArticleTitle(headlineArticle))}" style="width:100%;height:auto;border-radius:18px;display:block;" />
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:12px;color:#d62828;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;">Temps fort</td>
        </tr>
        <tr>
          <td style="padding-bottom:12px;color:#0f172a;font-size:32px;font-weight:700;line-height:1.2;">
            ${escapeHtml(getArticleTitle(headlineArticle))}
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:20px;color:#475569;font-size:16px;line-height:1.7;">
            ${escapeHtml(getArticleExcerpt(headlineArticle))}
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:36px;">
            <a href="${escapeHtml(getArticleUrl(headlineArticle.id))}" style="display:inline-block;background:#d62828;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:999px;">Lire l'article</a>
          </td>
        </tr>
      </table>
    `
    : "";

  const listHtml = otherArticles
    .map((article) => {
      const articleDate = article.publishedAt ? formatFrenchDate(new Date(article.publishedAt)) : "";
      return `
        <tr>
          <td style="padding:0 0 18px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
              <tr>
                <td style="padding:20px;">
                  <div style="color:#d62828;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding-bottom:8px;">${escapeHtml(articleDate)}</div>
                  <div style="color:#0f172a;font-size:20px;font-weight:700;line-height:1.35;padding-bottom:8px;">${escapeHtml(getArticleTitle(article))}</div>
                  <div style="color:#475569;font-size:15px;line-height:1.7;padding-bottom:14px;">${escapeHtml(getArticleExcerpt(article))}</div>
                  <a href="${escapeHtml(getArticleUrl(article.id))}" style="color:#0f172a;font-size:14px;font-weight:700;text-decoration:none;">Continuer la lecture</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `;
    })
    .join("");

  return `
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>LE BRIEF | Newsletter hebdomadaire</title>
  </head>
  <body style="margin:0;background:#f8fafc;font-family:Inter,Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f8fafc;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;max-width:720px;background:#ffffff;border-radius:28px;overflow:hidden;">
            <tr>
              <td style="padding:36px 36px 28px;background:#05070c;color:#ffffff;">
                <div style="font-size:34px;font-weight:800;letter-spacing:-0.03em;">
                  <span style="color:#ffffff;">LE </span><span style="color:#d62828;">BRIEF</span>
                </div>
                <div style="padding-top:18px;color:#f8fafc;font-size:28px;font-weight:700;line-height:1.25;">
                  Veille hebdomadaire Energie & Marche
                </div>
                <div style="padding-top:10px;color:#cbd5e1;font-size:16px;line-height:1.7;">
                  Les articles marquants publies sur LE BRIEF pour la semaine du ${escapeHtml(formattedWeek)}.
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:36px;">
                ${heroHtml}
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                  <tr>
                    <td style="padding:0 0 18px;color:#0f172a;font-size:22px;font-weight:700;">A lire aussi</td>
                  </tr>
                  ${listHtml}
                </table>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border-top:1px solid #e2e8f0;margin-top:8px;">
                  <tr>
                    <td style="padding-top:24px;color:#64748b;font-size:13px;line-height:1.8;">
                      Vous recevez cette newsletter car votre adresse email est inscrite sur LE BRIEF.
                      <br />
                      <a href="${escapeHtml(SITE_URL)}" style="color:#d62828;text-decoration:none;">www.lebrief.energy</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();
}

function buildWeeklyNewsletterText(articles: any[], weekStart: Date) {
  const lines = [
    "LE BRIEF",
    `Newsletter hebdomadaire - semaine du ${formatFrenchDate(weekStart)}`,
    "",
    "Les articles marquants de la semaine :",
    "",
  ];

  for (const article of articles) {
    lines.push(`- ${getArticleTitle(article)}`);
    const excerpt = getArticleExcerpt(article);
    if (excerpt) {
      lines.push(`  ${excerpt}`);
    }
    lines.push(`  ${getArticleUrl(article.id)}`);
    lines.push("");
  }

  lines.push(`Se desinscrire: ${buildNewsletterUnsubscribeUrl(DEFAULT_RECIPIENT_ANCHOR)}`);
  return lines.join("\n");
}

export function getDailyCampaignKey(referenceDate = new Date(), language: NewsletterLanguage = "fr") {
  const anchor = new Date(
    Date.UTC(
      referenceDate.getUTCFullYear(),
      referenceDate.getUTCMonth(),
      referenceDate.getUTCDate(),
      0,
      0,
      0,
      0,
    ),
  );
  return `daily-${language}-${anchor.toISOString().slice(0, 10)}`;
}

function getDailyWindow(referenceDate = new Date(), language: NewsletterLanguage = "fr") {
  const anchor = new Date(
    Date.UTC(
      referenceDate.getUTCFullYear(),
      referenceDate.getUTCMonth(),
      referenceDate.getUTCDate(),
      0,
      0,
      0,
      0,
    ),
  );
  const lookbackStart = new Date(anchor);
  lookbackStart.setUTCDate(anchor.getUTCDate() - 1);
  const endExclusive = new Date(anchor);
  endExclusive.setUTCDate(anchor.getUTCDate() + 1);

  return {
    anchor,
    endExclusive,
    key: getDailyCampaignKey(referenceDate, language),
    lookbackStart,
  };
}

function buildDailyNewsletterHtml(
  articles: any[],
  referenceDate: Date,
  language: NewsletterLanguage = "fr",
) {
  const copy = DAILY_NEWSLETTER_COPY[language];
  const headlineArticle = articles[0];
  const otherArticles = articles.slice(1);
  const formattedDate = formatNewsletterDate(referenceDate, language);

  const heroHtml = headlineArticle
    ? `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
        <tr>
          <td style="padding-bottom:24px;">
            <img src="${escapeHtml(getArticleImageUrl(headlineArticle))}" alt="${escapeHtml(getArticleTitle(headlineArticle, language))}" style="width:100%;height:auto;border-radius:18px;display:block;" />
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:12px;color:#d62828;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;">${escapeHtml(copy.headlineLabel)}</td>
        </tr>
        <tr>
          <td style="padding-bottom:12px;color:#0f172a;font-size:32px;font-weight:700;line-height:1.2;">
            ${escapeHtml(getArticleTitle(headlineArticle, language))}
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:20px;color:#475569;font-size:16px;line-height:1.7;">
            ${escapeHtml(getArticleExcerpt(headlineArticle, language))}
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:36px;">
            <a href="${escapeHtml(getArticleUrl(headlineArticle.id))}" style="display:inline-block;background:#d62828;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:999px;">${escapeHtml(copy.ctaLabel)}</a>
          </td>
        </tr>
      </table>
    `
    : "";

  const listHtml = otherArticles
    .map((article) => {
      const articleDate = article.publishedAt
        ? formatNewsletterDate(new Date(article.publishedAt), language)
        : "";
      return `
        <tr>
          <td style="padding:0 0 18px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
              <tr>
                <td>
                  <img src="${escapeHtml(getArticleImageUrl(article))}" alt="${escapeHtml(getArticleTitle(article, language))}" style="width:100%;height:auto;display:block;" />
                </td>
              </tr>
              <tr>
                <td style="padding:20px;">
                  <div style="color:#d62828;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding-bottom:8px;">${escapeHtml(articleDate)}</div>
                  <div style="color:#0f172a;font-size:20px;font-weight:700;line-height:1.35;padding-bottom:8px;">${escapeHtml(getArticleTitle(article, language))}</div>
                  <div style="color:#475569;font-size:15px;line-height:1.7;padding-bottom:14px;">${escapeHtml(getArticleExcerpt(article, language))}</div>
                  <a href="${escapeHtml(getArticleUrl(article.id))}" style="color:#0f172a;font-size:14px;font-weight:700;text-decoration:none;">${escapeHtml(copy.readMoreLabel)}</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `;
    })
    .join("");

  return `
<!doctype html>
<html lang="${language}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(copy.titlePrefix)}</title>
  </head>
  <body style="margin:0;background:#f8fafc;font-family:Inter,Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f8fafc;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;max-width:720px;background:#ffffff;border-radius:28px;overflow:hidden;">
            <tr>
              <td style="padding:36px 36px 28px;background:#05070c;color:#ffffff;">
                <div style="font-size:34px;font-weight:800;letter-spacing:-0.03em;">
                  <span style="color:#ffffff;">LE </span><span style="color:#d62828;">BRIEF</span>
                </div>
                <div style="padding-top:18px;color:#f8fafc;font-size:28px;font-weight:700;line-height:1.25;">
                  ${escapeHtml(copy.titlePrefix)} - ${escapeHtml(formattedDate)}
                </div>
                <div style="padding-top:10px;color:#cbd5e1;font-size:16px;line-height:1.7;">
                  ${escapeHtml(copy.subtitle)}
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:36px;">
                <div style="padding-bottom:18px;color:#475569;font-size:15px;line-height:1.8;">
                  ${escapeHtml(copy.bodyIntro)}
                </div>
                ${heroHtml}
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                  <tr>
                    <td style="padding:0 0 18px;color:#0f172a;font-size:22px;font-weight:700;">${escapeHtml(copy.secondaryLabel)}</td>
                  </tr>
                  ${listHtml}
                </table>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border-top:1px solid #e2e8f0;margin-top:8px;">
                  <tr>
                    <td style="padding-top:24px;color:#64748b;font-size:13px;line-height:1.8;">
                      ${escapeHtml(copy.footerNote)}
                      <br />
                      <a href="${escapeHtml(SITE_URL)}" style="color:#d62828;text-decoration:none;">www.lebrief.energy</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();
}

function buildDailyNewsletterText(
  articles: any[],
  referenceDate: Date,
  language: NewsletterLanguage = "fr",
) {
  const copy = DAILY_NEWSLETTER_COPY[language];
  const lines = [
    "LE BRIEF",
    `${copy.titlePrefix} - ${formatNewsletterDate(referenceDate, language)}`,
    "",
    copy.bodyIntro,
    "",
  ];

  for (const article of articles) {
    lines.push(`- ${getArticleTitle(article, language)}`);
    const excerpt = getArticleExcerpt(article, language);
    if (excerpt) {
      lines.push(`  ${excerpt}`);
    }
    lines.push(`  ${getArticleUrl(article.id)}`);
    lines.push("");
  }

  lines.push(`${copy.unsubscribePrefix}: ${buildNewsletterUnsubscribeUrl(DEFAULT_RECIPIENT_ANCHOR)}`);
  return lines.join("\n");
}

async function buildDailyNewsletterDraftPayload(
  referenceDate = new Date(),
  language: NewsletterLanguage = "fr",
) {
  const dailyWindow = getDailyWindow(referenceDate, language);
  const allArticles = await getPublishedArticles(12, 0);
  const recentArticles = allArticles.filter((article) => {
    if (!article.publishedAt) {
      return false;
    }

    const publishedAt = new Date(article.publishedAt);
    return publishedAt >= dailyWindow.lookbackStart && publishedAt < dailyWindow.endExclusive;
  });
  const basePool = recentArticles.length >= 3 ? recentArticles : allArticles;
  const selectedArticles = selectDailyNewsletterArticles(basePool, language, 5);

  if (selectedArticles.length === 0) {
    throw new Error("No published articles available to generate the daily newsletter.");
  }

  const copy = DAILY_NEWSLETTER_COPY[language];
  const subject = `${copy.subjectPrefix} - ${formatNewsletterDate(dailyWindow.anchor, language)}`;
  const title = `${copy.titlePrefix} - ${formatNewsletterDate(dailyWindow.anchor, language)}`;
  const previewText = truncateText(
    getArticleExcerpt(selectedArticles[0], language) ||
      "Retrouvez les analyses et actualites marquantes publiees sur LE BRIEF.",
    320,
  );

  return {
    articleCount: selectedArticles.length,
    articleIds: selectedArticles.map((article) => article.id).join(","),
    htmlContent: buildDailyNewsletterHtml(selectedArticles, dailyWindow.anchor, language),
    key: dailyWindow.key,
    previewText,
    status: "draft" as const,
    subject: truncateText(subject, 255),
    textContent: buildDailyNewsletterText(selectedArticles, dailyWindow.anchor, language),
    title: truncateText(title, 255),
  };
}

async function buildWeeklyNewsletterDraftPayload(referenceDate = new Date()) {
  const weeklyWindow = getWeeklyWindow(referenceDate);
  const allArticles = await getPublishedArticles(18, 0);
  const weeklyArticles = allArticles.filter((article) => {
    if (!article.publishedAt) {
      return false;
    }

    const publishedAt = new Date(article.publishedAt);
    return publishedAt >= weeklyWindow.start && publishedAt < weeklyWindow.endExclusive;
  });
  const selectedArticles = (weeklyArticles.length >= 3 ? weeklyArticles : allArticles).slice(0, 6);

  if (selectedArticles.length === 0) {
    throw new Error("No published articles available to generate the weekly newsletter draft.");
  }

  const subject = `LE BRIEF | Les temps forts de la semaine du ${formatFrenchDate(weeklyWindow.start)}`;
  const title = `Newsletter hebdomadaire - ${formatFrenchDate(weeklyWindow.start)}`;
  const previewText = truncateText(
    getArticleExcerpt(selectedArticles[0]) ||
      "Retrouvez les analyses et actualites marquantes de la semaine sur LE BRIEF.",
    320,
  );

  return {
    articleCount: selectedArticles.length,
    articleIds: selectedArticles.map((article) => article.id).join(","),
    htmlContent: buildWeeklyNewsletterHtml(selectedArticles, weeklyWindow.start),
    previewText,
    status: "draft" as const,
    subject: truncateText(subject, 255),
    textContent: buildWeeklyNewsletterText(selectedArticles, weeklyWindow.start),
    title: truncateText(title, 255),
    weekKey: weeklyWindow.weekKey,
  };
}

export async function generateDailyNewsletterCampaign(
  options: { force?: boolean; language?: NewsletterLanguage } = {},
) {
  const language = options.language ?? "fr";
  const payload = await buildDailyNewsletterDraftPayload(new Date(), language);
  const existingCampaign = await getNewsletterCampaignByWeekKey(payload.key);

  if (existingCampaign?.status === "sent") {
    return {
      campaign: existingCampaign,
      created: false,
      updated: false,
    };
  }

  if (existingCampaign && !options.force) {
    return {
      campaign: existingCampaign,
      created: false,
      updated: false,
    };
  }

  if (existingCampaign) {
    await updateNewsletterCampaign(existingCampaign.id, {
      articleCount: payload.articleCount,
      articleIds: payload.articleIds,
      htmlContent: payload.htmlContent,
      lastError: null,
      previewText: payload.previewText,
      status: "draft",
      subject: payload.subject,
      textContent: payload.textContent,
      title: payload.title,
    });

    const refreshed = await getNewsletterCampaignById(existingCampaign.id);
    return {
      campaign: refreshed ?? existingCampaign,
      created: false,
      updated: true,
    };
  }

  const insertedId = await createNewsletterCampaign({
    articleCount: payload.articleCount,
    articleIds: payload.articleIds,
    htmlContent: payload.htmlContent,
    language,
    previewText: payload.previewText,
    status: "draft",
    subject: payload.subject,
    textContent: payload.textContent,
    title: payload.title,
    weekKey: payload.key,
  });

  const createdCampaign = await getNewsletterCampaignById(insertedId);
  return {
    campaign: createdCampaign,
    created: true,
    updated: false,
  };
}

export async function generateWeeklyNewsletterDraft(options: { force?: boolean } = {}) {
  const payload = await buildWeeklyNewsletterDraftPayload();
  const existingCampaign = await getNewsletterCampaignByWeekKey(payload.weekKey);

  if (existingCampaign?.status === "sent") {
    return {
      campaign: existingCampaign,
      created: false,
      updated: false,
    };
  }

  if (existingCampaign && !options.force) {
    return {
      campaign: existingCampaign,
      created: false,
      updated: false,
    };
  }

  if (existingCampaign) {
    await updateNewsletterCampaign(existingCampaign.id, {
      articleCount: payload.articleCount,
      articleIds: payload.articleIds,
      htmlContent: payload.htmlContent,
      lastError: null,
      previewText: payload.previewText,
      status: "draft",
      subject: payload.subject,
      textContent: payload.textContent,
      title: payload.title,
    });

    const refreshed = await getNewsletterCampaignById(existingCampaign.id);
    return {
      campaign: refreshed ?? existingCampaign,
      created: false,
      updated: true,
    };
  }

  const insertedId = await createNewsletterCampaign({
    articleCount: payload.articleCount,
    articleIds: payload.articleIds,
    htmlContent: payload.htmlContent,
    language: "fr",
    previewText: payload.previewText,
    status: "draft",
    subject: payload.subject,
    textContent: payload.textContent,
    title: payload.title,
    weekKey: payload.weekKey,
  });

  const createdCampaign = await getNewsletterCampaignById(insertedId);
  return {
    campaign: createdCampaign,
    created: true,
    updated: false,
  };
}

export function isNewsletterSendConfigured() {
  return Boolean(ENV.resendApiKey && ENV.newsletterFromEmail);
}

function getNewsletterFromEmail() {
  return ENV.newsletterFromEmail || DEFAULT_FROM_EMAIL;
}

type ResendChunkPayload = {
  html: string;
  recipients: string[];
  subject: string;
  text: string;
};

async function postResendChunk(from: string, { html, recipients, subject, text }: ResendChunkPayload) {
  const response = await fetch(RESEND_API_BASE_URL, {
    body: JSON.stringify({
      bcc: recipients,
      from,
      html,
      subject,
      text,
      to: [ENV.newsletterAnchorRecipient || DEFAULT_RECIPIENT_ANCHOR],
    }),
    headers: {
      Authorization: `Bearer ${ENV.resendApiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend send failed (${response.status}): ${errorText}`);
  }
}

export function shouldRetryNewsletterWithResendOnboarding(errorMessage: string) {
  const normalized = normalizeText(errorMessage).toLowerCase();
  return (
    normalized.includes("domain is not verified") ||
    normalized.includes("add and verify your domain") ||
    normalized.includes("verify your domain")
  );
}

async function sendResendChunk(payload: ResendChunkPayload) {
  const preferredFrom = getNewsletterFromEmail();

  try {
    await postResendChunk(preferredFrom, payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (
      preferredFrom.toLowerCase() !== RESEND_ONBOARDING_FROM_EMAIL.toLowerCase() &&
      shouldRetryNewsletterWithResendOnboarding(message)
    ) {
      await postResendChunk(RESEND_ONBOARDING_FROM_EMAIL, payload);
      return;
    }

    throw error;
  }
}

function chunkArray<T>(items: T[], chunkSize: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }
  return chunks;
}

export function chunkNewsletterRecipients(recipients: string[]) {
  return chunkArray(recipients, NEWSLETTER_RESEND_BCC_CHUNK_SIZE);
}

export async function sendNewsletterCampaignById(campaignId: number) {
  const campaign = await getNewsletterCampaignById(campaignId);
  if (!campaign) {
    throw new Error("Newsletter campaign not found.");
  }

  if (campaign.status === "sent") {
    throw new Error("This newsletter campaign has already been sent.");
  }

  if (!isNewsletterSendConfigured()) {
    throw new Error("RESEND_API_KEY and NEWSLETTER_FROM_EMAIL must be configured before sending newsletters.");
  }

  const subscribers = await getAllSubscribers(campaign.language);
  const recipients = subscribers.map((subscriber) => normalizeNewsletterEmail(subscriber.email)).filter(Boolean);

  if (recipients.length === 0) {
    throw new Error("No newsletter subscribers are available for this language.");
  }

  await updateNewsletterCampaign(campaign.id, {
    lastError: null,
    recipientCount: recipients.length,
    sentCount: 0,
    status: "sending",
  });

  try {
    let sentCount = 0;
    for (const recipientChunk of chunkNewsletterRecipients(recipients)) {
      const chunkHtml = recipientChunk.reduce((html, email) => {
        return html.replaceAll(
          buildNewsletterUnsubscribeUrl(DEFAULT_RECIPIENT_ANCHOR),
          buildNewsletterUnsubscribeUrl(email),
        );
      }, campaign.htmlContent);
      const chunkText = recipientChunk.reduce((text, email) => {
        return text.replaceAll(
          buildNewsletterUnsubscribeUrl(DEFAULT_RECIPIENT_ANCHOR),
          buildNewsletterUnsubscribeUrl(email),
        );
      }, campaign.textContent);

      await sendResendChunk({
        html: chunkHtml,
        recipients: recipientChunk,
        subject: campaign.subject,
        text: chunkText,
      });
      sentCount += recipientChunk.length;
    }

    await updateNewsletterCampaign(campaign.id, {
      lastError: null,
      recipientCount: recipients.length,
      sentAt: new Date(),
      sentCount,
      status: "sent",
    });

    return {
      batches: Math.ceil(recipients.length / 50),
      recipientCount: recipients.length,
      sentCount,
      success: true,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown newsletter send error";
    await updateNewsletterCampaign(campaign.id, {
      lastError: message,
      status: "failed",
    });
    throw error;
  }
}

export async function triggerDailyNewsletterAutomation(options: { force?: boolean } = {}) {
  if (!isNewsletterSendConfigured()) {
    return {
      results: [],
      skipped: true,
      reason: "send-not-configured",
    };
  }

  const languages: NewsletterLanguage[] = ["fr", "en", "ar"];
  const results: Array<Record<string, unknown>> = [];

  for (const language of languages) {
    const subscribers = await getAllSubscribers(language);
    if (subscribers.length === 0) {
      results.push({
        language,
        reason: "no-subscribers",
        skipped: true,
      });
      continue;
    }

    const draftResult = await generateDailyNewsletterCampaign({
      force: options.force,
      language,
    });

    if (!draftResult.campaign) {
      results.push({
        language,
        reason: "campaign-not-created",
        skipped: true,
      });
      continue;
    }

    if (draftResult.campaign.status === "sent") {
      results.push({
        campaignId: draftResult.campaign.id,
        language,
        reason: "already-sent",
        skipped: true,
      });
      continue;
    }

    const sendResult = await sendNewsletterCampaignById(draftResult.campaign.id);
    results.push({
      campaignId: draftResult.campaign.id,
      created: draftResult.created,
      language,
      skipped: false,
      updated: draftResult.updated,
      ...sendResult,
    });
  }

  return {
    results,
    skipped: results.every((item) => item.skipped === true),
  };
}

export async function triggerWeeklyNewsletterDraftAutomation(options: { force?: boolean } = {}) {
  return generateWeeklyNewsletterDraft(options);
}
