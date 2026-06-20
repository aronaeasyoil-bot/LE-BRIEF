import { eq, asc, desc, and, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  articles,
  categories,
  events,
  subscribers,
  newsletterCampaigns,
  advertisements,
  magazines,
  magazinePaymentRequests,
  sourceAutomationSettings,
  automaticSourceItems,
  marketPrices,
} from "../drizzle/schema";
import type {
  InsertArticle,
  InsertAutomaticSourceItem,
  InsertCategory,
  InsertEvent,
  InsertMarketPrice,
  InsertMagazinePaymentRequest,
  InsertNewsletterCampaign,
  InsertSourceAutomationSettings,
  InsertSubscriber,
} from "../drizzle/schema";
import { ENV } from './_core/env';

// Re-export for use in routers
export { advertisements, magazines };

let _db: ReturnType<typeof drizzle> | null = null;
let _coreCategoriesSeeded = false;
let _marketPricesSeeded = false;

const CORE_CATEGORIES: InsertCategory[] = [
  { slug: "energie", nameFr: "Énergie", nameEn: "Energy", nameAr: "الطاقة", icon: "Zap", sortOrder: 10 },
  { slug: "petrole-gaz", nameFr: "Pétrole & Gaz", nameEn: "Oil & Gas", nameAr: "النفط والغاز", icon: "Fuel", sortOrder: 20 },
  { slug: "renouvelables", nameFr: "Renouvelables", nameEn: "Renewables", nameAr: "الطاقات المتجددة", icon: "Leaf", sortOrder: 30 },
  { slug: "economie", nameFr: "Économie", nameEn: "Economy", nameAr: "الاقتصاد", icon: "LineChart", sortOrder: 40 },
  { slug: "investissements", nameFr: "Investissements", nameEn: "Investments", nameAr: "الاستثمارات", icon: "TrendingUp", sortOrder: 50 },
  { slug: "afrique", nameFr: "Afrique", nameEn: "Africa", nameAr: "أفريقيا", icon: "Globe", sortOrder: 60 },
  { slug: "moyen-orient", nameFr: "Moyen-Orient", nameEn: "Middle East", nameAr: "الشرق الأوسط", icon: "Map", sortOrder: 70 },
  { slug: "geopolitique", nameFr: "Géopolitique", nameEn: "Geopolitics", nameAr: "الجيوسياسة", icon: "Landmark", sortOrder: 80 },
  { slug: "portraits", nameFr: "Portraits Éco", nameEn: "Eco Portraits", nameAr: "بورتريهات اقتصادية", icon: "UserRound", sortOrder: 90 },
  { slug: "experts", nameFr: "Experts", nameEn: "Experts", nameAr: "خبراء", icon: "BadgeCheck", sortOrder: 100 },
  { slug: "chroniques", nameFr: "Chroniques", nameEn: "Columns", nameAr: "أعمدة الرأي", icon: "PenLine", sortOrder: 110 },
];

export const DEFAULT_MARKET_PRICES: InsertMarketPrice[] = [
  {
    code: "PLATTS_10PPM_FUJ",
    name: "PLATTS 10 PPM FUJ",
    price: "1102.0000",
    changePercent: "2.3000",
    unit: "$/MT",
    decimals: 0,
    sourceLabel: "Dernier prix connu",
    sourceUrl: null,
    sortOrder: 10,
  },
  {
    code: "PLATTS_10PPM_CIF_NEW",
    name: "PLATTS 10 PPM CIF NEW",
    price: "1102.0000",
    changePercent: "1.2000",
    unit: "$/MT",
    decimals: 0,
    sourceLabel: "Dernier prix connu",
    sourceUrl: null,
    sortOrder: 20,
  },
  {
    code: "CAC40",
    name: "CAC 40",
    price: "7850.2500",
    changePercent: "1.8000",
    unit: "pts",
    decimals: 2,
    sourceLabel: "Yahoo Finance",
    sourceUrl: "https://finance.yahoo.com/quote/%5EFCHI/",
    sortOrder: 30,
  },
  {
    code: "NATURAL_GAS",
    name: "Gaz Naturel",
    price: "3.4500",
    changePercent: "-3.1000",
    unit: "USD/MMBtu",
    decimals: 2,
    sourceLabel: "Yahoo Finance",
    sourceUrl: "https://finance.yahoo.com/quote/NG=F/",
    sortOrder: 40,
  },
];

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ========== CATEGORIES ==========

