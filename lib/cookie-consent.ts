export const COOKIE_CONSENT_STORAGE_KEY = "f2c_cookie_consent";

export type CookieConsentValue = "accepted" | "rejected";

export function readStoredCookieConsent(): CookieConsentValue | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
  return raw === "accepted" || raw === "rejected" ? raw : null;
}

export function persistCookieConsent(value: CookieConsentValue) {
  localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, value);
}
