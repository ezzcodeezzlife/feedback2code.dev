"use client";

import { useState } from "react";

type Props = {
  code: string;
};

export default function EmbedSnippetCopy({ code }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">One-line embed</p>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Copied to clipboard" : "Copy embed snippet"}
          className="rounded-md border border-black/15 px-3 py-1.5 text-xs font-medium transition hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="mt-2 overflow-x-auto rounded-md border border-black/15 bg-zinc-50 p-3 text-xs leading-relaxed dark:border-white/15 dark:bg-zinc-950">
        {code}
      </pre>
    </div>
  );
}
