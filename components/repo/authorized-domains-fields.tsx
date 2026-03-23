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
            <div key={`domain-container-${index}`} className="flex items-start gap-2">
              <div className="flex-1 space-y-1.5">
                <Input
                  type="text"
                  name="authorizedDomains"
                  value={domain}
                  onChange={(event) => updateDomain(index, event.target.value)}
                  onBlur={(event) =>
                    updateDomain(index, event.target.value, true)
                  }
                  placeholder="example.com"
                  className={
                    warning ? "border-amber-500/50 focus:border-amber-500" : ""
                  }
                />
                {warning && (
                  <div className="flex items-start gap-1.5 rounded border border-amber-500/20 bg-amber-500/5 p-2 text-[11px] text-amber-500">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <p className="leading-normal">{warning}</p>
                  </div>
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