export async function getAllCategories() {
  const db = await getDb();
  if (!db) return CORE_CATEGORIES.map((category, index) => ({ ...category, id: index + 1, createdAt: new Date() }));
  if (!_coreCategoriesSeeded) {
    await db.insert(categories).values(CORE_CATEGORIES).onDuplicateKeyUpdate({
      set: {
        nameFr: sql`values(${categories.nameFr})`,
        nameEn: sql`values(${categories.nameEn})`,
        nameAr: sql`values(${categories.nameAr})`,
        icon: sql`values(${categories.icon})`,
        sortOrder: sql`values(${categories.sortOrder})`,
      },
    });
    _coreCategoriesSeeded = true;
  }
  return db.select().from(categories).orderBy(categories.sortOrder);
}

// ========== ARTICLES ==========

export async function getPublishedArticles(limit = 1000, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(articles)
    .where(eq(articles.published, true))
    .orderBy(desc(articles.publishedAt))
    .limit(limit)
    .offset(offset);
}

export async function getFeaturedArticles(limit = 5) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(articles)
    .where(and(eq(articles.published, true), eq(articles.featured, true)))
    .orderBy(desc(articles.publishedAt))
    .limit(limit);
}

export async function getArticlesByCategory(categoryId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(articles)
    .where(and(eq(articles.published, true), eq(articles.categoryId, categoryId)))
    .orderBy(desc(articles.publishedAt))
    .limit(limit);
}

export async function getArticleById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getArticleBySourceUrl(sourceUrl: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(articles).where(eq(articles.sourceUrl, sourceUrl)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllArticles() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(articles).orderBy(desc(articles.createdAt));
}

export async function createArticle(data: InsertArticle) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(articles).values(data);
  return result[0].insertId;
}

export async function updateArticle(id: number, data: Partial<InsertArticle>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(articles).set(data).where(eq(articles.id, id));
}

export async function deleteArticle(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(articles).where(eq(articles.id, id));
}

// ========== MARKET PRICES ==========

export async function seedMarketPrices() {
  const db = await getDb();
  if (!db || _marketPricesSeeded) return;

  for (const item of DEFAULT_MARKET_PRICES) {
    await db.insert(marketPrices).values(item).onDuplicateKeyUpdate({
      set: {
        name: sql`values(${marketPrices.name})`,
        unit: sql`values(${marketPrices.unit})`,
        decimals: sql`values(${marketPrices.decimals})`,
        sourceLabel: sql`values(${marketPrices.sourceLabel})`,
        sourceUrl: sql`values(${marketPrices.sourceUrl})`,
        sortOrder: sql`values(${marketPrices.sortOrder})`,
      },
    });
  }

  _marketPricesSeeded = true;
}

export async function getMarketPrices() {
  const db = await getDb();
  if (!db) return DEFAULT_MARKET_PRICES;

  await seedMarketPrices();
  return db.select().from(marketPrices).orderBy(asc(marketPrices.sortOrder));
}

export async function upsertMarketPrice(data: InsertMarketPrice) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(marketPrices).values(data).onDuplicateKeyUpdate({
    set: {
      name: sql`values(${marketPrices.name})`,
      price: sql`values(${marketPrices.price})`,
      changePercent: sql`values(${marketPrices.changePercent})`,
      unit: sql`values(${marketPrices.unit})`,
      decimals: sql`values(${marketPrices.decimals})`,
      sourceLabel: sql`values(${marketPrices.sourceLabel})`,
      sourceUrl: sql`values(${marketPrices.sourceUrl})`,
      sortOrder: sql`values(${marketPrices.sortOrder})`,
      lastUpdatedAt: sql`values(${marketPrices.lastUpdatedAt})`,
    },
  });
}

// ========== AUTOMATED SOURCES ==========

