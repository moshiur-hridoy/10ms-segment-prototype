/** Server-typeset text (see `richText`). The HTML is built from escaped text and KaTeX output only. */
export function Rich({ html, as: Tag = "span", className, id }: { html: string; as?: "span" | "div" | "h2" | "p"; className?: string; id?: string }) {
  return <Tag id={id} className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
