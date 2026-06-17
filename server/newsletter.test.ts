import { describe, expect, it } from "vitest";
import {
  buildNewsletterUnsubscribeUrl,
  extractEmailsFromText,
  normalizeNewsletterEmail,
  verifyNewsletterUnsubscribeToken,
} from "./_core/newsletter";

describe("newsletter helpers", () => {
  it("extracts unique emails from mixed text and csv rows", () => {
    const result = extractEmailsFromText(`
      Email,Contexte
      info@example.com,"info@example.com, sales@example.com"
      CONTACT@EXAMPLE.COM
      bad-email
    `);

    expect(result).toEqual([
      "info@example.com",
      "sales@example.com",
      "contact@example.com",
    ]);
  });

  it("normalizes newsletter email values", () => {
    expect(normalizeNewsletterEmail(' "Contact@LeBrief.energy"; ')).toBe("contact@lebrief.energy");
  });

  it("creates verifiable unsubscribe urls", () => {
    const url = new URL(buildNewsletterUnsubscribeUrl("reader@example.com"));
    expect(url.pathname).toBe("/api/newsletter/unsubscribe");
    expect(url.searchParams.get("email")).toBe("reader@example.com");
    expect(
      verifyNewsletterUnsubscribeToken(
        String(url.searchParams.get("email")),
        String(url.searchParams.get("token")),
      ),
    ).toBe(true);
  });
});

