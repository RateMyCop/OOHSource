// Renders a JSON-LD structured-data block. Server component — safe to embed in
// any page. The JSON is machine-read by search engines and LLMs.
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
