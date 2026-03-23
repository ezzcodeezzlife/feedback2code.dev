"use client";

import { useState } from "react";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { Plus, X, AlertCircle } from "lucide-react";
import { cleanDomain, getDomainWarning } from "@/lib/widget-origin";

type Props = {
  initialDomains: string[];
};

export default function AuthorizedDomainsFields({ initialDomains }: Props) {
  const [domains, setDomains] = useState<string[]>(
    initialDomains.length > 0 ? initialDomains : [""],
  );

  function updateDomain(index: number, value: string, forceClean = false) {
    let finalValue = value;
    // Auto-clean if it looks like a URL, starts with www., or if forced (on blur)
    if (
      forceClean ||
      value.includes("://") ||
      value.includes("/") ||
      value.toLowerCase().startsWith("www.")
    ) {
      finalValue = cleanDomain(value);
    }

    setDomains((current) =>
      current.map((domain, i) => (i === index ? finalValue : domain)),
    );
  }

  function addDomain() {
    setDomains((current) => [...current, ""]);
  }

  function removeDomain(index: number) {
    setDomains((current) => {
      if (current.length === 1) return [""];
      return current.filter((_, i) => i !== index);
    });
  }

  return (
    <div>
      <p className="my-4 text-xs text-muted">
        One domain per field. Only these origins can load the widget.
      </p>
      <div className="space-y-4">
        {domains.map((domain, index) => {
          const warning = getDomainWarning(domain);
          return (
            <div
              key={`domain-container-${index}`}
              className="flex min-w-0 items-start gap-2"
            >
              <div className="min-w-0 flex-1">
                {warning ? (
                  <div className="overflow-hidden rounded-none border border-amber-500/50 bg-surface transition-[border-color,box-shadow] focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500/30">
                    <Input
                      type="text"
                      name="authorizedDomains"
                      value={domain}
                      onChange={(event) =>
                        updateDomain(index, event.target.value)
                      }
                      onBlur={(event) =>
                        updateDomain(index, event.target.value, true)
                      }
                      placeholder="example.com"
                      className="h-9 rounded-none border-0 border-b border-amber-500/30 bg-transparent focus-visible:border-b-amber-500/40 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                    <div className="flex items-start gap-1.5 bg-amber-500/5 px-3 py-2 text-[11px] leading-snug text-amber-500">
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <p className="min-w-0 flex-1 wrap-break-word">{warning}</p>
                    </div>
                  </div>
                ) : (
                  <Input
                    type="text"
                    name="authorizedDomains"
                    value={domain}
                    onChange={(event) =>
                      updateDomain(index, event.target.value)
                    }
                    onBlur={(event) =>
                      updateDomain(index, event.target.value, true)
                    }
                    placeholder="example.com"
                  />
                )}
              </div>
              <Button
                type="button"
                onClick={() => removeDomain(index)}
                variant="ghost"
                size="icon"
                aria-label="Remove domain"
                className="mt-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        })}

      </div>

      <Button
        type="button"
        onClick={addDomain}
        variant="outline"
        size="sm"
        className="mt-4"
      >
        <Plus className="mr-1 h-3.5 w-3.5" />
        Add domain
      </Button>
    </div>
  );
}



