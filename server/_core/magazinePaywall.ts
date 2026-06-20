import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { parse as parseCookie } from "cookie";
import { PDFDocument } from "pdf-lib";
import { ONE_YEAR_MS } from "@shared/const";
import { ENV } from "./env";
import { getSessionCookieOptions } from "./cookies";
import { SITE_URL } from "./seo";

const MAGAZINE_ACCESS_COOKIE_NAME = "le_brief_magazine_access";
const MAGAZINE_ACCESS_COOKIE_VERSION = 1;
const MAGAZINE_ACCESS_EMAIL_API = "https://api.resend.com/emails";

export const DEFAULT_MAGAZINE_PREVIEW_PAGE_COUNT = 3;
export const DEFAULT_MAGAZINE_PRICE_FCFA = 1000;
export const DEFAULT_MAGAZINE_WAVE_NUMBER = "+221 76 300 90 53";
export const DEFAULT_MAGAZINE_WAVE_QR_PATH = "/media/wave-magazine-pay-qr.jpg";

type MagazineAccessCookiePayload = {
  grantedMagazineIds: number[];
  issuedAt: number;
  version: number;
};

const previewPdfCache = new Map<string, Buffer>();

function getMagazinePaywallSigningSecret() {
  return ENV.cookieSecret || "le-brief-magazine-access-secret";
}

function normalizeMagazineIds(ids: number[]) {
  return Array.from(
    new Set(
      ids
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0),
    ),
  ).sort((left, right) => left - right);
}

function signMagazineAccessPayload(payloadBase64: string) {
  return createHmac("sha256", getMagazinePaywallSigningSecret()).update(payloadBase64).digest("hex");
}

function encodeMagazineAccessCookieValue(payload: MagazineAccessCookiePayload) {
  const serialized = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = signMagazineAccessPayload(serialized);
  return `${serialized}.${signature}`;
}

function decodeMagazineAccessCookieValue(value: string): MagazineAccessCookiePayload | null {
  const [payloadBase64 = "", providedSignature = ""] = value.split(".");
  if (!payloadBase64 || !providedSignature) {
    return null;
  }

  const expectedSignature = signMagazineAccessPayload(payloadBase64);
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  const providedBuffer = Buffer.from(providedSignature, "utf8");

  if (expectedBuffer.length !== providedBuffer.length || !timingSafeEqual(expectedBuffer, providedBuffer)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payloadBase64, "base64url").toString("utf8")) as MagazineAccessCookiePayload;
    return {
      grantedMagazineIds: normalizeMagazineIds(parsed.grantedMagazineIds || []),
      issuedAt: Number(parsed.issuedAt || Date.now()),
      version: Number(parsed.version || MAGAZINE_ACCESS_COOKIE_VERSION),
    };
  } catch {
    return null;
  }
}

function readCookieHeader(req: any) {
  const header = req?.headers?.cookie;
  return typeof header === "string" ? header : "";
}

export function readGrantedMagazineIdsFromRequest(req: any) {
  const cookies = parseCookie(readCookieHeader(req) || "");
  const cookieValue = cookies[MAGAZINE_ACCESS_COOKIE_NAME];
  if (!cookieValue) {
    return [];
  }

  const decoded = decodeMagazineAccessCookieValue(cookieValue);
  return decoded?.grantedMagazineIds || [];
}

export function hasUnlockedMagazineAccess(
  req: any,
  magazine: {
    id: number;
    isPremium?: boolean | null;
  } | null | undefined,
) {
  if (!magazine) {
    return false;
  }

  if (!magazine.isPremium) {
    return true;
  }

  return readGrantedMagazineIdsFromRequest(req).includes(Number(magazine.id));
}

export function grantMagazineAccess(req: any, res: any, magazineId: number) {
  const grantedIds = normalizeMagazineIds([...readGrantedMagazineIdsFromRequest(req), magazineId]);
  const nextValue = encodeMagazineAccessCookieValue({
    grantedMagazineIds: grantedIds,
    issuedAt: Date.now(),
    version: MAGAZINE_ACCESS_COOKIE_VERSION,
  });

  const cookieOptions = getSessionCookieOptions(req);
  res.cookie(MAGAZINE_ACCESS_COOKIE_NAME, nextValue, {
    ...cookieOptions,
    maxAge: ONE_YEAR_MS,
  });
}

export function createMagazinePaymentAccessToken() {
  return randomBytes(24).toString("hex");
}

export function buildMagazineAccessUrl(magazineId: number, accessToken: string) {
  const url = new URL("/api/magazine-access", SITE_URL);
  url.searchParams.set("magazineId", String(magazineId));
  url.searchParams.set("token", accessToken);
  return url.toString();
}

export function getMagazinePaywallPublicConfig(magazine?: {
  id: number;
  isPremium?: boolean | null;
  previewPageCount?: number | null;
  priceFcfa?: number | null;
}) {
  return {
    isPremium: Boolean(magazine?.isPremium ?? true),
    previewPageCount: Math.max(Number(magazine?.previewPageCount || DEFAULT_MAGAZINE_PREVIEW_PAGE_COUNT), 1),
    priceFcfa: Math.max(Number(magazine?.priceFcfa || DEFAULT_MAGAZINE_PRICE_FCFA), 0),
    waveNumber: DEFAULT_MAGAZINE_WAVE_NUMBER,
    waveQrImageUrl: `${SITE_URL}${DEFAULT_MAGAZINE_WAVE_QR_PATH}`,
  };
}

