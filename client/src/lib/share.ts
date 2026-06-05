export type SharePlatform = "copy" | "facebook" | "linkedin" | "native" | "twitter" | "whatsapp";

export type SharePayload = {
  text?: string;
  title: string;
  url: string;
};

export type ShareResult = "cancelled" | "copied" | "shared";

function copyWithFallback(text: string) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {
    copyWithFallback(text);
  }
}

function openPopup(url: string) {
  const width = 640;
  const height = 720;
  const left = Math.max(window.screenX + (window.outerWidth - width) / 2, 0);
  const top = Math.max(window.screenY + (window.outerHeight - height) / 2, 0);

  const popup = window.open(
    url,
    "_blank",
    `noopener,noreferrer,width=${width},height=${height},left=${left},top=${top}`
  );

  if (!popup) {
    window.location.href = url;
  }
}

function isShareCancelled(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

export async function shareLink(platform: SharePlatform, payload: SharePayload): Promise<ShareResult> {
  const shareText = [payload.title, payload.text, payload.url].filter(Boolean).join(" ");

  if (platform === "copy") {
    await copyText(payload.url);
    return "copied";
  }

  if (platform === "native") {
    if (!navigator.share) {
      await copyText(payload.url);
      return "copied";
    }

    try {
      await navigator.share({
        text: payload.text,
        title: payload.title,
        url: payload.url,
      });
      return "shared";
    } catch (error) {
      if (isShareCancelled(error)) {
        return "cancelled";
      }
      throw error;
    }
  }

  let shareUrl = "";

  switch (platform) {
    case "facebook":
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(payload.url)}`;
      break;
    case "twitter":
      shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(payload.url)}&text=${encodeURIComponent(payload.title)}`;
      break;
    case "linkedin":
      shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(payload.url)}`;
      break;
    case "whatsapp":
      shareUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
      break;
  }

  openPopup(shareUrl);
  return "shared";
}
