import "server-only";
import katex from "katex";

const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Question text with inline LaTeX between `$…$` → safe HTML. Plain text is escaped; maths
 * is typeset by KaTeX here on the server (HTML for sight, MathML for screen readers), so
 * no maths code reaches the browser. A formula KaTeX can't parse shows as its source.
 */
export function richText(source: string): string {
  return source
    .split(/(\$[^$]+\$)/g)
    .map((part) =>
      part.length > 2 && part.startsWith("$") && part.endsWith("$")
        ? katex.renderToString(part.slice(1, -1), { throwOnError: false, output: "htmlAndMathml", strict: "ignore" })
        : escape(part),
    )
    .join("");
}
