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

const LEGACY_STORAGE_KEY = "lebrief-newsletter-popup-state";
const DISMISS_STORAGE_KEY = "lebrief-newsletter-popup-dismissed";
const SUBSCRIBED_STORAGE_KEY = "lebrief-newsletter-popup-subscribed";

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function canUseSessionStorage() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function readState(raw: string | null): NewsletterPopupState | null {
  if (!raw) {
    return null;
  }

  try {
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

function removeLegacyDismissedState() {
  if (!canUseLocalStorage()) {
    return;
  }

  try {
    const legacyState = readState(window.localStorage.getItem(LEGACY_STORAGE_KEY));
    if (legacyState?.status === "dismissed") {
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
  } catch {
    // Ignore storage cleanup issues.
  }
}

function migrateLegacySubscribedState() {
  if (!canUseLocalStorage()) {
    return null;
  }

  try {
    const subscribedState = readState(window.localStorage.getItem(SUBSCRIBED_STORAGE_KEY));
    if (subscribedState?.status === "subscribed") {
      return subscribedState;
    }

    const legacyState = readState(window.localStorage.getItem(LEGACY_STORAGE_KEY));
    if (legacyState?.status === "subscribed") {
      window.localStorage.setItem(SUBSCRIBED_STORAGE_KEY, JSON.stringify(legacyState));
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
      return legacyState;
    }
  } catch {
    return null;
  }

  return null;
}

export function getNewsletterPopupState(): NewsletterPopupState | null {
  if (!canUseLocalStorage() && !canUseSessionStorage()) {
    return null;
  }

  const subscribedState = migrateLegacySubscribedState();
  if (subscribedState?.status === "subscribed") {
    return subscribedState;
  }

  removeLegacyDismissedState();

  if (canUseSessionStorage()) {
    const dismissedState = readState(window.sessionStorage.getItem(DISMISS_STORAGE_KEY));
    if (dismissedState?.status === "dismissed") {
      return dismissedState;
    }
  }

  if (canUseLocalStorage()) {
    const state = readState(window.localStorage.getItem(SUBSCRIBED_STORAGE_KEY));
    if (state?.status === "subscribed") {
      return state;
    }
  }

  return null;
}

function setDismissedState(state: NewsletterPopupState) {
  if (!canUseSessionStorage()) {
    return null;
  }

  try {
    window.sessionStorage.setItem(DISMISS_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage write issues.
  }
}

function setSubscribedState(state: NewsletterPopupState) {
  if (!canUseLocalStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(SUBSCRIBED_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage write issues.
  }
}

export function markNewsletterPopupDismissed(reason: NewsletterPopupDismissReason) {
  setDismissedState({
    reason,
    status: "dismissed",
    timestamp: Date.now(),
  });
}

export function markNewsletterPopupSubscribed() {
  setSubscribedState({
    status: "subscribed",
    timestamp: Date.now(),
  });
}

export function shouldSuppressNewsletterPopup() {
  const state = getNewsletterPopupState();
  if (!state) {
    return false;
  }

  return state.status === "subscribed" || state.status === "dismissed";
}
