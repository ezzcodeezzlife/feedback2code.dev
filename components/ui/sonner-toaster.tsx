"use client";

import { Toaster } from "sonner";

export function SonnerToaster() {
  return (
    <Toaster
      theme="dark"
      position="top-right"
      toastOptions={{
        style: {
          background: "#111111",
          border: "1px solid #222222",
          color: "#ededed",
          fontFamily: "inherit",
          fontSize: "13px",
        },
      }}
    />
  );
}
