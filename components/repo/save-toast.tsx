"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function SaveToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const saved = searchParams.get("saved");
  const toastNonce = searchParams.get("toast");

  useEffect(() => {
    if (!saved) return;

    // React dev `StrictMode` can run effects twice on mount. We suppress the
    // duplicate only for the same redirect nonce, so repeated saves still show.
    const nonceKey = toastNonce ?? "no-nonce";
    const shownKey = `f2c_toast_shown_${saved}_${nonceKey}`;
    if (typeof window !== "undefined") {
      if (window.sessionStorage.getItem(shownKey)) return;
      window.sessionStorage.setItem(shownKey, "1");
    }

    if (saved === "domains") {
      toast("Authorized domains saved.");
    } else if (saved === "instructions") {
      toast("Agent instructions saved.");
    } else if (saved === "email") {
      toast("Email notification setting saved.");
    } else {
      toast("Saved.");
    }

    // Remove `saved` from the URL so refresh doesn't re-trigger the toast.
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("saved");
      url.searchParams.delete("toast");
      router.replace(`${url.pathname}${url.searchParams.toString() ? `?${url.searchParams}` : ""}${url.hash}`);
    }
  }, [saved, toastNonce, router]);

  return null;
}

