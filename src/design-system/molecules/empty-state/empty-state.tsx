import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Nothing to show yet: an icon, one line, and optionally a way forward. */
export function EmptyState({
  icon: Icon,
  title,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid justify-items-center gap-3 rounded-md border border-dashed border-border-strong px-4 py-8 text-center", className)}>
      <span className="grid size-12 place-items-center rounded-full bg-raised text-subtle">
        <Icon className="size-6" aria-hidden />
      </span>
      <p className="text-sm text-muted">{title}</p>
      {action}
    </div>
  );
}
