import { describe, expect, it } from "vitest";
import { extractAdobeShareDownloadUrl, getMagazineDocumentProxyUrl } from "./_core/magazineDocuments";

describe("magazine document helpers", () => {
  it("extracts the direct PDF URL from an Adobe shared page payload", () => {
    const html = `
      <script id="dc_data" type="application/json">
        {"data":{"file":{"assetURLs":{"download_url":"https://files.example.com/magazine.pdf?token=abc123"}}}}
      </script>
    `;

    expect(extractAdobeShareDownloadUrl(html)).toBe("https://files.example.com/magazine.pdf?token=abc123");
  });

  it("builds a stable internal proxy URL for magazine documents", () => {
    expect(getMagazineDocumentProxyUrl(600001)).toBe("https://www.lebrief.energy/api/magazine-file/600001");
  });
});
