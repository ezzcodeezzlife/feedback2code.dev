"use client";

import Button from "@/components/ui/button";
import { useState } from "react";

type BillingAction = "upgrade" | "portal" | null;

export function BillingActions({ isPro }: { isPro: boolean }) {
  const [pending, setPending] = useState<BillingAction>(null);
  const [error, setError] = useState<string | null>(null);

  async function start(path: "/api/billing/checkout" | "/api/billing/portal", action: BillingAction) {
    setPending(action);
    setError(null);
    try {
      const res = await fetch(path, { method: "POST" });
      const data = (await res.json()) as { ok?: boolean; url?: string; message?: string };
      if (!res.ok || !data?.ok || !data.url) {
        setError(data?.message ?? "Unable to start billing flow.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Unable to start billing flow.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="space-y-2">
      {isPro ? (
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={() => start("/api/billing/portal", "portal")}
          disabled={pending !== null}
          className="leading-none min-h-8 max-h-8"
        >
          {pending === "portal" ? "Opening..." : "Manage billing"}
        </Button>
      ) : (
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={() => start("/api/billing/checkout", "upgrade")}
          disabled={pending !== null}
          className="leading-none min-h-8 max-h-8"
        >
          {pending === "upgrade" ? "Redirecting..." : "Upgrade to Pro ($20/mo)"}
        </Button>
      )}
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
