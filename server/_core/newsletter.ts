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

function normalizeText(value?: string | null) {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/\u00a0/g, " ").trim();
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

function getArticleTitle(article: any) {
  return (
    normalizeText(article.titleFr) ||
    normalizeText(article.titleEn) ||
    normalizeText(article.titleAr) ||
    "Article LE BRIEF"
  );
}

function getArticleExcerpt(article: any) {
  return (
    normalizeText(article.excerptFr) ||
    normalizeText(article.excerptEn) ||
    normalizeText(article.excerptAr) ||
    ""
  );
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

function formatFrenchDate(value: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(value);
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

export async function triggerWeeklyNewsletterDraftAutomation(options: { force?: boolean } = {}) {
  return generateWeeklyNewsletterDraft(options);
}
