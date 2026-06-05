import { useEffect } from "react";
import { PREVIEW_IMAGE_URL, SITE_DESCRIPTION, SITE_NAME, getAbsoluteAssetUrl, getSiteUrl } from "@/lib/site";

type PageMetaOptions = {
  description?: string;
  image?: string;
  path?: string;
  title?: string;
  type?: "article" | "website";
};

function upsertMeta(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector(selector) as HTMLMetaElement | null;

  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element?.setAttribute(key, value);
  });
}

function upsertLink(rel: string, href: string) {
  let element = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;

  if (!element) {
    element = document.createElement("link");
    element.rel = rel;
    document.head.appendChild(element);
  }

  element.href = href;
}

function toAbsoluteUrl(pathOrUrl: string) {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  return getAbsoluteAssetUrl(pathOrUrl);
}

export function usePageMeta({
  description,
  image,
  path,
  title,
  type = "website",
}: PageMetaOptions) {
  useEffect(() => {
    const resolvedTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} | Energy, Economy & Events`;
    const resolvedDescription = description || SITE_DESCRIPTION;
    const resolvedUrl = getSiteUrl(path || window.location.pathname);
    const resolvedImage = toAbsoluteUrl(image || PREVIEW_IMAGE_URL);

    document.title = resolvedTitle;

    upsertMeta('meta[name="description"]', { content: resolvedDescription, name: "description" });
    upsertMeta('meta[property="og:type"]', { content: type, property: "og:type" });
    upsertMeta('meta[property="og:site_name"]', { content: SITE_NAME, property: "og:site_name" });
    upsertMeta('meta[property="og:title"]', { content: resolvedTitle, property: "og:title" });
    upsertMeta('meta[property="og:description"]', { content: resolvedDescription, property: "og:description" });
    upsertMeta('meta[property="og:url"]', { content: resolvedUrl, property: "og:url" });
    upsertMeta('meta[property="og:image"]', { content: resolvedImage, property: "og:image" });
    upsertMeta('meta[name="twitter:card"]', { content: "summary_large_image", name: "twitter:card" });
    upsertMeta('meta[name="twitter:title"]', { content: resolvedTitle, name: "twitter:title" });
    upsertMeta('meta[name="twitter:description"]', { content: resolvedDescription, name: "twitter:description" });
    upsertMeta('meta[name="twitter:image"]', { content: resolvedImage, name: "twitter:image" });

    upsertLink("canonical", resolvedUrl);
  }, [description, image, path, title, type]);
}
