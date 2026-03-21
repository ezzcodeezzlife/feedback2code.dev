"use client";

import { GoogleAnalytics } from "@next/third-parties/google";
import CookieConsentBanner from "@/components/cookie-consent-banner";
import { persistCookieConsent, readStoredCookieConsent } from "@/lib/cookie-consent";
import { useCallback, useEffect, useState } from "react";

type ConsentState = "accepted" | "rejected" | null;

type Props = {
  gaMeasurementId?: string;
};

/**
 * Loads optional third-party scripts (e.g. Google Analytics) only after the user accepts.
 * Add other gated `<Script>` or third-party components beside `GoogleAnalytics` when needed.
 */
export default function CookieConsentGate({ gaMeasurementId }: Props) {
  const [hydrated, setHydrated] = useState(false);
  const [consent, setConsent] = useState<ConsentState>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setConsent(readStoredCookieConsent());
      setHydrated(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const accept = useCallback(() => {
    persistCookieConsent("accepted");
    setConsent("accepted");
  }, []);

  const reject = useCallback(() => {
    persistCookieConsent("rejected");
    setConsent("rejected");
  }, []);

  // Production: prompt only when optional scripts are configured. Dev: always show so the flow is testable.
  const needsChoice =
    Boolean(gaMeasurementId) || process.env.NODE_ENV === "development";
  const showBanner = hydrated && consent === null && needsChoice;
  const allowAnalytics = Boolean(gaMeasurementId && consent === "accepted");

  return (
    <>
      {allowAnalytics ? <GoogleAnalytics gaId={gaMeasurementId!} /> : null}
      {showBanner ? <CookieConsentBanner onAccept={accept} onReject={reject} /> : null}
    </>
  );
}
