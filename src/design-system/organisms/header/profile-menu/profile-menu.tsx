"use client";

import {
  Award,
  Card as CardIcon,
  Crown1,
  Devices,
  Key,
  Location,
  LogoutCurve,
  Moon,
  Monitor,
  ReceiptText,
  Sun1,
  type Icon,
} from "iconsax-react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useId, useRef, useState } from "react";
import { Avatar } from "@/design-system/atoms/avatar";
import { Segmented } from "@/design-system/molecules/segmented";
import { Card } from "@/design-system/atoms/card";
import { isWide, SheetDialog } from "@/design-system/molecules/bottom-sheet";
import { localeCookie, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { cn } from "@/lib/cn";
import { endDemoSession } from "@/lib/session";
import { readThemePref, setThemePref, type ThemePref } from "@/lib/theme";
import { useDismiss } from "@/lib/use-dismiss";

type Labels = Dictionary["profileMenu"];

/** Grouped by what the student came to do. Profile itself is the identity row at the top. */
const groups = (l: Labels): { title: string; items: { label: string; href: string; Icon: Icon }[] }[] => [
  {
    title: l.learning,
    items: [
      { label: l.subscription, href: "#", Icon: Crown1 },
      { label: l.certificates, href: "#", Icon: Award },
    ],
  },
  {
    title: l.account,
    items: [
      { label: l.password, href: "#", Icon: Key },
      { label: l.devices, href: "#", Icon: Devices },
      { label: l.addresses, href: "#", Icon: Location },
    ],
  },
  {
    title: l.payments,
    items: [
      { label: l.orders, href: "#", Icon: ReceiptText },
      { label: l.paymentMethods, href: "#", Icon: CardIcon },
    ],
  },
];

/** Language names are written in their own language, so anyone can find theirs. */
const LANGUAGES: { id: Locale; label: string }[] = [
  { id: "bn", label: "বাংলা" },
  { id: "en", label: "English" },
];

/** The account menu: a popover from `lg`, a bottom sheet on phones and tablets (like the inbox). */
export function ProfileMenu({
  user,
  lang,
  labels,
  triggerLabel,
  title,
  closeLabel,
  shortcut,
  preferences = true,
}: {
  user: { name: string; avatarUrl: string | null; batch: string };
  lang: Locale;
  labels: Labels;
  triggerLabel: string;
  /** The sheet's heading on phones. */
  title: string;
  closeLabel: string;
  /** A link under the identity row, for a header with no room for its own button (the landing on phones). */
  shortcut?: { label: string; href: string; className?: string };
  /** Theme and language. Off on the landing, which has no dark pass and is Bangla only. */
  preferences?: boolean;
}) {
  const [mode, setMode] = useState<"popover" | "sheet" | null>(null);
  const open = mode !== null;
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const close = useCallback(() => setMode(null), []);
  useDismiss(mode === "popover", close, root, trigger);

  const panel = (
    <>
      <a href="#" onClick={close} className="group/me flex items-center gap-3 p-4 transition-colors hover:bg-raised">
        <Avatar src={user.avatarUrl} name={user.name} size={44} />
        <span className="grid min-w-0 flex-1">
          <span className="truncate font-semibold">{user.name}</span>
          <span className="truncate text-xs text-subtle">{user.batch}</span>
          <span className="mt-0.5 inline-flex items-center gap-0.5 text-xs font-semibold text-brand-text">
            {labels.viewProfile}
            <ChevronRight className="size-3.5 transition-transform group-hover/me:translate-x-0.5" aria-hidden />
          </span>
        </span>
      </a>

      {shortcut && (
        <div className={cn("border-t border-border py-2", shortcut.className)}>
          <a
            href={shortcut.href}
            onClick={close}
            className="mx-2 flex h-10 items-center justify-between rounded-md px-2 text-sm font-semibold text-brand-text transition-colors hover:bg-raised"
          >
            {shortcut.label}
            <ChevronRight className="size-4" aria-hidden />
          </a>
        </div>
      )}

      <nav aria-label={labels.label} className="grid gap-1 border-t border-border py-2">
        {groups(labels).map((g) => (
          <div key={g.title}>
            <p className="px-4 pt-2 pb-1 text-xs font-semibold text-subtle">{g.title}</p>
            <ul>
              {g.items.map(({ label, href, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    onClick={close}
                    className="mx-2 flex h-10 items-center gap-3 rounded-md px-2 text-sm text-text transition-colors hover:bg-raised"
                  >
                    <Icon size={20} color="currentColor" variant="Linear" className="shrink-0 text-muted" aria-hidden />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {preferences && <Preferences lang={lang} labels={labels} />}

      <div className="flex items-center gap-3 border-t border-border px-4 py-3 text-xs">
        <a href="#" className="text-subtle hover:text-text">
          {labels.beta}
        </a>
        <span aria-hidden className="text-subtle">
          ·
        </span>
        <a href="#" className="text-subtle hover:text-text">
          {labels.terms}
        </a>
        <button
          type="button"
          onClick={() => {
            endDemoSession();
            // A full load on purpose: a client navigation would keep the signed-in pages alive
            // in memory (cacheComponents), so Back could show them again after logging out.
            window.location.replace(`/${lang}/login`);
          }}
          className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-sm font-semibold text-danger transition-colors hover:bg-danger-soft"
        >
          <LogoutCurve size={18} color="currentColor" variant="Linear" aria-hidden />
          {labels.logout}
        </button>
      </div>
    </>
  );

  return (
    <div ref={root} className="relative shrink-0">
      <button
        ref={trigger}
        type="button"
        aria-label={triggerLabel}
        aria-expanded={open}
        aria-controls={mode === "popover" ? panelId : undefined}
        onClick={() => setMode((m) => (m ? null : isWide() ? "popover" : "sheet"))}
        className={cn(
          "flex h-10 items-center gap-2 rounded-full py-1 pr-2 pl-1 transition-colors",
          open ? "bg-raised" : "hover:bg-raised",
        )}
      >
        <Avatar src={user.avatarUrl} name={user.name} size={32} />
        <span className="hidden max-w-36 truncate text-sm font-medium 2xl:inline">{user.name}</span>
        <ChevronDown className={cn("hidden size-4 text-subtle transition-transform sm:block", open && "rotate-180")} aria-hidden />
      </button>

      {/* Rendered only when open: it reads browser-only state (theme), so it never hydrates. */}
      {mode === "popover" && (
        <Card as="div" elevation="pop" id={panelId} className="absolute top-full right-0 mt-2 max-h-[calc(100dvh-5rem)] w-[min(340px,calc(100vw-2rem))] overflow-y-auto">
          {panel}
        </Card>
      )}

      <SheetDialog open={mode === "sheet"} onClose={close} title={title} closeLabel={closeLabel} closeOn="a" flush>
        {mode === "sheet" && panel}
      </SheetDialog>
    </div>
  );
}

function Preferences({ lang, labels }: { lang: Locale; labels: Labels }) {
  const router = useRouter();
  const [theme, setTheme] = useState<ThemePref>(readThemePref);

  const switchLanguage = (next: string) => {
    if (next === lang) return;
    document.cookie = `${localeCookie}=${next}; path=/; max-age=31536000; samesite=lax`;
    const { pathname, search, hash } = window.location;
    router.push(pathname.replace(/^\/(bn|en)(?=\/|$)/, `/${next}`) + search + hash);
  };

  return (
    <div className="grid gap-3 border-t border-border px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted">{labels.theme}</span>
        <Segmented
          role="radio"
          track="solid"
          label={labels.theme}
          value={theme}
          onChange={(id) => {
            setTheme(id as ThemePref);
            setThemePref(id as ThemePref);
          }}
          items={[
            { id: "light", label: labels.light, icon: <Sun1 size={16} color="currentColor" aria-hidden /> },
            { id: "dark", label: labels.dark, icon: <Moon size={16} color="currentColor" aria-hidden /> },
            { id: "system", label: labels.system, icon: <Monitor size={16} color="currentColor" aria-hidden /> },
          ]}
        />
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted">{labels.language}</span>
        <Segmented role="radio" track="solid" label={labels.language} value={lang} onChange={switchLanguage} items={LANGUAGES} />
      </div>
    </div>
  );
}
