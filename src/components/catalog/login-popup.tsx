"use client";

import { FileText, Folder, Play, Radio, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { IconButton } from "@/design-system/atoms/icon-button";
import { LoginForm, type LoginCopy } from "@/design-system/organisms/login/login-form";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { hasDemoSession } from "@/lib/session";
import type { LoginFor } from "./login-for";

type Tapped = { kind: LoginFor; title: string; meta: string | null };

/**
 * CT99 (lab `segment-home` v9): a guest logs in without leaving the segment page. Every link to the login page inside
 * it (the routine's free classes, the login card, the locked uploads, the subject books) opens this pop-up instead: a
 * sheet from the bottom on phones, a dialog in the middle from `md`. It holds the login form (number, then code). Once
 * signed in, the visitor is a new student with no courses and goes where the link's `next` pointed (a paper's page),
 * else to this page without the demo's `?as=`, which then draws itself unlocked.
 *
 * The designer's call: each login starts fresh from what was tapped. A link marked with `loginFor` (a class, a note,
 * SuperPrep, a live class) shows that thing at the pop-up's top with a title for the action; its `next` is the thing
 * itself, so once signed in the student goes straight on to it (the class plays), with no dashboard or onboarding between.
 */
export function LoginPopup({
  lang,
  copy,
  title,
  lead,
  closeLabel,
  titleFor,
  leadFor,
  off = false,
  children,
}: {
  lang: Locale;
  copy: LoginCopy;
  title: string;
  lead: string;
  closeLabel: string;
  /** The title for each kind of tapped thing, and the line under it. */
  titleFor?: Record<LoginFor, string>;
  leadFor?: string;
  /** Signed in already: the page as it is, no pop-up. */
  off?: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [next, setNext] = useState<string | null>(null);
  const [tapped, setTapped] = useState<Tapped | null>(null);
  // A new form each time it opens, so a half-typed number from last time doesn't linger.
  const [round, setRound] = useState(0);

  // One listener for the whole page: a click on any link to the login page opens the pop-up instead.
  function intercept(e: MouseEvent<HTMLDivElement>) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element).closest("a[href]");
    if (!a) return;
    const url = new URL(a.getAttribute("href")!, window.location.href);
    if (url.origin !== window.location.origin || !/^\/[a-z]{2}\/login\/?$/.test(url.pathname)) return;
    e.preventDefault();
    setNext(url.searchParams.get("next"));
    const { loginFor, loginTitle, loginMeta } = (a as HTMLElement).dataset;
    setTapped(titleFor && loginFor && loginFor in titleFor && loginTitle ? { kind: loginFor as LoginFor, title: loginTitle, meta: loginMeta ?? null } : null);
    setRound((r) => r + 1);
    document.documentElement.style.overflow = "hidden";
    dialog.current?.showModal();
  }
  const close = () => dialog.current?.close();
  useEffect(() => () => void (document.documentElement.style.overflow = ""), []);
  // Back from what the login went on to, the router shows its copy of this page from before the login, still locked:
  // signed in now, it draws itself again.
  useEffect(() => {
    if (!off && hasDemoSession()) router.refresh();
  }, [off, router]);

  function signedIn() {
    close();
    // The demo's guest switch would keep the page locked: the session cookie now says who this is.
    const here = new URL(window.location.href);
    here.searchParams.delete("as");
    const stay = here.pathname + here.search;
    const target = next && next.startsWith("/") && !next.startsWith("//") ? next : stay;
    if (target === stay) router.replace(stay + here.hash, { scroll: false });
    else router.push(target);
    router.refresh();
  }

  const heading = tapped && titleFor ? titleFor[tapped.kind] : title;

  if (off) return children;
  return (
    <>
      <div onClickCapture={intercept} className="contents">
        {children}
      </div>
      <dialog
        ref={dialog}
        aria-label={heading}
        onClose={() => void (document.documentElement.style.overflow = "")}
        // A click on the backdrop lands on the dialog itself.
        onClick={(e) => e.target === e.currentTarget && close()}
        className="mx-auto mt-auto mb-0 max-h-[90dvh] w-full max-w-lg overflow-y-auto overscroll-contain rounded-t-card border-0 bg-surface p-0 text-text shadow-pop backdrop:bg-text/40 md:my-auto md:rounded-card"
      >
        <div className="relative grid gap-2 p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:p-6">
          <IconButton label={closeLabel} onClick={close} className="absolute end-3 top-3 sm:end-4 sm:top-4">
            <X className="size-5" aria-hidden />
          </IconButton>
          {/* What was tapped, in the form's column so its edge lines up with the title; else room for the close button. */}
          {tapped ? (
            <div className="mx-auto w-full max-w-sm pt-6 max-sm:pe-12">
              <TappedRow {...tapped} />
            </div>
          ) : (
            <div aria-hidden className="h-10" />
          )}
          <LoginForm
            key={round}
            copy={copy}
            doneHref={`/${lang}`}
            switchHref={`/${lang}/login`}
            homeHref={`/${lang}/hsc/hsc-28`}
            logoLabel=""
            lang={lang}
            inline={{ title: heading, lead: tapped && leadFor ? leadFor : lead, onSignedIn: signedIn }}
          />
        </div>
      </dialog>
    </>
  );
}

/** What was tapped, as the segment page draws it: the uploads' round tinted marks, SuperPrep's own icon. */
function TappedRow({ kind, title, meta }: Tapped) {
  const round = "grid size-12 shrink-0 place-items-center rounded-full border [&_svg]:size-5";
  return (
    <div className="flex min-w-0 items-center gap-3">
      {kind === "exam" ? (
        <Image src="/assets/superprep-app.svg" alt="" width={48} height={48} className="size-12 shrink-0" />
      ) : (
        <span
          aria-hidden
          className={cn(
            round,
            kind === "video"
              ? "border-danger/25 bg-danger-soft text-danger"
              : kind === "folder"
                ? "border-warning/25 bg-warning-soft text-warning"
                : kind === "note"
                  ? "border-info/25 bg-info-soft text-info"
                  : "border-brand/25 bg-brand-soft text-brand",
          )}
        >
          {kind === "video" ? (
            <Play className="fill-current" />
          ) : kind === "folder" ? (
            <Folder className="fill-current" />
          ) : kind === "note" ? (
            <FileText />
          ) : (
            <Radio />
          )}
        </span>
      )}
      <span className="grid min-w-0 gap-0.5">
        <span className="truncate font-semibold">{title}</span>
        {meta && <span className="truncate text-sm text-muted">{meta}</span>}
      </span>
    </div>
  );
}
