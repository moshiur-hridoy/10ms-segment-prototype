import clsx from "clsx";

/** Numbered chapter label, after cofounder.co's "1.0 — LAUNCH": the page reads as a path. */
export function Chapter({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 text-sm font-medium text-subtle">
      <span className="font-mono text-xs text-brand-text">{n}</span>
      <span aria-hidden className="h-px w-5 bg-border-strong" />
      <span>{children}</span>
    </p>
  );
}

/** Marks content that is a placeholder until a team confirms it (content/site.ts → PENDING). */
export function Sample({ children = "নমুনা", className }: { children?: React.ReactNode; className?: string }) {
  return (
    <span
      title="নমুনা: টিম থেকে আসল তথ্য আসবে"
      className={clsx(
        "inline-flex items-center rounded-sm border border-dashed border-warning/60 bg-warning-soft px-1.5 py-px text-xs leading-4 font-medium text-warning",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Arrow({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={clsx("size-4", className)} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

export function Check({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={clsx("size-4", className)} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 8.5l3 3 6-7" />
    </svg>
  );
}

export function Phone({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={clsx("size-4", className)} fill="currentColor">
      <path d="M4.2 1.5c.4-.1.8.1 1 .5l1.1 2.4c.2.4.1.8-.2 1.1l-.9.8c.6 1.3 1.6 2.4 2.9 3l.8-.9c.3-.3.7-.4 1.1-.2l2.4 1.1c.4.2.6.6.5 1l-.4 1.7c-.1.5-.5.8-1 .8C6.3 13.6 2.4 9.7 2.2 4.6c0-.5.3-.9.8-1z" />
    </svg>
  );
}
