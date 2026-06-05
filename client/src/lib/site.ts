import type { Language } from "./i18n";

export const SITE_NAME = "LE BRIEF";
export const SITE_URL = "https://www.lebrief.energy";
export const SITE_DESCRIPTION =
  "Strategic intelligence on energy, economy, investment, and events across Africa and the Middle East.";

export const CONTACT_EMAIL = "contact@lebrief.energy";
export const CONTACT_PHONE_DISPLAY = "+971 55 442 0793";
export const CONTACT_PHONE_E164 = "971554420793";
export const CONTACT_PHONE_SECONDARY = "054 333 8520";
export const CONTACT_LOCATION = "Dubai - Senegal";

export const LINKEDIN_URL = "https://www.linkedin.com/company/magazinelebrief/";
export const INSTAGRAM_URL = "https://www.instagram.com/mag_lebrief";

export const PREVIEW_IMAGE_PATH = "/media/lebrief-share-preview.jpeg";
export const PREVIEW_IMAGE_URL = `${SITE_URL}${PREVIEW_IMAGE_PATH}`;

const whatsappMessages: Record<Language, string> = {
  fr: "Bonjour LE BRIEF, je souhaite en savoir plus sur vos contenus et services.",
  en: "Hello LE BRIEF, I would like to learn more about your content and services.",
  ar: "مرحبا LE BRIEF، أود معرفة المزيد عن محتواكم وخدماتكم.",
};

export function getSiteUrl(path = "/") {
  return new URL(path, SITE_URL).toString();
}

export function getAbsoluteAssetUrl(path: string) {
  return new URL(path, SITE_URL).toString();
}

export function getContactMailto(subject?: string) {
  if (!subject) return `mailto:${CONTACT_EMAIL}`;

  const params = new URLSearchParams({ subject });
  return `mailto:${CONTACT_EMAIL}?${params.toString()}`;
}

export function getWhatsAppContactUrl(lang: Language) {
  const url = new URL(`https://wa.me/${CONTACT_PHONE_E164}`);
  url.searchParams.set("text", whatsappMessages[lang]);
  return url.toString();
}
