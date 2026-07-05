import type { Metadata } from "next";
import { ContactClient } from "./ContactClient";
import { StructuredData } from "@/app/components/seo/StructuredData";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://calstory.app";

export const metadata: Metadata = {
  // Final tab title: "Contact CalStory | CalStory" (26 chars).
  title: "Contact CalStory",
  description:
    "Get in touch with the CalStory team — feature requests, bug reports, partnership enquiries, or just feedback. Open source and built in public on GitHub.",
  alternates: { canonical: "/contact" },
  keywords: [
    "contact CalStory",
    "CalStory support",
    "CalStory feedback",
    "CalStory feature request",
    "CalStory bug report",
    "CalStory email",
    "calorie tracker support",
    "calorie counter support",
  ],
  robots: { index: true, follow: true },
  openGraph: {
    title: "Contact CalStory",
    description:
      "Get in touch with the CalStory team — feature requests, bug reports, partnership enquiries, or just feedback.",
    url: `${SITE_URL}/contact`,
    type: "website",
    images: [
      {
        url: "/og.png",
        secureUrl: "/og.png",
        width: 1200,
        height: 630,
        alt: "Contact CalStory",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact CalStory",
    description:
      "Get in touch with the CalStory team — feature requests, bug reports, partnership enquiries, or just feedback.",
    images: {
      url: "/og.png",
      alt: "Contact CalStory",
    },
  },
};

/* ContactPage schema — gives Google a precise entity for the
 * route. We expose two contactPoint channels (support email +
 * GitHub) because that's how CalStory is actually built — open
 * source, no support desk. */
const contactJsonLd = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: "Contact CalStory",
  url: `${SITE_URL}/contact`,
  description:
    "Contact CalStory — open source calorie, macro and workout tracker built by lifters.",
  inLanguage: "en-US",
  isPartOf: {
    "@type": "WebSite",
    name: "CalStory",
    url: SITE_URL,
  },
  about: { "@type": "Organization", name: "CalStory", url: SITE_URL },
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "support@calstory.app",
      availableLanguage: ["English"],
      url: `${SITE_URL}/contact`,
    },
    {
      "@type": "ContactPoint",
      contactType: "technical support",
      url: "https://github.com/tanishenigma/CalStory/issues",
      availableLanguage: ["English"],
    },
  ],
};

export default function ContactPage() {
  return (
    <>
      <StructuredData data={contactJsonLd} />
      <ContactClient />
    </>
  );
}
