"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RouteAutoRefresh({
  intervalMs = 5_000,
}: {
  intervalMs?: number;
}) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      router.refresh();
    }, intervalMs);

    return () => clearInterval(id);
  }, [intervalMs, router]);

  return null;
}
