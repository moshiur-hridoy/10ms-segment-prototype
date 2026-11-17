"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { IconButton } from "@/design-system/atoms/icon-button";
import { LoginForm, type LoginCopy } from "@/design-system/organisms/login/login-form";
import type { Locale } from "@/i18n/config";

/**
 * CT99 (lab `segment-home` v9): a guest logs in without leaving the segment page. Every link to the login page inside
 * it (the routine's free classes, the login card, the locked uploads, the subject books) opens this pop-up instead: a
 * sheet from the bottom on phones, a dialog in the middle from `md`. It holds the login form (number, then code). Once
 * signed in, the visitor is a new student with no courses and goes where the link's `next` pointed (a paper's page),
 * else to this page without the demo's `?as=`, which then draws itself unlocked.
 */
export function LoginPopup({
  lang,
  copy,
  title,
  lead,
  closeLabel,
  off = false,
  children,
}: {
  lang: Locale;
  copy: LoginCopy;
  title: string;
  lead: string;
  closeLabel: string;
  /** Signed in already: the page as it is, no pop-up. */
  off?: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [next, setNext] = useState<string | null>(null);
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
    setRound((r) => r + 1);
    document.documentElement.style.overflow = "hidden";
    dialog.current?.showModal();
  }
  const close = () => dialog.current?.close();
  useEffect(() => () => void (document.documentElement.style.overflow = ""), []);

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

  if (off) return children;
  return (
    <>
      <div onClickCapture={intercept} className="contents">
        {children}
      </div>
      <dialog
        ref={dialog}
        aria-label={title}
        onClose={() => void (document.documentElement.style.overflow = "")}
        // A click on the backdrop lands on the dialog itself.
        onClick={(e) => e.target === e.currentTarget && close()}
        className="mx-auto mt-auto mb-0 max-h-[90dvh] w-full max-w-lg overflow-y-auto overscroll-contain rounded-t-lg border-0 bg-surface p-0 text-text shadow-pop backdrop:bg-text/40 md:my-auto md:rounded-lg"
      >
        <div className="grid gap-2 p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:p-6">
          <IconButton label={closeLabel} onClick={close} className="justify-self-end">
            <X className="size-5" aria-hidden />
          </IconButton>
          <LoginForm
            key={round}
            copy={copy}
            doneHref={`/${lang}`}
            switchHref={`/${lang}/login`}
            homeHref={`/${lang}/hsc/hsc-28`}
            logoLabel=""
            lang={lang}
            inline={{ title, lead, onSignedIn: signedIn }}
          />
        </div>
      </dialog>
    </>
  );
}
