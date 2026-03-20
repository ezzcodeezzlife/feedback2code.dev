"use client";

import { useEffect } from "react";

export function SubmitEmailOnToggle() {
  useEffect(() => {
    const checkbox = document.getElementById(
      "receivePrCreatedEmail",
    ) as HTMLInputElement | null;
    const submitBtn = document.getElementById(
      "saveEmailSubmit",
    ) as HTMLButtonElement | null;

    if (!checkbox || !submitBtn) return;

    const onChange = () => {
      // Trigger the hidden submit button so the server action can detect
      // `saveSection=email` and show the correct toast.
      submitBtn.click();
    };

    checkbox.addEventListener("change", onChange);
    return () => checkbox.removeEventListener("change", onChange);
  }, []);

  return null;
}

