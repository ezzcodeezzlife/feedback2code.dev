"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  defaultChecked: boolean;
};

export function EmailNotificationToggle({ defaultChecked }: Props) {
  const checkboxRef = useRef<HTMLInputElement | null>(null);
  const [checked, setChecked] = useState(defaultChecked);

  function toggleAndSubmit() {
    const checkbox = checkboxRef.current;
    if (!checkbox) return;

    const next = !checkbox.checked;
    checkbox.checked = next;
    setChecked(next);

    const submitBtn = document.getElementById(
      "saveEmailSubmit",
    ) as HTMLButtonElement | null;
    submitBtn?.click();
  }

  return (
    <div className="flex items-center">
      {/* This is what the server action reads from FormData. */}
      <input
        ref={checkboxRef}
        id="receivePrCreatedEmail"
        name="receivePrCreatedEmail"
        type="checkbox"
        value="on"
        defaultChecked={defaultChecked}
        className="hidden"
      />

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={toggleAndSubmit}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleAndSubmit();
          }
        }}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/30",
          checked ? "bg-accent border-accent" : "bg-surface border-border-bright",
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-sm ring-1 ring-black/5 transition duration-150",
            checked ? "translate-x-5" : "translate-x-0",
          )}
        />
      </button>
    </div>
  );
}

