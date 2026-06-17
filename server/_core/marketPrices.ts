import { DEFAULT_MARKET_PRICES, getMarketPrices, upsertMarketPrice } from "../db";

const USER_AGENT =
  "Mozilla/5.0 (compatible; LEBRIEFMarketBot/1.0; +https://www.lebrief.energy/robots.txt)";
const DAILY_UPDATE_INTERVAL_MS = 20 * 60 * 60 * 1000;

type MarketPriceInput = {
  changePercent: number;
  code: string;
  decimals: number;
  name: string;
  price: number;
  sourceLabel?: string | null;
  sourceUrl?: string | null;
  sortOrder: number;
  unit: string;
};

type MarketPriceRunResult = {
  errors: Array<{ code: string; message: string }>;
  forced: boolean;
  nextEligibleAt?: string;
  ran: boolean;
  reason?: "not_due";
  updated: number;
};

function parseFiniteNumber(value?: null | number | string) {
  if (value === null || value === undefined || value === "") return undefined;
  const normalized = typeof value === "string" ? value.replace(/\s+/g, "").replace(",", ".") : value;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function round(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function toDbPrice(input: MarketPriceInput) {
  return {
    changePercent: input.changePercent.toFixed(4),
    code: input.code,
    decimals: input.decimals,
    lastUpdatedAt: new Date(),
    name: input.name,
    price: input.price.toFixed(4),
    sourceLabel: input.sourceLabel || null,
    sourceUrl: input.sourceUrl || null,
    sortOrder: input.sortOrder,
    unit: input.unit,
  };
}

function getDefaultItem(code: string) {
  const item = DEFAULT_MARKET_PRICES.find((entry) => entry.code === code);
  if (!item) {
    throw new Error(`Default market price ${code} is not configured`);
  }
  return item;
}

function fromDefaultItem(code: string, overrides: Partial<MarketPriceInput>): MarketPriceInput {
  const item = getDefaultItem(code);
  return {
    changePercent: parseFiniteNumber(item.changePercent) ?? 0,
    code: item.code,
    decimals: item.decimals ?? 2,
    name: item.name,
    price: parseFiniteNumber(item.price) ?? 0,
    sourceLabel: item.sourceLabel,
    sourceUrl: item.sourceUrl,
    sortOrder: item.sortOrder ?? 0,
    unit: item.unit,
    ...overrides,
  };
}

async function fetchYahooChartQuote({
  code,
  decimals,
  name,
  sortOrder,
  symbol,
  unit,
}: {
  code: string;
  decimals: number;
  name: string;
  sortOrder: number;
  symbol: string;
  unit: string;
}): Promise<MarketPriceInput> {
  const url = new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`);
  url.searchParams.set("range", "5d");
  url.searchParams.set("interval", "1d");

  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      "user-agent": USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new Error(`Yahoo Finance request failed (${response.status})`);
  }

  const payload = (await response.json()) as {
    chart?: {
      error?: { description?: string };
      result?: Array<{
        indicators?: {
          quote?: Array<{
            close?: Array<number | null>;
          }>;
        };
        meta?: {
          chartPreviousClose?: number;
          regularMarketPrice?: number;
        };
      }>;
    };
  };

  const result = payload.chart?.result?.[0];
  if (!result || payload.chart?.error) {
    throw new Error(payload.chart?.error?.description || "Yahoo Finance returned no chart result");
  }

  const closes = result.indicators?.quote?.[0]?.close?.filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value),
  ) || [];
  const current = result.meta?.regularMarketPrice ?? closes.at(-1);
  const previous = result.meta?.chartPreviousClose ?? closes.at(-2);
  const currentValue = typeof current === "number" && Number.isFinite(current) ? current : undefined;
  const previousValue = typeof previous === "number" && Number.isFinite(previous) ? previous : undefined;

  if (currentValue === undefined || previousValue === undefined || previousValue === 0) {
    throw new Error("Yahoo Finance quote is incomplete");
  }

  return {
    changePercent: round(((currentValue - previousValue) / previousValue) * 100, 2),
    code,
    decimals,
    name,
    price: round(currentValue, decimals),
    sourceLabel: "Yahoo Finance",
    sourceUrl: `https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}/`,
    sortOrder,
    unit,
  };
}

function getConfiguredPlattsQuote({
  code,
  envPrefix,
}: {
  code: string;
  envPrefix: string;
}): MarketPriceInput | undefined {
  const price = parseFiniteNumber(process.env[`${envPrefix}_PRICE`]);
  if (price === undefined) {
    return undefined;
  }

  const changePercent = parseFiniteNumber(process.env[`${envPrefix}_CHANGE_PERCENT`]) ?? 0;
  const sourceLabel = process.env[`${envPrefix}_SOURCE_LABEL`] || "Platts";
  const sourceUrl = process.env[`${envPrefix}_SOURCE_URL`] || null;

  return fromDefaultItem(code, {
    changePercent,
    price,
    sourceLabel,
    sourceUrl,
  });
}

async function fetchMarketPriceUpdates() {
  const results: MarketPriceInput[] = [];
  const errors: Array<{ code: string; message: string }> = [];

  const plattsFuj = getConfiguredPlattsQuote({
    code: "PLATTS_10PPM_FUJ",
    envPrefix: "MARKET_PLATTS_10PPM_FUJ",
  });
  if (plattsFuj) results.push(plattsFuj);

  const plattsCifNew = getConfiguredPlattsQuote({
    code: "PLATTS_10PPM_CIF_NEW",
    envPrefix: "MARKET_PLATTS_10PPM_CIF_NEW",
  });
  if (plattsCifNew) results.push(plattsCifNew);

  const yahooQuotes = [
    fetchYahooChartQuote({
      code: "CAC40",
      decimals: 2,
      name: "CAC 40",
      sortOrder: 30,
      symbol: "^FCHI",
      unit: "pts",
    }),
    fetchYahooChartQuote({
      code: "NATURAL_GAS",
      decimals: 2,
      name: "Gaz Naturel",
      sortOrder: 40,
      symbol: "NG=F",
      unit: "USD/MMBtu",
    }),
  ];

  const settledQuotes = await Promise.allSettled(yahooQuotes);
  for (const quote of settledQuotes) {
    if (quote.status === "fulfilled") {
      results.push(quote.value);
    } else {
      errors.push({
        code: "YAHOO_FINANCE",
        message: quote.reason instanceof Error ? quote.reason.message : "Unknown Yahoo Finance error",
      });
    }
  }

  return { errors, results };
}

export async function getPublicMarketPrices() {
  const rows = await getMarketPrices();
  return rows.map((item) => ({
    change: parseFiniteNumber(item.changePercent) ?? 0,
    code: item.code,
    decimals: item.decimals ?? 2,
    name: item.name,
    price: parseFiniteNumber(item.price) ?? 0,
    sourceLabel: item.sourceLabel || undefined,
    sourceUrl: item.sourceUrl || undefined,
    unit: item.unit,
    updatedAt: item.lastUpdatedAt instanceof Date ? item.lastUpdatedAt.toISOString() : undefined,
  }));
}

export async function runMarketPricesAutomation(options?: {
  force?: boolean;
}): Promise<MarketPriceRunResult> {
  const force = Boolean(options?.force);
  const currentItems = await getMarketPrices();
  const lastUpdatedAt = currentItems
    .map((item) => item.lastUpdatedAt)
    .filter((date): date is Date => date instanceof Date)
    .sort((left, right) => right.getTime() - left.getTime())[0];

  if (!force && lastUpdatedAt) {
    const nextEligibleAt = new Date(lastUpdatedAt.getTime() + DAILY_UPDATE_INTERVAL_MS);
    if (nextEligibleAt.getTime() > Date.now()) {
      return {
        errors: [],
        forced: false,
        nextEligibleAt: nextEligibleAt.toISOString(),
        ran: false,
        reason: "not_due",
        updated: 0,
      };
    }
  }

  const { errors, results } = await fetchMarketPriceUpdates();
  for (const item of results) {
    await upsertMarketPrice(toDbPrice(item));
  }

  return {
    errors,
    forced: force,
    ran: true,
    updated: results.length,
  };
}
