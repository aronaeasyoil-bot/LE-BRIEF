import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      email: "admin@lebrief.com",
      name: "Admin",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "regular-user",
      email: "user@example.com",
      name: "User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

describe("articles router", () => {
  it("published articles can be queried by public users", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.articles.published({ limit: 5 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("featured articles can be queried by public users", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.articles.featured({ limit: 3 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("admin can list all articles", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.articles.all();
    expect(Array.isArray(result)).toBe(true);
  });

  it("regular user cannot list all articles (admin only)", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.articles.all()).rejects.toThrow();
  });

  it("unauthenticated user cannot create articles", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.articles.create({
        titleFr: "Test",
        categoryId: 1,
      })
    ).rejects.toThrow();
  });

  it("regular user cannot create articles", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(
      caller.articles.create({
        titleFr: "Test",
        categoryId: 1,
      })
    ).rejects.toThrow();
  });
});

describe("categories router", () => {
  it("categories can be listed by public users", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.categories.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("events router", () => {
  it("published events can be queried by public users", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.events.published();
    expect(Array.isArray(result)).toBe(true);
  });

  it("regular user cannot list all events (admin only)", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.events.all()).rejects.toThrow();
  });
});

describe("newsletter router", () => {
  it("rejects invalid email", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.newsletter.subscribe({ email: "not-an-email" })
    ).rejects.toThrow();
  });
});
