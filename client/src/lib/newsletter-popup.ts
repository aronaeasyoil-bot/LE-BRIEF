export type NewsletterPopupDismissReason = "auto" | "manual";

type NewsletterPopupState =
  | {
      status: "dismissed";
      reason: NewsletterPopupDismissReason;
      timestamp: number;
    }
  | {
      status: "subscribed";
      timestamp: number;
    };

const STORAGE_KEY = "lebrief-newsletter-popup-state";
const AUTO_DISMISS_COOLDOWN_MS = 12 * 60 * 60 * 1000;
const MANUAL_DISMISS_COOLDOWN_MS = 24 * 60 * 60 * 1000;

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getNewsletterPopupState(): NewsletterPopupState | null {
  if (!canUseStorage()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as NewsletterPopupState | null;
    if (!parsed || typeof parsed !== "object" || typeof parsed.timestamp !== "number") {
      return null;
    }

    if (parsed.status === "subscribed") {
      return parsed;
    }

    if (parsed.status === "dismissed" && (parsed.reason === "auto" || parsed.reason === "manual")) {
      return parsed;
    }

    return null;
  } catch {
    return null;
  }
}

function setNewsletterPopupState(state: NewsletterPopupState) {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage write issues.
  }
}

export function markNewsletterPopupDismissed(reason: NewsletterPopupDismissReason) {
  setNewsletterPopupState({
    reason,
    status: "dismissed",
    timestamp: Date.now(),
  });
}

export function markNewsletterPopupSubscribed() {
  setNewsletterPopupState({
    status: "subscribed",
    timestamp: Date.now(),
  });
}

export function shouldSuppressNewsletterPopup(now = Date.now()) {
  const state = getNewsletterPopupState();
  if (!state) {
    return false;
  }

  if (state.status === "subscribed") {
    return true;
  }

  const cooldown =
    state.reason === "manual" ? MANUAL_DISMISS_COOLDOWN_MS : AUTO_DISMISS_COOLDOWN_MS;

  return now - state.timestamp < cooldown;
}
