import { articleMatchesCoverage, getArticleCoverageMatches } from "./editorial";
import { describe, expect, it } from "vitest";

describe("editorial coverage helpers", () => {
  it("matches Senegal coverage from local energy signals", () => {
    const article = {
      titleFr: "SENELEC accelere un nouveau cap pour l'electricite a Dakar",
      excerptFr: "Le Senegal renforce son dispositif.",
      tags: "SENELEC, Dakar, electricite",
    };

    expect(getArticleCoverageMatches(article)).toContain("senegal");
    expect(articleMatchesCoverage(article, "afrique")).toBe(true);
  });

  it("falls back to international when no African marker is present", () => {
    const article = {
      titleEn: "OPEC traders brace for a new Gulf market shock",
      excerptEn: "Global markets react to Middle East tensions.",
      tags: "OPEC, Gulf, crude",
    };

    expect(getArticleCoverageMatches(article)).toEqual(["international"]);
    expect(articleMatchesCoverage(article, "international")).toBe(true);
  });
});
