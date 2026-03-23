import type { Metadata } from "next";
import { authOptions } from "@/auth";
import LandingView from "@/components/home/landing-view";
import HomeNextSeo from "@/components/seo/home-next-seo";
import {
  SITE_DESCRIPTION,
  SITE_LONG_DESCRIPTION,
  SITE_NAME,
  SITE_PAGE_TITLE,
  absoluteUrl,
} from "@/lib/site-config";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: SITE_PAGE_TITLE,
  description: SITE_LONG_DESCRIPTION,
  keywords: [
    "feedback",
    "user feedback",
    "AI coding agent",
    "GitHub",
    "Pull Request",
    "automation",
    "developer tools",
    "feedback widget",
    "code changes",
    "MiniMax",
    "sandbox",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: SITE_PAGE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
    siteName: SITE_NAME,
    type: "website",
    locale: "en_US",
    images: [
      {
        url: absoluteUrl("/opengraph-image"),
        width: 1200,
        height: 630,
        alt: SITE_PAGE_TITLE,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_PAGE_TITLE,
    description: SITE_DESCRIPTION,
    images: [absoluteUrl("/twitter-image")],
  },
  robots: { index: true, follow: true },
};

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session?.user?.email) {
    redirect("/dashboard");
  }

  return (
    <>
      <HomeNextSeo />
      <LandingView />
    </>
  );
}
