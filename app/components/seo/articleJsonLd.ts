import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://calstory.app";

/**
 * Build structured-data payloads for a blog post.
 *
 * Returns up to three payloads:
 *   1. BlogPosting    — article-level entity (rich-result eligible).
 *   2. BreadcrumbList — Home › Blog › {title}, helps Google resolve
 *                       the page's position in the site hierarchy.
 *   3. FAQPage        — only when `faqs` is provided AND the page
 *                       actually renders those questions visibly.
 *
 * Using `BlogPosting` (a more specific subtype of `Article`) gives
 * Google a stronger signal that the page is part of the CalStory blog
 * than the generic `Article` type would.
 */
export function articleJsonLd({
  slug,
  title,
  description,
  datePublished,
  dateModified,
  authorName = "CalStory Team",
  imagePath = "/og.svg",
  faqs,
}: {
  slug: string;
  title: string;
  description: string;
  datePublished: string;
  dateModified: string;
  authorName?: string;
  imagePath?: string;
  faqs?: { question: string; answer: string }[];
}) {
  const postUrl = `${SITE_URL}/blog/${slug}`;
  const blogUrl = `${SITE_URL}/blog`;

  const blogPosting = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${postUrl}#article`,
    headline: title,
    description,
    url: postUrl,
    datePublished,
    dateModified,
    inLanguage: "en-US",
    author: {
      "@type": "Person",
      name: authorName,
      url: `${SITE_URL}/about`,
    },
    publisher: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "CalStory",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/favicon.svg`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": postUrl,
    },
    image: {
      "@type": "ImageObject",
      url: `${SITE_URL}${imagePath}`,
      width: 1200,
      height: 630,
    },
    isPartOf: {
      "@type": "Blog",
      "@id": `${blogUrl}#blog`,
      name: "CalStory Blog",
      url: blogUrl,
    },
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Blog", item: blogUrl },
      { "@type": "ListItem", position: 3, name: title, item: postUrl },
    ],
  };

  if (!faqs || faqs.length === 0) {
    return [blogPosting, breadcrumb];
  }

  return [
    blogPosting,
    breadcrumb,
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
