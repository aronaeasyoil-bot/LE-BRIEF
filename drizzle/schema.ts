import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Categories for articles
 */
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  nameFr: varchar("nameFr", { length: 200 }).notNull(),
  nameEn: varchar("nameEn", { length: 200 }).notNull(),
  nameAr: varchar("nameAr", { length: 200 }).notNull(),
  icon: varchar("icon", { length: 100 }),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

/**
 * Articles - main content
 */
export const articles = mysqlTable("articles", {
  id: int("id").autoincrement().primaryKey(),
  titleFr: varchar("titleFr", { length: 500 }),
  titleEn: varchar("titleEn", { length: 500 }),
  titleAr: varchar("titleAr", { length: 500 }),
  excerptFr: text("excerptFr"),
  excerptEn: text("excerptEn"),
  excerptAr: text("excerptAr"),
  contentFr: text("contentFr"),
  contentEn: text("contentEn"),
  contentAr: text("contentAr"),
  categoryId: int("categoryId").notNull(),
  imageUrl: text("imageUrl"),
  authorName: varchar("authorName", { length: 200 }),
  sourceName: varchar("sourceName", { length: 200 }),
  sourceUrl: varchar("sourceUrl", { length: 767 }),
  tags: text("tags"),
  metaDescription: varchar("metaDescription", { length: 320 }),
  featured: boolean("featured").default(false).notNull(),
  published: boolean("published").default(false).notNull(),
  language: mysqlEnum("language", ["fr", "en", "ar", "all"]).default("all").notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Article = typeof articles.$inferSelect;
export type InsertArticle = typeof articles.$inferInsert;

/**
 * Events - conferences, forums, etc.
 */
export const events = mysqlTable("events", {
  id: int("id").autoincrement().primaryKey(),
  titleFr: varchar("titleFr", { length: 500 }),
  titleEn: varchar("titleEn", { length: 500 }),
  titleAr: varchar("titleAr", { length: 500 }),
  descriptionFr: text("descriptionFr"),
  descriptionEn: text("descriptionEn"),
  descriptionAr: text("descriptionAr"),
  location: varchar("location", { length: 300 }),
  eventDate: timestamp("eventDate"),
  imageUrl: text("imageUrl"),
  published: boolean("published").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

/**
 * Newsletter subscribers
 */
export const subscribers = mysqlTable("subscribers", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  language: mysqlEnum("language", ["fr", "en", "ar"]).default("fr").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Subscriber = typeof subscribers.$inferSelect;
export type InsertSubscriber = typeof subscribers.$inferInsert;

/**
 * Magazines - PDF issues published weekly
 */
export const magazines = mysqlTable("magazines", {
  id: int("id").autoincrement().primaryKey(),
  titleFr: varchar("titleFr", { length: 500 }).notNull(),
  titleEn: varchar("titleEn", { length: 500 }).notNull(),
  titleAr: varchar("titleAr", { length: 500 }).notNull(),
  issueNumber: int("issueNumber").notNull(),
  pdfUrl: text("pdfUrl").notNull(),
  coverImageUrl: text("coverImageUrl"),
  publishedAt: timestamp("publishedAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Magazine = typeof magazines.$inferSelect;
export type InsertMagazine = typeof magazines.$inferInsert;

/**
 * Automated source monitoring settings
 */
export const sourceAutomationSettings = mysqlTable("sourceAutomationSettings", {
  id: int("id").autoincrement().primaryKey(),
  provider: mysqlEnum("provider", ["reuters"]).notNull().unique(),
  sourceLabel: varchar("sourceLabel", { length: 200 }).notNull(),
  sourceUrl: varchar("sourceUrl", { length: 500 }).notNull(),
  autoPublish: boolean("autoPublish").default(true).notNull(),
  lastRunAt: timestamp("lastRunAt"),
  lastSuccessAt: timestamp("lastSuccessAt"),
  lastError: text("lastError"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SourceAutomationSettings = typeof sourceAutomationSettings.$inferSelect;
export type InsertSourceAutomationSettings = typeof sourceAutomationSettings.$inferInsert;

/**
 * Detected items coming from automated external sources
 */
export const automaticSourceItems = mysqlTable("automaticSourceItems", {
  id: int("id").autoincrement().primaryKey(),
  provider: mysqlEnum("provider", ["reuters"]).notNull(),
  sourceSection: varchar("sourceSection", { length: 100 }).notNull(),
  sourceUrl: varchar("sourceUrl", { length: 767 }).notNull().unique(),
  sourceTitle: varchar("sourceTitle", { length: 500 }).notNull(),
  sourceSummary: text("sourceSummary"),
  sourceKeywords: text("sourceKeywords"),
  sourcePublishedAt: timestamp("sourcePublishedAt"),
  sourceMetadataJson: text("sourceMetadataJson"),
  generatedTitleFr: varchar("generatedTitleFr", { length: 500 }),
  generatedExcerptFr: text("generatedExcerptFr"),
  generatedMetaDescription: varchar("generatedMetaDescription", { length: 320 }),
  generatedTags: text("generatedTags"),
  generatedImageUrl: text("generatedImageUrl"),
  publishedArticleId: int("publishedArticleId"),
  publishedAt: timestamp("publishedAt"),
  lastAttemptAt: timestamp("lastAttemptAt"),
  status: mysqlEnum("status", ["detected", "published", "error"]).default("detected").notNull(),
  errorMessage: text("errorMessage"),
  detectedAt: timestamp("detectedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AutomaticSourceItem = typeof automaticSourceItems.$inferSelect;
export type InsertAutomaticSourceItem = typeof automaticSourceItems.$inferInsert;

/**
 * Advertisements - rotating ads and banners
 */
export const advertisements = mysqlTable("advertisements", {
  id: int("id").autoincrement().primaryKey(),
  titleFr: varchar("titleFr", { length: 300 }),
  titleEn: varchar("titleEn", { length: 300 }),
  titleAr: varchar("titleAr", { length: 300 }),
  descriptionFr: text("descriptionFr"),
  descriptionEn: text("descriptionEn"),
  descriptionAr: text("descriptionAr"),
  imageUrl: text("imageUrl"),
  videoUrl: text("videoUrl"),
  linkUrl: varchar("linkUrl", { length: 500 }),
  active: boolean("active").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Advertisement = typeof advertisements.$inferSelect;
export type InsertAdvertisement = typeof advertisements.$inferInsert;
