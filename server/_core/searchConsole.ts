import { SignJWT, importPKCS8 } from "jose";
import { ENV } from "./env";
import { MAIN_SITEMAP_URL, NEWS_SITEMAP_URL } from "./seo";

const GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
const SEARCH_CONSOLE_SCOPE = "https://www.googleapis.com/auth/webmasters";

type SearchConsoleConfig = {
  clientEmail: string;
  privateKey: string;
  privateKeyId?: string;
  property: string;
};

function normalizePrivateKey(privateKey: string) {
  return privateKey.replace(/\\n/g, "\n").trim();
}

function getSearchConsoleConfig(): SearchConsoleConfig | null {
  if (!ENV.searchConsoleClientEmail || !ENV.searchConsolePrivateKey) {
    return null;
  }

  return {
    clientEmail: ENV.searchConsoleClientEmail,
    privateKey: normalizePrivateKey(ENV.searchConsolePrivateKey),
    privateKeyId: ENV.searchConsolePrivateKeyId || undefined,
    property: ENV.searchConsoleProperty || "https://www.lebrief.energy/",
  };
}

export function isSearchConsoleConfigured() {
  return Boolean(getSearchConsoleConfig());
}

async function requestAccessToken(config: SearchConsoleConfig) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const algorithm = "RS256";
  const key = await importPKCS8(config.privateKey, algorithm);
  const assertion = await new SignJWT({ scope: SEARCH_CONSOLE_SCOPE })
    .setProtectedHeader({
      alg: algorithm,
      typ: "JWT",
      ...(config.privateKeyId ? { kid: config.privateKeyId } : {}),
    })
    .setIssuer(config.clientEmail)
    .setAudience(GOOGLE_OAUTH_TOKEN_URL)
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + 3600)
    .sign(key);

  const response = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      assertion,
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Search Console token request failed (${response.status}): ${details}`);
  }

  const payload = (await response.json()) as { access_token?: string };
  if (!payload.access_token) {
    throw new Error("Search Console token response did not include an access_token");
  }

  return payload.access_token;
}

export async function submitSearchConsoleSitemaps(
  sitemapUrls = [MAIN_SITEMAP_URL, NEWS_SITEMAP_URL],
) {
  const config = getSearchConsoleConfig();

  if (!config) {
    return {
      property: null,
      skipped: true as const,
      sitemapUrls: [] as string[],
    };
  }

  const accessToken = await requestAccessToken(config);
  const property = encodeURIComponent(config.property);

  for (const sitemapUrl of sitemapUrls) {
    const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${property}/sitemaps/${encodeURIComponent(sitemapUrl)}`;
    const response = await fetch(endpoint, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`Search Console sitemap submit failed for ${sitemapUrl} (${response.status}): ${details}`);
    }
  }

  return {
    property: config.property,
    skipped: false as const,
    sitemapUrls,
  };
}
