import { eq, asc, desc, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  articles,
  categories,
  events,
  subscribers,
  advertisements,
  magazines,
  sourceAutomationSettings,
  automaticSourceItems,
} from "../drizzle/schema";
import type {
  InsertArticle,
  InsertAutomaticSourceItem,
  InsertCategory,
  InsertEvent,
  InsertSourceAutomationSettings,
  InsertSubscriber,
} from "../drizzle/schema";
import { ENV } from './_core/env';

// Re-export for use in routers
export { advertisements, magazines };

let _db: ReturnType<typeof drizzle> | null = null;
let _coreCategoriesSeeded = false;

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
export async function createMagazine(data: { titleFr: string; titleEn?: string; titleAr?: string; pdfUrl: string; coverImageUrl?: string; issueNumber: number; publishedAt: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(magazines).values({
    titleFr: data.titleFr,
    titleEn: data.titleEn || "",
    titleAr: data.titleAr || "",
    pdfUrl: data.pdfUrl,
    coverImageUrl: data.coverImageUrl,
    issueNumber: data.issueNumber,
    publishedAt: data.publishedAt,
  });
}

export async function getMagazines() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(magazines).orderBy(desc(magazines.publishedAt));
}

export async function getMagazineById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(magazines).where(eq(magazines.id, id)).limit(1);
  return result[0] || null;
}

export async function updateMagazine(id: number, data: Partial<{ titleFr: string; titleEn?: string; titleAr?: string; pdfUrl: string; coverImageUrl: string; issueNumber: number; publishedAt: Date }>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(magazines).set(data as any).where(eq(magazines.id, id));
}

export async function deleteMagazine(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(magazines).where(eq(magazines.id, id));
}
