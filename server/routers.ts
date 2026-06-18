import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { uploadAdminFile } from "./_core/fileUpload";
import { getPublicMarketPrices } from "./_core/marketPrices";
import {
  generateDailyNewsletterDraft,
  generateWeeklyNewsletterDraft,
  importSubscribersFromText,
  isNewsletterSendConfigured,
  sendNewsletterCampaignById,
} from "./_core/newsletter";
import { publishAutomaticSourceItemById, runReutersEnergyAutomation } from "./_core/reutersEnergy";
import { sdk } from "./_core/sdk";
import { submitSearchConsoleSitemaps } from "./_core/searchConsole";
import { systemRouter } from "./_core/systemRouter";
import { getLocalAdminName, getLocalAdminOpenId, isLocalAdminConfigured, verifyLocalAdminCredentials } from "./_core/localAdmin";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  getAllCategories,
  getPublishedArticles,
  getFeaturedArticles,
  getArticlesByCategory,
  getArticleById,
  getAllArticles,
  createArticle,
  updateArticle,
  deleteArticle,
  getPublishedEvents,
  getAllEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  addSubscriber,
  getAllSubscribers,
  getAllAutomaticSourceItems,
  getNewsletterCampaigns,
  getSubscribers,
  getSourceAutomationSettings,
  updateSourceAutomationSettings,
} from "./db";
import { desc, eq, asc } from "drizzle-orm";
import { magazines, advertisements } from "../drizzle/schema";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

function normalizeOptionalText(value?: null | string) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed || undefined;
}

function normalizeArticleRecord(article: any) {
  return {
    ...article,
    authorName: normalizeOptionalText(article.authorName),
    imageUrl: normalizeOptionalText(article.imageUrl),
    metaDescription: normalizeOptionalText(article.metaDescription),
    sourceName: normalizeOptionalText(article.sourceName),
    sourceUrl: normalizeOptionalText(article.sourceUrl),
    tags: normalizeOptionalText(article.tags),
  };
}

function normalizeEventRecord(event: any) {
  return {
    ...event,
    imageUrl: normalizeOptionalText(event.imageUrl),
    location: normalizeOptionalText(event.location),
  };
}

function normalizeMagazineRecord(magazine: any) {
  return {
    ...magazine,
    coverImageUrl: normalizeOptionalText(magazine.coverImageUrl),
    pdfUrl: normalizeOptionalText(magazine.pdfUrl),
  };
}

function normalizeAdvertisementRecord(advertisement: any) {
  return {
    ...advertisement,
    imageUrl: normalizeOptionalText(advertisement.imageUrl),
    linkUrl: normalizeOptionalText(advertisement.linkUrl),
    videoUrl: normalizeOptionalText(advertisement.videoUrl),
  };
}

async function syncArticleSeoAutomation() {
  try {
    const result = await submitSearchConsoleSitemaps();
    if (!result.skipped) {
      console.info("[SEO] Search Console sitemaps submitted:", result.sitemapUrls.join(", "));
    }
  } catch (error) {
    console.error("[SEO] Search Console automation failed:", error);
  }
}

