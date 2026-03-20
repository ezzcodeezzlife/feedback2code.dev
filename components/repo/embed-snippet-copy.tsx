"use client";

import { useState } from "react";
import Button from "@/components/ui/button";

type Props = {
  code: string;
};

export default function EmbedSnippetCopy({ code }: Props) {
  const [copied, setCopied] = useState(false);

  // Very small, purpose-built highlighting for our one-line embed snippet.
  // We keep this dependency-free; if the format ever changes, we fall back
  // to rendering the raw code string.
  function renderHighlightedCode(snippet: string): React.ReactNode {
    // Example:
    // <script src="https://.../widget/ID" async></script>
    const match = snippet.match(
      /^<script\s+src="([^"]+)"\s+async><\/script>\s*$/i,
    );
    if (!match) return snippet;

    const src = match[1];

    return (
      <>
        <span className="text-indigo-700 dark:text-indigo-300">&lt;script</span>
        <span className="text-zinc-500 dark:text-zinc-400"> </span>
        <span className="text-cyan-700 dark:text-cyan-300">src=</span>
        <span className="text-emerald-700 dark:text-emerald-300">
          {"\""}
          {src}
          {"\""}
        </span>
        <span className="text-amber-600 dark:text-amber-400"> async</span>
        <span className="text-indigo-700 dark:text-indigo-300">&gt;</span>
        <span className="text-indigo-700 dark:text-indigo-300">&lt;/script&gt;</span>
      </>
    );
  }

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
        <Button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Copied to clipboard" : "Copy embed snippet"}
          variant="outline"
          size="sm"
        >
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre className="mt-2 overflow-x-auto rounded-md border border-black/15 bg-zinc-50 p-3 text-xs leading-relaxed dark:border-white/15 dark:bg-zinc-950">
        <code className="whitespace-pre">{renderHighlightedCode(code)}</code>
      </pre>
    </div>
  );
}
