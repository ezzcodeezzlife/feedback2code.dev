"use client";

import { useState } from "react";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";

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
      <div className="mb-2 flex items-center justify-between">
        <label className="block text-sm font-medium">Authorized domains</label>
        <Button
          type="button"
          onClick={addDomain}
          variant="outline"
          size="icon"
          aria-label="Add authorized domain"
        >
          +
        </Button>
      </div>

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
              variant="outline"
              size="sm"
            >
              Remove
            </Button>
          </div>
        ))}
      </div>

      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
        Add one domain per field.
      </p>
    </div>
  );
}
