import {
  FAQJsonLd,
  HowToJsonLd,
  JsonLdScript,
  OrganizationJsonLd,
  SoftwareApplicationJsonLd,
} from "next-seo";
import {
  SITE_DESCRIPTION,
  SITE_LONG_DESCRIPTION,
  SITE_NAME,
  absoluteUrl,
  getSiteOrigin,
} from "@/lib/site-config";

const LANDING_FAQ = [
  {
    question: "Does the sandbox have internet access?",
    answer:
      "No. It stays off the public internet, so there is no web browsing or arbitrary outbound access.",
  },
  {
    question: "Which LLM does the agent use?",
    answer:
      "The coding agent runs on OpenCode with MiniMax-M3, an open source model. Model selection will be configurable on higher tiers later.",
  },
  {
    question: "What happens if the agent makes a bad change?",
    answer:
      "Nothing ships without your approval. The agent does not have direct git access to push straight to production. Every change becomes a Pull Request on GitHub that you review and merge (or close). You always have the final say. The agent also follows your custom instructions if you provide them.",
  },
  {
    question: "Which languages and frameworks are supported?",
    answer:
      "If it runs on Linux, it works. The sandbox supports JavaScript, TypeScript, Python, Ruby, Go, Rust, and more. It can install packages, use browsers, and run terminal commands just like a real developer would.",
  },
  {
    question: "Can I customize the widget appearance?",
    answer:
      "The widget auto-detects light and dark mode. It uses a monospace terminal aesthetic that works well with most sites. Custom theming options are coming soon.",
  },
  {
    question: "Can I use this for private repositories?",
    answer:
      "Yes! The GitHub App integration supports both public and private repositories. Just grant access during the installation flow.",
  },
] as const;

/**
 * next-seo v7 (App Router): JSON-LD structured data. Standard meta tags stay in
 * `app/layout.tsx` via the Metadata API — see next-seo README.
 */
export default function HomeNextSeo() {
  const origin = getSiteOrigin();
  const logoUrl = absoluteUrl("/icon.svg");
  const ogImage = absoluteUrl("/opengraph-image");

  return (
    <>
      <JsonLdScript
        scriptKey="website"
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: SITE_NAME,
          url: origin,
          description: SITE_DESCRIPTION,
          inLanguage: "en",
          publisher: {
            "@type": "Organization",
            name: SITE_NAME,
            url: origin,
            logo: { "@type": "ImageObject", url: logoUrl },
          },
        }}
      />

      <OrganizationJsonLd
        scriptKey="organization"
        type="Organization"
        name={SITE_NAME}
        url={origin}
        description={SITE_LONG_DESCRIPTION}
        logo={logoUrl}
      />

      <SoftwareApplicationJsonLd
        scriptKey="software"
        type="WebApplication"
        name={SITE_NAME}
        description={SITE_LONG_DESCRIPTION}
        url={origin}
        image={ogImage}
        applicationCategory="DeveloperApplication"
        operatingSystem="Any"
        featureList={[
          "Feedback automation from website widget to GitHub pull request",
          "Embeddable feedback widget for websites",
          "GitHub App installation for repository access",
          "AI agent runs in an isolated sandbox",
          "Opens Pull Requests for human review, no auto-merge to production",
          "Supports public and private GitHub repositories",
          "Free tier available without a credit card",
        ]}
        offers={{
          "@type": "Offer",
          price: 0,
          priceCurrency: "USD",
          url: origin,
          availability: "https://schema.org/InStock",
        }}
        publisher={{
          "@type": "Organization",
          name: SITE_NAME,
          url: origin,
        }}
      />

      <HowToJsonLd
        scriptKey="howto-feedback-pr"
        name="From feedback to Pull Request"
        description="Set up feedback automation with feedback2code: collect website feedback and receive GitHub Pull Requests from the AI agent."
        totalTime="PT3M"
        step={[
          {
            name: "Embed the widget",
            text: "Add a single script tag to your site. The feedback widget appears for visitors with a terminal-style UI and light/dark awareness.",
          },
          {
            name: "Users leave feedback",
            text: "Visitors describe bugs, UX issues, or improvements. Submissions appear in your dashboard in real time.",
          },
          {
            name: "AI agent opens a PR",
            text: "An AI coding agent clones your repo in a secure sandbox, implements changes, and opens a Pull Request on GitHub for you to review and merge.",
          },
        ]}
      />

      <FAQJsonLd scriptKey="faq" questions={[...LANDING_FAQ]} />
    </>
  );
}
