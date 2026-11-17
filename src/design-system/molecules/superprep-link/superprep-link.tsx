import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { SuperPrepMark } from "@/design-system/atoms/superprep-mark";
import { cn } from "@/lib/cn";

/**
 * SuperPrep's card-sized way in, the same wherever it appears (course home, a paper's page). It
 * wears the dashboard SuperPrep card's dress, so the product looks one way everywhere: the
 * wordmark, the "Super" gradient as a 1px edge and its soft corner glows (`--bg-superprep-card`),
 * then one line on what it opens.
 */
export function SuperPrepLink({ href, hint, className }: { href: string; hint: string; className?: string }) {
  return (
    <Link
      href={href}
      className={cn("group/side grid gap-1 rounded-lg border border-transparent p-4 press lift hover:shadow-raised", className)}
      style={{ background: "var(--bg-superprep-card)" }}
    >
      <span className="flex items-center justify-between gap-2">
        <SuperPrepMark className="text-xl leading-7" />
        <ChevronRight className="size-5 text-subtle transition-transform group-hover/side:translate-x-0.5" aria-hidden />
      </span>
      <span className="text-sm text-muted">{hint}</span>
    </Link>
  );
}