export async function buildPreviewPdfBuffer(sourcePdfBuffer: Buffer, previewPageCount: number) {
  const cacheKey = createHmac("sha1", "lebrief-magazine-preview-cache")
    .update(sourcePdfBuffer)
    .update(`:${previewPageCount}`)
    .digest("hex");

  const cached = previewPdfCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const previewDocument = await PDFDocument.create();
  const sourceDocument = await PDFDocument.load(sourcePdfBuffer);
  const cappedPageCount = Math.max(Math.min(previewPageCount, sourceDocument.getPageCount()), 1);
  const pageIndexes = Array.from({ length: cappedPageCount }, (_, index) => index);
  const copiedPages = await previewDocument.copyPages(sourceDocument, pageIndexes);

  copiedPages.forEach((page) => previewDocument.addPage(page));
  const bytes = Buffer.from(await previewDocument.save());
  previewPdfCache.set(cacheKey, bytes);
  return bytes;
}

export function getMagazinePaymentEmailSubject(issueLabel: string) {
  return `LE BRIEF | Acces magazine debloque - ${issueLabel}`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildMagazineUnlockEmailHtml(options: {
  accessUrl: string;
  issueLabel: string;
  magazineTitle: string;
  recipientName: string;
}) {
  return `
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(options.magazineTitle)}</title>
  </head>
  <body style="margin:0;background:#f8fafc;font-family:Inter,Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f8fafc;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;max-width:680px;background:#ffffff;border-radius:28px;overflow:hidden;">
            <tr>
              <td style="padding:36px;background:#05070c;color:#ffffff;">
                <div style="font-size:34px;font-weight:800;">
                  <span style="color:#ffffff;">LE </span><span style="color:#d62828;">BRIEF</span>
                </div>
                <div style="padding-top:16px;font-size:28px;font-weight:700;line-height:1.25;">
                  Votre acces magazine est pret
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:36px;">
                <p style="margin:0 0 16px;font-size:16px;line-height:1.8;">Bonjour ${escapeHtml(options.recipientName)},</p>
                <p style="margin:0 0 18px;font-size:16px;line-height:1.8;">
                  Votre paiement a ete valide. Vous pouvez maintenant lire l'integralite de <strong>${escapeHtml(options.magazineTitle)}</strong> sur LE BRIEF.
                </p>
                <p style="margin:0 0 24px;color:#64748b;font-size:14px;line-height:1.7;">${escapeHtml(options.issueLabel)}</p>
                <a href="${escapeHtml(options.accessUrl)}" style="display:inline-block;background:#d62828;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:999px;">Debloquer le magazine</a>
                <p style="margin:24px 0 0;color:#64748b;font-size:13px;line-height:1.8;">
                  Si le bouton ne fonctionne pas, utilisez ce lien :
                  <br />
                  <a href="${escapeHtml(options.accessUrl)}" style="color:#d62828;text-decoration:none;">${escapeHtml(options.accessUrl)}</a>
                </p>
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

function buildMagazineUnlockEmailText(options: {
  accessUrl: string;
  issueLabel: string;
  magazineTitle: string;
  recipientName: string;
}) {
  return [
    "LE BRIEF",
    "",
    `Bonjour ${options.recipientName},`,
    "",
    `Votre paiement a ete valide. Vous pouvez maintenant lire ${options.magazineTitle}.`,
    options.issueLabel,
    "",
    options.accessUrl,
  ].join("\n");
}

export function isMagazineAccessEmailConfigured() {
  return Boolean(ENV.resendApiKey && ENV.newsletterFromEmail);
}

export async function sendMagazineAccessEmail(options: {
  accessToken: string;
  magazine: {
    id: number;
    issueNumber?: number | null;
    titleFr?: string | null;
  };
  recipientEmail: string;
  recipientName: string;
}) {
  if (!isMagazineAccessEmailConfigured()) {
    return {
      sent: false,
      skipped: true,
    };
  }

  const issueLabel =
    typeof options.magazine.issueNumber === "number"
      ? `Numero ${options.magazine.issueNumber}`
      : "Magazine LE BRIEF";
  const magazineTitle = options.magazine.titleFr || issueLabel;
  const accessUrl = buildMagazineAccessUrl(options.magazine.id, options.accessToken);

  const response = await fetch(MAGAZINE_ACCESS_EMAIL_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ENV.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: ENV.newsletterFromEmail,
      to: [options.recipientEmail],
      subject: getMagazinePaymentEmailSubject(issueLabel),
      html: buildMagazineUnlockEmailHtml({
        accessUrl,
        issueLabel,
        magazineTitle,
        recipientName: options.recipientName,
      }),
      text: buildMagazineUnlockEmailText({
        accessUrl,
        issueLabel,
        magazineTitle,
        recipientName: options.recipientName,
      }),
    }),
  });

  if (!response.ok) {
    throw new Error(`Magazine access email failed (${response.status}): ${await response.text()}`);
  }

  return {
    accessUrl,
    sent: true,
    skipped: false,
  };
}
