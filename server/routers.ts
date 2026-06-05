import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { uploadAdminFile } from "./_core/fileUpload";
import { sdk } from "./_core/sdk";
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

export const appRouter = router({
  system: systemRouter,
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
        featured: z.boolean().optional(),
        published: z.boolean().optional(),
        language: z.enum(["fr", "en", "ar", "all"]).optional(),
        publishedAt: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await createArticle({
          ...input,
          authorName: normalizeOptionalText(input.authorName),
          featured: input.featured ?? false,
          imageUrl: normalizeOptionalText(input.imageUrl),
          published: input.published ?? false,
          language: input.language ?? "all",
          publishedAt: input.publishedAt ?? new Date(),
        });
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
        featured: z.boolean().optional(),
        published: z.boolean().optional(),
        language: z.enum(["fr", "en", "ar", "all"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateArticle(id, {
          ...data,
          authorName: normalizeOptionalText(data.authorName),
          imageUrl: normalizeOptionalText(data.imageUrl),
        });
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteArticle(input.id);
        return { success: true };
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
