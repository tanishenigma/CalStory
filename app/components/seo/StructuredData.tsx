/**
 * StructuredData — drop JSON-LD `<script>` tags onto the page.
 * Pass one schema object or an array of them. Rendered server-side
 * inside the page tree, no client JS shipped.
 */
type JsonLd = Record<string, unknown>;

export function StructuredData({ data }: { data: JsonLd | JsonLd[] }) {
  const items = Array.isArray(data) ? data : [data];
  return (
    <>
      {items.map((d, i) => (
        <script
          key={i}
          type="application/ld+json"
          // The payload is generated server-side from typed data; safe.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(d) }}
        />
      ))}
    </>
  );
}