export async function getSourceAutomationSettings(provider: "reuters" = "reuters") {
  const db = await getDb();
  const fallback = {
    id: 0,
    provider,
    sourceLabel: "Reuters Energy",
    sourceUrl: ENV.reutersEnergySourceUrl,
    autoPublish: ENV.autoPublishReuters,
    lastRunAt: null,
    lastSuccessAt: null,
    lastError: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (!db) return fallback;

  const result = await db
    .select()
    .from(sourceAutomationSettings)
    .where(eq(sourceAutomationSettings.provider, provider))
    .limit(1);

  if (result.length > 0) {
    return result[0];
  }

  const values: InsertSourceAutomationSettings = {
    provider,
    sourceLabel: "Reuters Energy",
    sourceUrl: ENV.reutersEnergySourceUrl,
    autoPublish: ENV.autoPublishReuters,
  };

  await db.insert(sourceAutomationSettings).values(values);
  const inserted = await db
    .select()
    .from(sourceAutomationSettings)
    .where(eq(sourceAutomationSettings.provider, provider))
    .limit(1);

  return inserted[0] || fallback;
}

export async function updateSourceAutomationSettings(
  provider: "reuters",
  data: Partial<InsertSourceAutomationSettings>,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await getSourceAutomationSettings(provider);
  await db
    .update(sourceAutomationSettings)
    .set(data)
    .where(eq(sourceAutomationSettings.provider, provider));

  return getSourceAutomationSettings(provider);
}

export async function touchSourceAutomationRunStatus(
  provider: "reuters",
  data: {
    lastError?: string | null;
    lastRunAt?: Date;
    lastSuccessAt?: Date | null;
  },
) {
  return updateSourceAutomationSettings(provider, {
    lastError: data.lastError,
    lastRunAt: data.lastRunAt,
    lastSuccessAt: data.lastSuccessAt === undefined ? undefined : data.lastSuccessAt,
  });
}

export async function getAutomaticSourceItemById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(automaticSourceItems)
    .where(eq(automaticSourceItems.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAutomaticSourceItemBySourceUrl(sourceUrl: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(automaticSourceItems)
    .where(eq(automaticSourceItems.sourceUrl, sourceUrl))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllAutomaticSourceItems(provider: "reuters" = "reuters", limit = 200) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(automaticSourceItems)
    .where(eq(automaticSourceItems.provider, provider))
    .orderBy(desc(automaticSourceItems.detectedAt))
    .limit(limit);
}

export async function getPendingAutomaticSourceItems(provider: "reuters" = "reuters", limit = 5) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(automaticSourceItems)
    .where(and(eq(automaticSourceItems.provider, provider), eq(automaticSourceItems.status, "detected")))
    .orderBy(desc(automaticSourceItems.sourcePublishedAt), desc(automaticSourceItems.detectedAt))
    .limit(limit);
}

export async function createAutomaticSourceItem(data: InsertAutomaticSourceItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(automaticSourceItems).values(data);
  return result[0].insertId;
}

export async function updateAutomaticSourceItem(id: number, data: Partial<InsertAutomaticSourceItem>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(automaticSourceItems).set(data).where(eq(automaticSourceItems.id, id));
}

// ========== EVENTS ==========

export async function getPublishedEvents() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(events)
    .where(eq(events.published, true))
    .orderBy(events.eventDate);
}

export async function getAllEvents() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(events).orderBy(desc(events.createdAt));
}

export async function createEvent(data: InsertEvent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(events).values(data);
  return result[0].insertId;
}

export async function updateEvent(id: number, data: Partial<InsertEvent>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(events).set(data).where(eq(events.id, id));
}

export async function deleteEvent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(events).where(eq(events.id, id));
}

// ========== SUBSCRIBERS ==========

export async function addSubscriber(data: InsertSubscriber) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(subscribers).values(data).onDuplicateKeyUpdate({ set: { language: data.language } });
}

export async function getSubscribers(limit = 200) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(subscribers).orderBy(desc(subscribers.createdAt)).limit(limit);
}

export async function getAllSubscribers(language?: "fr" | "en" | "ar") {
  const db = await getDb();
  if (!db) return [];

  const query = db.select().from(subscribers);
  if (language) {
    return query.where(eq(subscribers.language, language)).orderBy(desc(subscribers.createdAt));
  }

  return query.orderBy(desc(subscribers.createdAt));
}

export async function getExistingSubscriberEmails(emails: string[]) {
  const db = await getDb();
  if (!db || emails.length === 0) return [];
  const rows = await db
    .select({ email: subscribers.email })
    .from(subscribers)
    .where(inArray(subscribers.email, emails));
  return rows.map((row) => row.email);
}

