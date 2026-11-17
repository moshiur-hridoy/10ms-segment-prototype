"use client";

import { CheckCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge, CountBadge } from "@/design-system/atoms/badge";
import { Button } from "@/design-system/atoms/button";
import { cn } from "@/lib/cn";
import type { Locale } from "@/i18n/config";
import { createFormatter, fill } from "@/lib/format";
import { markRead, useReadIds, useUnreadCount } from "@/lib/notice-read";

const number = (lang: Locale) => createFormatter(lang, 0).number;

/** The unread count badge. Follows reads made anywhere on the site. */
export function UnreadBadge({ unreadIds, lang }: { unreadIds: string[]; lang: Locale }) {
  return <CountBadge count={useUnreadCount(unreadIds)} max={99} format={number(lang)} />;
}

/** "১০টি অপঠিত · মোট ১২টি": both numbers, named. */
export function UnreadSummary({ unreadIds, total, template, lang }: { unreadIds: string[]; total: number; template: string; lang: Locale }) {
  const fmt = number(lang);
  return <p className="text-sm text-muted">{fill(template, { unread: fmt(useUnreadCount(unreadIds)), total: fmt(total) })}</p>;
}

/** Marks every notice read. Disabled when nothing is unread. */
export function MarkAllRead({ unreadIds, label, className }: { unreadIds: string[]; label: string; className?: string }) {
  const none = useUnreadCount(unreadIds) === 0;
  return (
    <Button variant="ghost" size="sm" disabled={none} onClick={() => markRead(unreadIds)} className={className}>
      <CheckCheck className="size-4" aria-hidden />
      {label}
    </Button>
  );
}

/**
 * One notice. Tapping it marks it read and, when its text is cut at two lines, opens the full
 * text in place ("আরও দেখো" shows only then). A notice with a real link also shows an "open" link
 * once expanded. Date top right; subject and batch below, in that order.
 */
export function NoticeRow({
  id,
  title,
  body,
  subject,
  batch,
  when,
  tag,
  read: serverRead,
  url,
  labels,
}: {
  id: string;
  title: string;
  body: string;
  subject: string;
  batch: string | null;
  /** "আজ" / "গতকাল" / "২৫ অক্টোবর", built on the server. */
  when: string;
  /** Only for what differs from the usual online batch (offline, recorded). */
  tag: string | null;
  read: boolean;
  url?: string;
  labels: { open: string; more: string; less: string };
}) {
  const [open, setOpen] = useState(false);
  const [cut, setCut] = useState(false);
  const titleRef = useRef<HTMLSpanElement>(null);
  const bodyRef = useRef<HTMLSpanElement>(null);
  const readHere = useReadIds().has(id);
  const read = serverRead || readHere;
  const href = url && url !== "#" ? url : null;
  const expandable = cut || open;

  // Is any of the text cut? Measured while collapsed (open text is never cut) and again on resize.
  useEffect(() => {
    const els = [titleRef.current, bodyRef.current];
    const measure = () => {
      if (open) return;
      setCut(els.some((el) => !!el && el.scrollHeight > el.clientHeight + 1));
    };
    measure();
    const ro = new ResizeObserver(measure);
    els.forEach((el) => el && ro.observe(el));
    return () => ro.disconnect();
  }, [open, title, body]);

  return (
    <li className="min-w-0 py-3 first:pt-0 last:pb-0">
      <button
        type="button"
        aria-expanded={expandable ? open : undefined}
        onClick={() => {
          if (expandable) setOpen((o) => !o);
          if (!read) markRead([id]);
        }}
        className="group grid w-full gap-1 text-left"
      >
        <span className="flex items-start gap-2">
          {!read && <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-live" />}
          <span ref={titleRef} className={cn("min-w-0 flex-1 text-sm group-hover:underline", !open && "line-clamp-2", read ? "font-medium text-subtle" : "font-semibold")}>
            {title}
          </span>
          <span className="mt-0.5 shrink-0 text-xs text-subtle">{when}</span>
        </span>
        <span ref={bodyRef} className={cn("text-sm", !open && "line-clamp-2", read ? "text-subtle" : "text-muted")}>
          {body}
        </span>
        <span className="mt-0.5 flex items-center justify-between gap-3 text-xs">
          <span className="flex min-w-0 items-center gap-2 text-subtle">
            <span className="truncate">
              {subject}
              {batch && ` · ${batch}`}
            </span>
            {tag && <Badge className="shrink-0">{tag}</Badge>}
          </span>
          {expandable && <span className="shrink-0 font-semibold text-brand-text">{open ? labels.less : `… ${labels.more}`}</span>}
        </span>
      </button>
      {open && href && (
        <a href={href} className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-brand-text hover:underline">
          {labels.open}
        </a>
      )}
    </li>
  );
}
