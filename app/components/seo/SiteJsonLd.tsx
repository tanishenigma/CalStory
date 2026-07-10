/**
 * SiteJsonLd — site-wide JSON-LD rendered into the root <head> via
 * the root layout. Three payloads:
 *
 *   1. Organization   — establishes the brand entity Google attaches
 *                        to every CalStory page (Knowledge Graph seed).
 *   2. WebSite        — top-level entity with `SearchAction`, which is
 *                        the official mechanism Google uses to render
 *                        a sitelinks search box under the main result.
 *   3. WebPage        — generic page entity on every route, helps
 *                        Google resolve canonical URLs.
 *
 * Server-rendered, zero client JS shipped. `SITE_URL` falls back to
 * `https://calstory.app` when the `NEXT_PUBLIC_SITE_URL` env is
 * unset so the JSON-LD is always well-formed.
 */

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://calstory.app";

const siteJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: "CalStory",
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/favicon.svg`,
      width: 512,
      height: 512,
    },
    description:
      "CalStory is a free calorie, macro, and workout tracker with an AI food logger — built for lifters who care about real progress.",
    sameAs: [
      "https://github.com/tanishenigma/CalStory",
      "https://twitter.com/calstoryapp",
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: "CalStory",
    url: SITE_URL,
    description:
      "Free calorie tracker, macro tracker, and workout tracker with an AI food logger.",
    inLanguage: "en-US",
    publisher: { "@id": `${SITE_URL}/#organization` },
    /* Sitelinks Search Box — `potentialAction` is the documented way
     * to ask Google to render an inline search box beneath the main
     * search result. `target` uses a query-string template, so the
     * value of `query-input` (the user's query) gets appended. */
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/blog?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  },
];

export function SiteJsonLd() {
  return (
    <>
      {siteJsonLd.map((d, i) => (
        <script
          key={i}
          type="application/ld+json"
          // ship-safe-ignore: XSS_DANGEROUS_HTML — JSON-LD is developer-controlled static data
          dangerouslySetInnerHTML={{ __html: JSON.stringify(d) }}
        />
      ))}
    </>
  );
}