export async function bulkUpsertSubscribers(items: InsertSubscriber[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (items.length === 0) return;

  await db.insert(subscribers).values(items).onDuplicateKeyUpdate({
    set: {
      language: sql`values(${subscribers.language})`,
    },
  });
}

export async function deleteSubscriberByEmail(email: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(subscribers).where(eq(subscribers.email, email));
}

export async function getNewsletterCampaigns(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(newsletterCampaigns).orderBy(desc(newsletterCampaigns.createdAt)).limit(limit);
}

export async function getNewsletterCampaignById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(newsletterCampaigns)
    .where(eq(newsletterCampaigns.id, id))
    .limit(1);
  return result[0];
}

export async function getNewsletterCampaignByWeekKey(weekKey: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(newsletterCampaigns)
    .where(eq(newsletterCampaigns.weekKey, weekKey))
    .limit(1);
  return result[0];
}

export async function createNewsletterCampaign(data: InsertNewsletterCampaign) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(newsletterCampaigns).values(data);
  return result[0].insertId;
}

export async function updateNewsletterCampaign(id: number, data: Partial<InsertNewsletterCampaign>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(newsletterCampaigns).set(data).where(eq(newsletterCampaigns.id, id));
}

// Ads helpers
export async function createAd(data: { imageUrl: string; videoUrl?: string; titleFr?: string; active: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(advertisements).values({
    imageUrl: data.imageUrl,
    videoUrl: data.videoUrl || null,
    titleFr: data.titleFr || null,
    active: data.active,
  });
}

export async function getAds() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(advertisements).where(eq(advertisements.active, true)).orderBy(asc(advertisements.createdAt));
}

export async function updateAd(id: number, data: Partial<{ imageUrl: string; videoUrl?: string; titleFr?: string; active: boolean }>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(advertisements).set(data as any).where(eq(advertisements.id, id));
}

export async function deleteAd(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(advertisements).where(eq(advertisements.id, id));
}

// Magazines helpers
export async function createMagazine(data: {
  titleFr: string;
  titleEn?: string;
  titleAr?: string;
  pdfUrl: string;
  coverImageUrl?: string;
  issueNumber: number;
  isPremium?: boolean;
  previewPageCount?: number;
  priceFcfa?: number;
  publishedAt: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(magazines).values({
    titleFr: data.titleFr,
    titleEn: data.titleEn || "",
    titleAr: data.titleAr || "",
    pdfUrl: data.pdfUrl,
    coverImageUrl: data.coverImageUrl,
    issueNumber: data.issueNumber,
    isPremium: data.isPremium ?? true,
    previewPageCount: data.previewPageCount ?? 3,
    priceFcfa: data.priceFcfa ?? 1000,
    publishedAt: data.publishedAt,
  });
}

export async function getMagazines() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(magazines)
    .orderBy(desc(magazines.createdAt), desc(magazines.publishedAt), desc(magazines.issueNumber), desc(magazines.id));
}

export async function getMagazineById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(magazines).where(eq(magazines.id, id)).limit(1);
  return result[0] || null;
}

export async function updateMagazine(
  id: number,
  data: Partial<{
    titleFr: string;
    titleEn?: string;
    titleAr?: string;
    pdfUrl: string;
    coverImageUrl: string;
    issueNumber: number;
    isPremium: boolean;
    previewPageCount: number;
    priceFcfa: number;
    publishedAt: Date;
  }>,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(magazines).set(data as any).where(eq(magazines.id, id));
}

export async function deleteMagazine(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(magazines).where(eq(magazines.id, id));
}

export async function createMagazinePaymentRequest(data: InsertMagazinePaymentRequest) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(magazinePaymentRequests).values(data);
  return result[0].insertId;
}

export async function getMagazinePaymentRequestById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(magazinePaymentRequests)
    .where(eq(magazinePaymentRequests.id, id))
    .limit(1);
  return result[0];
}

export async function getMagazinePaymentRequestByAccessToken(accessToken: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(magazinePaymentRequests)
    .where(eq(magazinePaymentRequests.accessToken, accessToken))
    .limit(1);
  return result[0];
}

export async function getMagazinePaymentRequests(limit = 200) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(magazinePaymentRequests)
    .orderBy(desc(magazinePaymentRequests.createdAt), desc(magazinePaymentRequests.id))
    .limit(limit);
}

export async function updateMagazinePaymentRequest(
  id: number,
  data: Partial<InsertMagazinePaymentRequest>,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(magazinePaymentRequests).set(data as any).where(eq(magazinePaymentRequests.id, id));
}
