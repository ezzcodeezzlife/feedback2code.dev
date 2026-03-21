"use client";

import Button from "@/components/ui/button";
import { Cookie } from "lucide-react";
import Link from "next/link";

type Props = {
  onAccept: () => void;
  onReject: () => void;
};

export default function CookieConsentBanner({ onAccept, onReject }: Props) {
  return (
    <div
      className="fixed z-100 border-t border-border bg-surface-raised/95 px-3 py-2 shadow-[0_-4px_24px_rgba(0,0,0,0.35)] backdrop-blur-sm animate-slide-up sm:px-4 sm:py-2.5 supports-[padding:max(0px)]:pb-[max(0.5rem,env(safe-area-inset-bottom))] max-lg:bottom-0 max-lg:left-0 max-lg:right-0 lg:bottom-6 lg:right-6 lg:left-auto lg:w-[min(24rem,calc(100vw-3rem))] lg:supports-[padding:max(0px)]:pb-3"
      role="dialog"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-desc"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4 lg:mx-0 lg:max-w-none lg:flex-col lg:items-stretch lg:gap-3">
        <div className="min-w-0 space-y-0.5 sm:space-y-1 sm:pr-2">
          <p
            id="cookie-banner-title"
            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-accent sm:gap-2 sm:text-xs"
          >
            <Cookie className="size-3 shrink-0 sm:size-3.5" aria-hidden />
            Cookies
          </p>
          <p
            id="cookie-banner-desc"
            className="text-xs leading-snug text-muted-foreground sm:text-sm sm:leading-relaxed"
          >
            Optional analytics help us improve the product. Decline skips third-party scripts.{" "}
            <Link
              href="/legal"
              className="text-foreground underline decoration-border-bright underline-offset-2 transition-colors hover:text-accent hover:decoration-accent"
            >
              More information
            </Link>
          </p>
        </div>
        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-nowrap sm:justify-end sm:gap-2 lg:w-full lg:justify-end">
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={onReject}
            className="h-11 w-full touch-manipulation text-xs sm:h-9 sm:w-auto sm:min-w-22 sm:text-sm lg:h-9 lg:w-auto"
          >
            Decline
          </Button>
          <Button
            type="button"
            variant="default"
            size="default"
            onClick={onAccept}
            className="h-11 w-full touch-manipulation text-xs sm:h-9 sm:w-auto sm:min-w-22 sm:text-sm lg:h-9 lg:w-auto"
          >
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
