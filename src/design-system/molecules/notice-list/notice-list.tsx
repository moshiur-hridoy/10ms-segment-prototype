import { NoticeRow } from "@/design-system/molecules/notice-read";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Notice } from "@/lib/api";
import { dayWord } from "@/lib/describe";
import type { Formatter } from "@/lib/format";

/** Ids of the notices the server marks unread; the badges subtract what was read in this browser. */
export const unreadIds = (items: Notice[]) => items.filter((n) => !n.read).map((n) => n.id);

const BATCH_WORDS = /\s*(অনলাইন ব্যাচ|অফলাইন ব্যাচ|Online Batch|Offline Batch)/gi;

/** "HSC 27 অনলাইন ব্যাচ - বায়োলজি" → subject "বায়োলজি", batch "HSC 27". No " - ": the whole name is the subject. */
export function splitCourse(course: string) {
  const i = course.lastIndexOf(" - ");
  if (i < 0) return { subject: course, batch: null };
  return { subject: course.slice(i + 3).trim(), batch: course.slice(0, i).replace(BATCH_WORDS, "").trim() || null };
}

/** The notice rows, shared by the dashboard card, the header inbox and the notices page. */
export function NoticeList({ items, fmt, t }: { items: Notice[]; fmt: Formatter; t: Dictionary }) {
  return (
    <ul className="grid grid-cols-1 divide-y divide-border">
      {items.map((n) => (
        <NoticeRow
          key={n.id}
          id={n.id}
          title={n.title}
          body={n.body}
          {...splitCourse(n.course)}
          when={dayWord(n.publishedAt, fmt, t)}
          tag={n.batchType === "online" ? null : t.batchType[n.batchType]}
          read={n.read}
          url={n.url}
          labels={t.notices}
        />
      ))}
    </ul>
  );
}
