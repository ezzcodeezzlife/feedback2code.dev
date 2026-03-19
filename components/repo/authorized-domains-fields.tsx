"use client";

import { useState } from "react";

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
        <button
          type="button"
          onClick={addDomain}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-black/15 text-lg leading-none transition hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
          aria-label="Add authorized domain"
        >
          +
        </button>
      </div>

      <div className="space-y-2">
        {domains.map((domain, index) => (
          <div key={`domain-${index}`} className="flex items-center gap-2">
            <input
              type="text"
              name="authorizedDomains"
              value={domain}
              onChange={(event) => updateDomain(index, event.target.value)}
              placeholder="example.com"
              className="w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none ring-0 placeholder:text-zinc-400 focus:border-black/30 dark:border-white/20 dark:focus:border-white/40"
            />
            <button
              type="button"
              onClick={() => removeDomain(index)}
              className="rounded-md border border-black/15 px-2 py-2 text-sm transition hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
        Add one domain per field.
      </p>
    </div>
  );
}
