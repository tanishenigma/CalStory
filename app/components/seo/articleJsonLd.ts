import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://calstory.app";

/**
 * Build an Article schema payload for a blog post.
 * Pass an array of frequently-asked-questions to also emit an inline
 * FAQPage schema (Google will pick this up for rich results when paired
 * with a visible FAQ block).
 */
export function articleJsonLd({
  slug,
  title,
  description,
  datePublished,
  dateModified,
  authorName = "CalStory Team",
  faqs,
}: {
  slug: string;
  title: string;
  description: string;
  datePublished: string;
  dateModified: string;
  authorName?: string;
  faqs?: { question: string; answer: string }[];
}) {
  const base = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url: `${SITE_URL}/blog/${slug}`,
    datePublished,
    dateModified,
    author: {
      "@type": "Person",
      name: authorName,
      url: `${SITE_URL}/about`,
    },
    publisher: {
      "@type": "Organization",
      name: "CalStory",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/favicon.svg`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/blog/${slug}`,
    },
  };

  if (!faqs || faqs.length === 0) return [base];

  return [
    base,
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    },
  ];
}

// Re-export for sitemap typing convenience
export type _SitemapType = MetadataRoute.Sitemap;
