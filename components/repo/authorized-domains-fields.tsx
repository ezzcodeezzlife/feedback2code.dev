"use client";

import { useState } from "react";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { Plus, X } from "lucide-react";

type Props = {
  initialDomains: string[];
};

export default function AuthorizedDomainsFields({ initialDomains }: Props) {
  const [domains, setDomains] = useState<string[]>(
    initialDomains.length > 0 ? initialDomains : [""],
  );

  function updateDomain(index: number, value: string) {
    setDomains((current) =>
      current.map((domain, i) => (i === index ? value : domain)),
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
      <div className="space-y-2">
        {domains.map((domain, index) => (
          <div key={`domain-${index}`} className="flex items-center gap-2">
            <Input
              type="text"
              name="authorizedDomains"
              value={domain}
              onChange={(event) => updateDomain(index, event.target.value)}
              placeholder="example.com"
            />
            <Button
              type="button"
              onClick={() => removeDomain(index)}
              variant="ghost"
              size="icon"
              aria-label="Remove domain"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>

      <Button
        type="button"
        onClick={addDomain}
        variant="outline"
        size="sm"
        className="mt-2"
      >
        <Plus className="mr-1 h-3.5 w-3.5" />
        Add domain
      </Button>

        
    </div>
  );
}
