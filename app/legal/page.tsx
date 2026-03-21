import type { Metadata } from "next";
import LegalContent from "@/content/legal.mdx";
import { PageShell } from "@/components/layout/page-shell";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Legal & Contact",
  description: "Legal information and contact details for feedback2code.",
};

export default function LegalPage() {
  return (
    <PageShell className="max-w-2xl">
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground hover:text-accent transition-colors mb-4"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to dashboard
        </Link>
        <div className="flex items-center gap-3">
          <p className="text-xs uppercase tracking-widest text-accent">[ Legal ]</p>
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Legal &amp; contact</h1>
      </div>

      <section className="border border-border bg-surface p-6 sm:p-8">
        <LegalContent />
      </section>
    </PageShell>
  );
}
