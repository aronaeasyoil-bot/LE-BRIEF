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
        return getFeaturedArticles(4);
      }),
    published: publicProcedure
      .input(z.object({}).optional())
      .query(async () => {
        return getPublishedArticles();
      }),
    byCategory: publicProcedure
      .input(z.object({ categoryId: z.number() }))
      .query(async ({ input }) => {
        return getArticlesByCategory(input.categoryId);
      }),
    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getArticleById(input.id);
      }),
    all: adminProcedure.query(async () => {
      return getAllArticles();
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
          featured: input.featured ?? false,
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
        await updateArticle(id, data);
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
      return getPublishedEvents();
    }),
    all: adminProcedure.query(async () => {
      return getAllEvents();
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
        await updateEvent(id, data);
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
      return db.select().from(magazines).orderBy(desc(magazines.publishedAt)).limit(10);
    }),
    all: adminProcedure.query(async () => {
      const db = await (await import("./db")).getDb();
      if (!db) return [];
      return db.select().from(magazines).orderBy(desc(magazines.publishedAt));
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
          coverImageUrl: input.coverImageUrl ?? "",
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
        return updateMagazine(id, data as any);
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
      return db.select().from(advertisements).where(eq(advertisements.active, true)).orderBy(asc(advertisements.sortOrder));
    }),
    all: adminProcedure.query(async () => {
      const db = await (await import("./db")).getDb();
      if (!db) return [];
      return db.select().from(advertisements).orderBy(asc(advertisements.sortOrder));
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
        const result = await db.insert(advertisements).values(input as any);
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
        return db.update(advertisements).set(data as any).where(eq(advertisements.id, id));
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
