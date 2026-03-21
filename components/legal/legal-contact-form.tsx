"use client";

import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Textarea from "@/components/ui/textarea";
import { useState, type FormEvent } from "react";

type Status = "idle" | "submitting" | "success" | "error";

export default function LegalContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);
    setStatus("submitting");

    const form = e.currentTarget;
    const fd = new FormData(form);
    const email = String(fd.get("email") ?? "");
    const message = String(fd.get("message") ?? "");
    const website = String(fd.get("website") ?? "");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, message, website }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !data?.ok) {
        setErrorMessage(data?.message ?? "Something went wrong.");
        setStatus("error");
        return;
      }
      form.reset();
      setStatus("success");
    } catch {
      setErrorMessage("Network error. Please try again.");
      setStatus("error");
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Send a message</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          We read every submission and reply to the address you provide.
        </p>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
          <label htmlFor="legal-contact-website">Website</label>
          <input
            id="legal-contact-website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="legal-contact-email" className="text-xs uppercase tracking-widest text-muted-foreground">
            Email <span className="text-accent">*</span>
          </label>
          <Input
            id="legal-contact-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            disabled={status === "submitting"}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="legal-contact-message" className="text-xs uppercase tracking-widest text-muted-foreground">
            Message <span className="text-accent">*</span>
          </label>
          <Textarea
            id="legal-contact-message"
            name="message"
            required
            rows={5}
            maxLength={3500}
            disabled={status === "submitting"}
            placeholder="How can we help?"
          />
        </div>

        {errorMessage ? (
          <p className="text-sm text-red-400" role="alert">
            {errorMessage}
          </p>
        ) : null}
        {status === "success" ? (
          <p className="text-sm text-accent" role="status">
            Thanks — your message was sent.
          </p>
        ) : null}

        <Button type="submit" disabled={status === "submitting"}>
          {status === "submitting" ? "Sending…" : "Send message"}
        </Button>
      </form>
    </div>
  );
}
