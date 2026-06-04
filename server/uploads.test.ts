import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const storagePutMock = vi.fn();

vi.mock("./storage", () => ({
  storagePut: storagePutMock,
}));

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      email: "admin@lebrief.com",
      name: "Admin",
      loginMethod: "local",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {}, cookie: () => {} } as unknown as TrpcContext["res"],
  };
}

describe("uploads router", () => {
  beforeEach(() => {
    storagePutMock.mockReset();
    storagePutMock.mockResolvedValue({
      key: "le-brief/documents/test.pdf",
      url: "/manus-storage/le-brief/documents/test.pdf",
    });
  });

  it("uploads an admin document file to storage", async () => {
    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller(createAdminContext());

    const result = await caller.uploads.file({
      bucket: "documents",
      fileName: "edition-71.pdf",
      mimeType: "application/pdf",
      dataBase64: Buffer.from("hello").toString("base64"),
      size: 5,
    });

    expect(storagePutMock).toHaveBeenCalledTimes(1);
    expect(storagePutMock.mock.calls[0]?.[0]).toContain("le-brief/documents/");
    expect(storagePutMock.mock.calls[0]?.[2]).toBe("application/pdf");
    expect(result.url).toBe("/manus-storage/le-brief/documents/test.pdf");
  });

  it.each([
    {
      bucket: "images" as const,
      fileName: "cover.png",
      mimeType: "image/png",
      expectedPrefix: "le-brief/images/",
    },
    {
      bucket: "videos" as const,
      fileName: "spot.mp4",
      mimeType: "video/mp4",
      expectedPrefix: "le-brief/videos/",
    },
  ])("accepts supported $bucket uploads", async ({ bucket, fileName, mimeType, expectedPrefix }) => {
    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller(createAdminContext());

    await caller.uploads.file({
      bucket,
      fileName,
      mimeType,
      dataBase64: Buffer.from("ok").toString("base64"),
      size: 2,
    });

    expect(storagePutMock).toHaveBeenCalledTimes(1);
    expect(storagePutMock.mock.calls[0]?.[0]).toContain(expectedPrefix);
    expect(storagePutMock.mock.calls[0]?.[2]).toBe(mimeType);
  });

  it("rejects unsupported document formats", async () => {
    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller(createAdminContext());

    await expect(
      caller.uploads.file({
        bucket: "documents",
        fileName: "virus.exe",
        mimeType: "application/x-msdownload",
        dataBase64: Buffer.from("bad").toString("base64"),
        size: 3,
      })
    ).rejects.toThrow("Unsupported document file type");
  });
});
