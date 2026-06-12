import { afterEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

async function loadSearchConsoleModule() {
  vi.resetModules();
  return import("./_core/searchConsole");
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  process.env = { ...ORIGINAL_ENV };
});

describe("search console automation", () => {
  it("uses OAuth refresh token credentials when configured", async () => {
    process.env.SEARCH_CONSOLE_OAUTH_CLIENT_ID = "oauth-client-id";
    process.env.SEARCH_CONSOLE_OAUTH_CLIENT_SECRET = "oauth-client-secret";
    process.env.SEARCH_CONSOLE_OAUTH_REFRESH_TOKEN = "oauth-refresh-token";
    process.env.SEARCH_CONSOLE_PROPERTY = "https://www.lebrief.energy/";

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: "oauth-access-token" }), {
          headers: { "Content-Type": "application/json" },
          status: 200,
        }),
      )
      .mockResolvedValue(
        new Response("", {
          status: 200,
        }),
      );

    vi.stubGlobal("fetch", fetchMock);

    const { isSearchConsoleConfigured, submitSearchConsoleSitemaps } =
      await loadSearchConsoleModule();

    expect(isSearchConsoleConfigured()).toBe(true);

    const result = await submitSearchConsoleSitemaps([
      "https://www.lebrief.energy/sitemap.xml",
      "https://www.lebrief.energy/news-sitemap.xml",
    ]);

    expect(result).toEqual({
      property: "https://www.lebrief.energy/",
      skipped: false,
      sitemapUrls: [
        "https://www.lebrief.energy/sitemap.xml",
        "https://www.lebrief.energy/news-sitemap.xml",
      ],
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://oauth2.googleapis.com/token");
    expect(String(fetchMock.mock.calls[0]?.[1]?.body)).toContain("grant_type=refresh_token");
    expect(String(fetchMock.mock.calls[0]?.[1]?.body)).toContain("client_id=oauth-client-id");
    expect(String(fetchMock.mock.calls[0]?.[1]?.body)).toContain(
      "client_secret=oauth-client-secret",
    );
    expect(String(fetchMock.mock.calls[0]?.[1]?.body)).toContain(
      "refresh_token=oauth-refresh-token",
    );
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      "https://www.googleapis.com/webmasters/v3/sites/https%3A%2F%2Fwww.lebrief.energy%2F/sitemaps/https%3A%2F%2Fwww.lebrief.energy%2Fsitemap.xml",
    );
    expect(fetchMock.mock.calls[2]?.[0]).toBe(
      "https://www.googleapis.com/webmasters/v3/sites/https%3A%2F%2Fwww.lebrief.energy%2F/sitemaps/https%3A%2F%2Fwww.lebrief.energy%2Fnews-sitemap.xml",
    );
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({
      headers: {
        Authorization: "Bearer oauth-access-token",
      },
      method: "PUT",
    });
  });
});
