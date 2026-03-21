import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import CookieConsentGate from "@/components/cookie-consent-gate";
import Navbar from "@/components/navbar";
import AuthSessionProvider from "@/components/session-provider";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = (
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.APP_URL ??
  process.env.NEXTAUTH_URL ??
  "http://localhost:3000"
).replace(/\/$/, "");

const title = "feedback2code";
const description = "Turn user feedback into code changes — automatically";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  openGraph: {
    title,
    description,
    url: "/",
    siteName: title,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistMono.variable} h-full antialiased dark`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Navbar />
        <AuthSessionProvider>{children}</AuthSessionProvider>
        <CookieConsentGate gaMeasurementId={gaMeasurementId} />
      </body>
    </html>
  );
}
