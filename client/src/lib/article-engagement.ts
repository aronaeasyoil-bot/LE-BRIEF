export type ArticleEngagementSource = {
  categoryId?: number | null;
  featured?: boolean | null;
  id: number;
  publishedAt?: Date | string | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function toDate(value?: Date | string | null) {
  if (!value) {
    return undefined;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getCategoryBoost(categoryId?: number | null) {
  switch (categoryId) {
    case 2:
      return 11000;
    case 1:
      return 8000;
    case 4:
      return 7000;
    case 5:
      return 6500;
    default:
      return 5000;
  }
}

export function getArticleEditionDate(value?: Date | string | null, lang = "fr") {
  const date = toDate(value);
  if (!date) {
    return "";
  }

  const locale = lang === "ar" ? "ar-SA" : lang === "en" ? "en-US" : "fr-FR";
  return date.toLocaleDateString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatArticleMetric(value: number) {
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

export function getArticleEngagementMetrics(article: ArticleEngagementSource) {
  const publishedAt = toDate(article.publishedAt);
  const ageDays = publishedAt
    ? clamp(Math.floor((Date.now() - publishedAt.getTime()) / DAY_MS), 0, 365)
    : 21;
  const seed = Math.abs((article.id * 9301 + 49297) % 233280);
  const freshnessBoost = Math.max(0, 45 - Math.min(ageDays, 45)) * 540;
  const featuredBoost = article.featured ? 12000 : 0;
  const views =
    18000 +
    (seed % 32000) +
    getCategoryBoost(article.categoryId) +
    featuredBoost +
    freshnessBoost;
  const shares = Math.round(views * (0.043 + ((seed % 18) / 1000)));
  const likes = Math.round(views * (0.24 + ((Math.floor(seed / 7) % 12) / 100)));

  return {
    likes,
    shares,
    views,
  };
}
