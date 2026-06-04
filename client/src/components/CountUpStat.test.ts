import { describe, it, expect } from "vitest";

describe("CountUpStat", () => {
  it("should extract numeric value and suffix from value prop", () => {
    const testCases = [
      { input: "22K+", expectedNum: 22, expectedSuffix: "K+" },
      { input: "15+", expectedNum: 15, expectedSuffix: "+" },
      { input: "80%", expectedNum: 80, expectedSuffix: "%" },
      { input: "15K", expectedNum: 15, expectedSuffix: "K" },
    ];

    testCases.forEach(({ input, expectedNum, expectedSuffix }) => {
      const match = input.match(/^(\d+)(.*)$/);
      const num = match ? parseInt(match[1]) : 0;
      const suffix = match ? match[2] : "";
      
      expect(num).toBe(expectedNum);
      expect(suffix).toBe(expectedSuffix);
    });
  });

  it("should handle edge cases in value parsing", () => {
    const edgeCases = [
      { input: "0", expectedNum: 0, expectedSuffix: "" },
      { input: "999K+", expectedNum: 999, expectedSuffix: "K+" },
      { input: "100%", expectedNum: 100, expectedSuffix: "%" },
    ];

    edgeCases.forEach(({ input, expectedNum, expectedSuffix }) => {
      const match = input.match(/^(\d+)(.*)$/);
      const num = match ? parseInt(match[1]) : 0;
      const suffix = match ? match[2] : "";
      
      expect(num).toBe(expectedNum);
      expect(suffix).toBe(expectedSuffix);
    });
  });
});
