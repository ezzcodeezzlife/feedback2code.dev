import type { MetadataRoute } from "next";

const DEFAULT_SITE_URL = "https://feedback2code.dev";

function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_URL ??
    process.env.NEXTAUTH_URL ??
    DEFAULT_SITE_URL;

  try {
    const url = new URL(raw);

    if (url.hostname === "www.feedback2code.dev") {
      url.hostname = "feedback2code.dev";
    }

    url.pathname = "";
    url.search = "";
    url.hash = "";

    return url.toString().replace(/\/$/, "");
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    host: siteUrl,
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
