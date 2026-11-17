import { cn } from "@/lib/cn";

/** The SuperPrep wordmark: "Super" in the product gradient, "Prep" in text colour. Always Latin. */
export function SuperPrepMark({ as: Tag = "span", id, className }: { as?: "span" | "h1" | "h2"; id?: string; className?: string }) {
  return (
    <Tag id={id} lang="en" className={cn("font-display tracking-tight", className)}>
      <span className="bg-[linear-gradient(-7deg,#f4a14e_26%,#f59486_44%,#ca2427_61%,#6045ff_89%)] bg-clip-text text-transparent">Super</span>
      <span className="text-text">Prep</span>
    </Tag>
  );
}
