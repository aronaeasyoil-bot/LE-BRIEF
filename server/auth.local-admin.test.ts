import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type CookieCall = {
  name: string;
  value: string;
  options: Record<string, unknown>;
};

function createPublicContext() {
  const cookies: CookieCall[] = [];

  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      cookie: (name: string, value: string, options: Record<string, unknown>) => {
        cookies.push({ name, value, options });
      },
      clearCookie: () => {},
    } as unknown as TrpcContext["res"],
  };

  return { ctx, cookies };
}

const originalEnv = { ...process.env };

describe("local admin auth", () => {
  beforeEach(() => {
    process.env.ADMIN_EMAIL = "admin@lebrief.media";
    process.env.ADMIN_PASSWORD = "Secret123!Codex";
    process.env.ADMIN_NAME = "LE BRIEF Admin";
    process.env.JWT_SECRET = "unit-test-secret";
    process.env.VITE_APP_ID = "unit-test-app";
    process.env.OAUTH_SERVER_URL = "https://example.com";
    process.env.DATABASE_URL = "";
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.resetModules();
  });

  it("creates an admin session cookie for valid credentials", async () => {
    const { appRouter } = await import("./routers");
    const { sdk } = await import("./_core/sdk");
    const { isLocalAdminOpenId } = await import("./_core/localAdmin");
    const { ctx, cookies } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.adminLogin({
      email: "admin@lebrief.media",
      password: "Secret123!Codex",
    });

    expect(result).toEqual({ success: true });
    expect(cookies).toHaveLength(1);
    expect(cookies[0]?.name).toBe(COOKIE_NAME);
    expect(cookies[0]?.options).toMatchObject({
      httpOnly: true,
      sameSite: "none",
      secure: true,
      path: "/",
    });

    const session = await sdk.verifySession(cookies[0]?.value);

    expect(session).not.toBeNull();
    expect(session?.name).toBe("LE BRIEF Admin");
    expect(isLocalAdminOpenId(session?.openId ?? "")).toBe(true);
  }, 25000);

  it("rejects invalid credentials", async () => {
    const { appRouter } = await import("./routers");
    const { ctx, cookies } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.adminLogin({
        email: "admin@lebrief.media",
        password: "wrong-password",
      })
    ).rejects.toThrow("Invalid admin credentials");

    expect(cookies).toHaveLength(0);
  });
});
