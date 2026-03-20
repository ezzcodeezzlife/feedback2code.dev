"use client";

import { useState, type ReactNode } from "react";
import Button from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

/** VS Code Dark+–style tokens so the snippet reads like normal editor JS/HTML, not app theme colors. */
const t = {
  punct: "text-[#808080]",
  tag: "text-[#569cd6]",
  attr: "text-[#9cdcfe]",
  str: "text-[#ce9178]",
  plain: "text-[#d4d4d4]",
} as const;

type Props = {
  code: string;
};

export default function EmbedSnippetCopy({ code }: Props) {
  const [copied, setCopied] = useState(false);

  function renderHighlightedCode(snippet: string): ReactNode {
    const match = snippet.match(
      /^<script\s+src="([^"]+)"\s+async><\/script>\s*$/i,
    );
    if (!match) return <span className={t.plain}>{snippet}</span>;

    const src = match[1];

    return (
      <>
        <span className={t.punct}>&lt;</span>
        <span className={t.tag}>script</span>
        <span className={t.plain}> </span>
        <span className={t.attr}>src</span>
        <span className={t.plain}>=</span>
        <span className={t.str}>
          {"\""}
          {src}
          {"\""}
        </span>
        <span className={t.plain}> </span>
        <span className={t.attr}>async</span>
        <span className={t.punct}>&gt;</span>
        <span className={t.punct}>&lt;/</span>
        <span className={t.tag}>script</span>
        <span className={t.punct}>&gt;</span>
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
      <div className="flex items-stretch gap-2">
        <pre className="flex-1 overflow-x-auto rounded-sm border border-[#3c3c3c] bg-[#1e1e1e] p-4 font-mono text-xs leading-relaxed text-[#d4d4d4]">
          <code className="whitespace-pre">{renderHighlightedCode(code)}</code>
        </pre>
        <Button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Copied to clipboard" : "Copy embed snippet"}
          variant="outline"
          size="sm"
          className="shrink-0 h-auto self-stretch"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" /> Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" /> Copy
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
