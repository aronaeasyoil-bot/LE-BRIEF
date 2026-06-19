import { SITE_URL } from "./seo";

type NullableText = null | string | undefined;

function normalizeMagazineDocumentUrl(value?: NullableText) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (!trimmed) {
    return "";
  }

  try {
    return new URL(trimmed, SITE_URL).toString();
  } catch {
    return "";
  }
}

export function getMagazineDocumentProxyUrl(magazineId: number) {
  return `${SITE_URL}/api/magazine-file/${magazineId}`;
}

export function extractAdobeShareDownloadUrl(html: string) {
  const match = html.match(/"download_url":"([^"]+)"/);
  if (!match?.[1]) {
    return "";
  }

  try {
    return JSON.parse(`"${match[1]}"`);
  } catch {
    return "";
  }
}

function isAdobeSharePageUrl(url: string) {
  return /^https:\/\/acrobat\.adobe\.com\/id\//i.test(url);
}

export async function resolveMagazineDocumentUrl(value?: NullableText) {
  const absoluteUrl = normalizeMagazineDocumentUrl(value);
  if (!absoluteUrl) {
    return "";
  }

  if (!isAdobeSharePageUrl(absoluteUrl)) {
    return absoluteUrl;
  }

  const response = await fetch(absoluteUrl, {
    headers: {
      "User-Agent": "LE BRIEF Magazine Proxy",
    },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Adobe share page (${response.status}).`);
  }

  const html = await response.text();
  const downloadUrl = extractAdobeShareDownloadUrl(html);
  if (!downloadUrl) {
    throw new Error("Unable to extract the Adobe shared PDF URL.");
  }

  return downloadUrl;
}
