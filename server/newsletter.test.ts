import { describe, expect, it } from "vitest";
import {
  buildNewsletterUnsubscribeUrl,
  chunkNewsletterRecipients,
  extractEmailsFromText,
  getDailyCampaignKey,
  NEWSLETTER_RESEND_BCC_CHUNK_SIZE,
  normalizeNewsletterEmail,
  shouldRetryNewsletterWithResendOnboarding,
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

  it("detects resend domain verification errors for fallback sending", () => {
    expect(
      shouldRetryNewsletterWithResendOnboarding(
        'Resend send failed (403): {"message":"The lebrief.energy domain is not verified. Please, add and verify your domain on https://resend.com/domains"}',
      ),
    ).toBe(true);

    expect(
      shouldRetryNewsletterWithResendOnboarding(
        'Resend send failed (429): {"message":"Too many requests"}',
      ),
    ).toBe(false);
  });

  it("splits newsletter recipients so anchor plus bcc stay within resend limits", () => {
    expect(NEWSLETTER_RESEND_BCC_CHUNK_SIZE).toBe(49);

    const recipients = Array.from({ length: 50 }, (_, index) => `reader${index + 1}@example.com`);
    const chunks = chunkNewsletterRecipients(recipients);

    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toHaveLength(49);
    expect(chunks[1]).toHaveLength(1);
  });

  it("builds a stable daily campaign key per language and day", () => {
    const referenceDate = new Date("2026-06-18T14:30:00Z");

    expect(getDailyCampaignKey(referenceDate, "fr")).toBe("daily-fr-2026-06-18");
    expect(getDailyCampaignKey(referenceDate, "en")).toBe("daily-en-2026-06-18");
    expect(getDailyCampaignKey(referenceDate, "ar")).toBe("daily-ar-2026-06-18");
  });
});
