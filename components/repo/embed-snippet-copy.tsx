"use client";

import { useState } from "react";
import Button from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

type Props = {
  code: string;
};

export default function EmbedSnippetCopy({ code }: Props) {
  const [copied, setCopied] = useState(false);

  function renderHighlightedCode(snippet: string): React.ReactNode {
    const match = snippet.match(
      /^<script\s+src="([^"]+)"\s+async><\/script>\s*$/i,
    );
    if (!match) return snippet;

    const src = match[1];

    return (
      <>
        <span className="text-accent">&lt;script</span>
        <span className="text-muted"> </span>
        <span className="text-blue-400">src=</span>
        <span className="text-emerald-400">
          {"\""}
          {src}
          {"\""}
        </span>
        <span className="text-yellow-400"> async</span>
        <span className="text-accent">&gt;</span>
        <span className="text-accent">&lt;/script&gt;</span>
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
        <pre className="flex-1 overflow-x-auto border border-border bg-background p-4 text-xs leading-relaxed">
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