export const appRouter = router({
  system: systemRouter,
  marketPrices: router({
    current: publicProcedure.query(async () => {
      return getPublicMarketPrices();
    }),
  }),
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    adminLogin: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!isLocalAdminConfigured()) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Admin login is not configured",
          });
        }

        if (!verifyLocalAdminCredentials(input.email, input.password)) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid admin credentials",
          });
        }

        const sessionToken = await sdk.createSessionToken(getLocalAdminOpenId(), {
          name: getLocalAdminName(),
          expiresInMs: ONE_YEAR_MS,
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS,
        });

        return { success: true } as const;
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  categories: router({
    list: publicProcedure.query(async () => {
      return getAllCategories();
    }),
  }),

  uploads: router({
    file: adminProcedure
      .input(
        z.object({
          bucket: z.enum(["images", "documents", "videos"]),
          fileName: z.string().min(1),
          mimeType: z.string().min(1),
          dataBase64: z.string().min(1),
          size: z.number().positive(),
        })
      )
      .mutation(async ({ input }) => {
        return uploadAdminFile(input);
      }),
  }),

  articles: router({
    search: publicProcedure
      .input(z.object({ query: z.string().min(1) }))
      .query(async ({ input }) => {
        const allArticles = await getPublishedArticles();
        return allArticles.filter(a =>
          (a.titleFr?.toLowerCase().includes(input.query.toLowerCase()) ||
            a.titleEn?.toLowerCase().includes(input.query.toLowerCase()) ||
            a.titleAr?.toLowerCase().includes(input.query.toLowerCase()) ||
            a.contentFr?.toLowerCase().includes(input.query.toLowerCase()) ||
            a.contentEn?.toLowerCase().includes(input.query.toLowerCase()) ||
            a.contentAr?.toLowerCase().includes(input.query.toLowerCase()))
        );
      }),
    featured: publicProcedure
      .input(z.object({}).optional())
      .query(async () => {
        return (await getFeaturedArticles(4)).map(normalizeArticleRecord);
      }),
    published: publicProcedure
      .input(z.object({}).optional())
      .query(async () => {
        return (await getPublishedArticles()).map(normalizeArticleRecord);
      }),
    byCategory: publicProcedure
      .input(z.object({ categoryId: z.number() }))
      .query(async ({ input }) => {
        return (await getArticlesByCategory(input.categoryId)).map(normalizeArticleRecord);
      }),
    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const article = await getArticleById(input.id);
        return article ? normalizeArticleRecord(article) : undefined;
      }),
    all: adminProcedure.query(async () => {
      return (await getAllArticles()).map(normalizeArticleRecord);
    }),
    create: adminProcedure
      .input(z.object({
        titleFr: z.string().optional(),
        titleEn: z.string().optional(),
        titleAr: z.string().optional(),
        excerptFr: z.string().optional(),
        excerptEn: z.string().optional(),
        excerptAr: z.string().optional(),
        contentFr: z.string().optional(),
        contentEn: z.string().optional(),
        contentAr: z.string().optional(),
        categoryId: z.number(),
        imageUrl: z.string().optional(),
        authorName: z.string().optional(),
        sourceName: z.string().optional(),
        sourceUrl: z.string().optional(),
        tags: z.string().optional(),
        metaDescription: z.string().optional(),
        featured: z.boolean().optional(),
        published: z.boolean().optional(),
        language: z.enum(["fr", "en", "ar", "all"]).optional(),
        publishedAt: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        const isPublished = input.published ?? false;
        const id = await createArticle({
          ...input,
          authorName: normalizeOptionalText(input.authorName),
          featured: input.featured ?? false,
          imageUrl: normalizeOptionalText(input.imageUrl),
          metaDescription: normalizeOptionalText(input.metaDescription),
          published: isPublished,
          language: input.language ?? "all",
          publishedAt: isPublished ? input.publishedAt ?? new Date() : input.publishedAt,
          sourceName: normalizeOptionalText(input.sourceName),
          sourceUrl: normalizeOptionalText(input.sourceUrl),
          tags: normalizeOptionalText(input.tags),
        });
        if (isPublished) {
          await syncArticleSeoAutomation();
        }
        return { id };
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        titleFr: z.string().optional(),
        titleEn: z.string().optional(),
        titleAr: z.string().optional(),
        excerptFr: z.string().optional(),
        excerptEn: z.string().optional(),
        excerptAr: z.string().optional(),
        contentFr: z.string().optional(),
        contentEn: z.string().optional(),
        contentAr: z.string().optional(),
        categoryId: z.number().optional(),
        imageUrl: z.string().optional(),
        authorName: z.string().optional(),
        sourceName: z.string().optional(),
        sourceUrl: z.string().optional(),
        tags: z.string().optional(),
        metaDescription: z.string().optional(),
        featured: z.boolean().optional(),
        published: z.boolean().optional(),
        language: z.enum(["fr", "en", "ar", "all"]).optional(),
        publishedAt: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const currentArticle = await getArticleById(id);
        const isPublishingNow = Boolean(currentArticle && !currentArticle.published && data.published === true);
        const shouldSyncSeo = Boolean(currentArticle?.published || data.published === true);

        await updateArticle(id, {
          ...data,
          authorName: normalizeOptionalText(data.authorName),
          imageUrl: normalizeOptionalText(data.imageUrl),
          metaDescription: normalizeOptionalText(data.metaDescription),
          publishedAt: data.publishedAt ?? (isPublishingNow ? new Date() : undefined),
          sourceName: normalizeOptionalText(data.sourceName),
          sourceUrl: normalizeOptionalText(data.sourceUrl),
          tags: normalizeOptionalText(data.tags),
        });
        if (shouldSyncSeo) {
          await syncArticleSeoAutomation();
        }
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteArticle(input.id);
        return { success: true };
      }),
  }),

  automaticSources: router({
    list: adminProcedure.query(async () => {
      return (await getAllAutomaticSourceItems("reuters")).map((item) => ({
        ...item,
        errorMessage: normalizeOptionalText(item.errorMessage),
        generatedExcerptFr: normalizeOptionalText(item.generatedExcerptFr),
        generatedImageUrl: normalizeOptionalText(item.generatedImageUrl),
        generatedMetaDescription: normalizeOptionalText(item.generatedMetaDescription),
        generatedTags: normalizeOptionalText(item.generatedTags),
        generatedTitleFr: normalizeOptionalText(item.generatedTitleFr),
        sourceKeywords: normalizeOptionalText(item.sourceKeywords),
        sourceMetadataJson: normalizeOptionalText(item.sourceMetadataJson),
        sourceSummary: normalizeOptionalText(item.sourceSummary),
      }));
    }),
    settings: adminProcedure.query(async () => {
      const settings = await getSourceAutomationSettings("reuters");
      return {
        ...settings,
        lastError: normalizeOptionalText(settings.lastError),
      };
    }),
    updateSettings: adminProcedure
      .input(
        z.object({
          autoPublish: z.boolean(),
        }),
      )
      .mutation(async ({ input }) => {
        const settings = await updateSourceAutomationSettings("reuters", {
          autoPublish: input.autoPublish,
        });
        return {
          ...settings,
          lastError: normalizeOptionalText(settings.lastError),
        };
      }),
    scanNow: adminProcedure.mutation(async () => {
      return runReutersEnergyAutomation();
    }),
    publishOne: adminProcedure
      .input(
        z.object({
          itemId: z.number(),
        }),
      )
      .mutation(async ({ input }) => {
        return publishAutomaticSourceItemById(input.itemId);
      }),
  }),

  events: router({
    published: publicProcedure.query(async () => {
      return (await getPublishedEvents()).map(normalizeEventRecord);
    }),
    all: adminProcedure.query(async () => {
      return (await getAllEvents()).map(normalizeEventRecord);
    }),
    create: adminProcedure
      .input(z.object({
        titleFr: z.string().optional(),
        titleEn: z.string().optional(),
        titleAr: z.string().optional(),
        descriptionFr: z.string().optional(),
        descriptionEn: z.string().optional(),
        descriptionAr: z.string().optional(),
        location: z.string().optional(),
        eventDate: z.date().optional(),
        imageUrl: z.string().optional(),
        published: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await createEvent({
          ...input,
          imageUrl: normalizeOptionalText(input.imageUrl),
          location: normalizeOptionalText(input.location),
          published: input.published ?? false,
        });
        return { id };
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        titleFr: z.string().optional(),
        titleEn: z.string().optional(),
        titleAr: z.string().optional(),
        descriptionFr: z.string().optional(),
        descriptionEn: z.string().optional(),
        descriptionAr: z.string().optional(),
        location: z.string().optional(),
        eventDate: z.date().optional(),
        imageUrl: z.string().optional(),
        published: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateEvent(id, {
          ...data,
          imageUrl: normalizeOptionalText(data.imageUrl),
          location: normalizeOptionalText(data.location),
        });
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteEvent(input.id);
        return { success: true };
      }),
  }),

  newsletter: router({
    subscribe: publicProcedure
      .input(z.object({
        email: z.string().email(),
        language: z.enum(["fr", "en", "ar"]).optional(),
      }))
      .mutation(async ({ input }) => {
        await addSubscriber({
          email: input.email,
          language: input.language ?? "fr",
        });
        return { success: true };
      }),
    dashboard: adminProcedure.query(async () => {
      const [allSubscribers, campaigns, recentSubscribers] = await Promise.all([
        getAllSubscribers(),
        getNewsletterCampaigns(12),
        getSubscribers(40),
      ]);

      return {
        campaigns: campaigns.map((campaign) => ({
          ...campaign,
          articleIds: normalizeOptionalText(campaign.articleIds),
          lastError: normalizeOptionalText(campaign.lastError),
          previewText: normalizeOptionalText(campaign.previewText),
        })),
        sendConfigured: isNewsletterSendConfigured(),
        totalSubscribers: allSubscribers.length,
        subscribers: recentSubscribers,
      };
    }),
    importSubscribers: adminProcedure
      .input(
        z.object({
          language: z.enum(["fr", "en", "ar"]).optional(),
          rawText: z.string().min(1).max(2_000_000),
        }),
      )
      .mutation(async ({ input }) => {
        return importSubscribersFromText(input.rawText, {
          defaultLanguage: input.language ?? "fr",
        });
      }),
    generateDailyDraft: adminProcedure
      .input(
        z.object({
          force: z.boolean().optional(),
        }).optional(),
      )
      .mutation(async ({ input }) => {
        const result = await generateDailyNewsletterDraft({
          force: input?.force ?? false,
          language: "fr",
        });

        return {
          ...result,
          campaign: result.campaign
            ? {
                ...result.campaign,
                articleIds: normalizeOptionalText(result.campaign.articleIds),
                lastError: normalizeOptionalText(result.campaign.lastError),
                previewText: normalizeOptionalText(result.campaign.previewText),
              }
            : result.campaign,
        };
      }),
    generateWeeklyDraft: adminProcedure
      .input(
        z.object({
          force: z.boolean().optional(),
        }).optional(),
      )
      .mutation(async ({ input }) => {
        const result = await generateWeeklyNewsletterDraft({
          force: input?.force ?? false,
        });

        return {
          ...result,
          campaign: result.campaign
            ? {
                ...result.campaign,
                articleIds: normalizeOptionalText(result.campaign.articleIds),
                lastError: normalizeOptionalText(result.campaign.lastError),
                previewText: normalizeOptionalText(result.campaign.previewText),
              }
            : result.campaign,
        };
      }),
    sendCampaign: adminProcedure
      .input(
        z.object({
          id: z.number(),
        }),
      )
      .mutation(async ({ input }) => {
        return sendNewsletterCampaignById(input.id);
      }),
  }),

  magazines: router({
    list: publicProcedure.query(async () => {
      const db = await (await import("./db")).getDb();
      if (!db) return [];
      return (await db.select().from(magazines).orderBy(desc(magazines.publishedAt)).limit(10)).map(normalizeMagazineRecord);
    }),
    all: adminProcedure.query(async () => {
      const db = await (await import("./db")).getDb();
      if (!db) return [];
      return (await db.select().from(magazines).orderBy(desc(magazines.publishedAt))).map(normalizeMagazineRecord);
    }),
    create: adminProcedure
      .input(z.object({
        titleFr: z.string(),
        titleEn: z.string().optional(),
        titleAr: z.string().optional(),
        pdfUrl: z.string(),
        coverImageUrl: z.string().optional(),
        issueNumber: z.number(),
        publishedAt: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        const { createMagazine } = await import("./db");
        return createMagazine({
          ...input,
          publishedAt: input.publishedAt ?? new Date(),
          coverImageUrl: normalizeOptionalText(input.coverImageUrl) ?? "",
          pdfUrl: normalizeOptionalText(input.pdfUrl) ?? "",
        } as any);
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        titleFr: z.string().optional(),
        titleEn: z.string().optional(),
        titleAr: z.string().optional(),
        pdfUrl: z.string().optional(),
        coverImageUrl: z.string().optional(),
        issueNumber: z.number().optional(),
        publishedAt: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        const { updateMagazine } = await import("./db");
        const { id, ...data } = input;
        return updateMagazine(id, {
          ...data,
          coverImageUrl: normalizeOptionalText(data.coverImageUrl),
          pdfUrl: normalizeOptionalText(data.pdfUrl),
        } as any);
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { deleteMagazine } = await import("./db");
        return deleteMagazine(input.id);
      }),
  }),

  advertisements: router({
    active: publicProcedure.query(async () => {
      const db = await (await import("./db")).getDb();
      if (!db) return [];
      return (await db.select().from(advertisements).where(eq(advertisements.active, true)).orderBy(asc(advertisements.sortOrder))).map(normalizeAdvertisementRecord);
    }),
    all: adminProcedure.query(async () => {
      const db = await (await import("./db")).getDb();
      if (!db) return [];
      return (await db.select().from(advertisements).orderBy(asc(advertisements.sortOrder))).map(normalizeAdvertisementRecord);
    }),
    create: adminProcedure
      .input(z.object({
        titleFr: z.string().optional(),
        titleEn: z.string().optional(),
        titleAr: z.string().optional(),
        descriptionFr: z.string().optional(),
        descriptionEn: z.string().optional(),
        descriptionAr: z.string().optional(),
        imageUrl: z.string().optional(),
        videoUrl: z.string().optional(),
        linkUrl: z.string().optional(),
        sortOrder: z.number().optional(),
        active: z.boolean().default(true),
      }))
      .mutation(async ({ input }) => {
        const db = await (await import("./db")).getDb();
        if (!db) throw new Error("Database not available");
        const result = await db.insert(advertisements).values({
          ...input,
          imageUrl: normalizeOptionalText(input.imageUrl),
          linkUrl: normalizeOptionalText(input.linkUrl),
          videoUrl: normalizeOptionalText(input.videoUrl),
        } as any);
        return result;
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        titleFr: z.string().optional(),
        titleEn: z.string().optional(),
        titleAr: z.string().optional(),
        descriptionFr: z.string().optional(),
        descriptionEn: z.string().optional(),
        descriptionAr: z.string().optional(),
        imageUrl: z.string().optional(),
        videoUrl: z.string().optional(),
        linkUrl: z.string().optional(),
        sortOrder: z.number().optional(),
        active: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await (await import("./db")).getDb();
        if (!db) throw new Error("Database not available");
        const { id, ...data } = input;
        return db.update(advertisements).set({
          ...data,
          imageUrl: normalizeOptionalText(data.imageUrl),
          linkUrl: normalizeOptionalText(data.linkUrl),
          videoUrl: normalizeOptionalText(data.videoUrl),
        } as any).where(eq(advertisements.id, id));
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { deleteAd } = await import("./db");
        return deleteAd(input.id);
      }),
  }),
});

export type AppRouter = typeof appRouter;
