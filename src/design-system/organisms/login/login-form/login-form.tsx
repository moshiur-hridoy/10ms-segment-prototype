"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Smartphone } from "lucide-react";
import { useEffect, useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent } from "react";
import { Button } from "@/design-system/atoms/button";
import { Logo } from "@/design-system/atoms/logo";
import { cn } from "@/lib/cn";
import type { Locale } from "@/i18n/config";
import { formatPhone, latinDigits, localDigits, parsePhone } from "@/lib/phone";
import { safeNext, startDemoSession, type DemoStudent } from "@/lib/session";

/*
 * Sign in with a mobile number and a 6-digit code, in two steps inside one card-less column.
 * There is no backend yet: "sending" and "checking" wait a moment and then succeed, any code is
 * accepted except 000000 (so the wrong-code state can be shown). Success starts the demo session
 * (lib/session.ts) and goes back to the page the proxy sent the student from (`?next=`), else to
 * `doneHref`. "Continue as demo" fills in a number and a code and runs both steps on its own.
 * The messages are `role="alert"` / `role="status"` so a screen reader hears each change.
 * The phone number and the code are always in Latin digits, in Bangla too, since that is how
 * students read numbers off a phone and an SMS; the rest of the copy keeps the page's digits.
 */

export type LoginCopy = {
  title: string;
  subtitle: string;
  phoneLabel: string;
  phonePlaceholder: string;
  phoneError: string;
  sendCode: string;
  sending: string;
  terms: string;
  otpTitle: string;
  otpSent: string;
  otpDigit: string;
  otpGroup: string;
  otpError: string;
  verify: string;
  verifying: string;
  resendIn: string;
  resend: string;
  resent: string;
  changeNumber: string;
  demoHint: string;
  demoSignIn: string;
  demoFreeSignIn: string;
  switchLang: string;
};

const CODE_LENGTH = 6;
const RESEND_SECONDS = 30;
const PAUSE_MS = 700;
const DEMO_PHONE = "01712345678";
const DEMO_CODE = "123456";

/** Has this browser finished onboarding (stamped the card, OB10)? Its answers are kept in localStorage (OB5). */
function onboarded() {
  try {
    return Boolean((JSON.parse(localStorage.getItem("10ms-onboarding") ?? "null") as { stamped?: boolean } | null)?.stamped);
  } catch {
    return false;
  }
}

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, k) => values[k] ?? "");

export function LoginForm({
  copy,
  doneHref,
  switchHref,
  homeHref,
  logoLabel,
  lang,
  inline,
}: {
  copy: LoginCopy;
  /** Where a successful sign-in goes. */
  doneHref: string;
  /** The same page in the other language. */
  switchHref: string;
  /** The logo's link: the public home page. */
  homeHref: string;
  logoLabel: string;
  lang: Locale;
  /**
   * CT99 (lab `segment-home` v9): the form inside a pop-up on the page itself. No logo or language row, the page's own
   * title and lead in place of the login page's, one demo (a new student, with no courses), and the success handed back
   * to the page instead of a navigation.
   */
  inline?: { title: string; lead: string; onSignedIn: () => void };
}) {
  const router = useRouter();
  const numerals = (n: number | string) => localDigits(n, lang);
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [phoneBad, setPhoneBad] = useState(false);
  const [number, setNumber] = useState<string | null>(null);
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [codeBad, setCodeBad] = useState(false);
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);
  const [resent, setResent] = useState(false);
  const boxes = useRef<(HTMLInputElement | null)[]>([]);
  const phoneInput = useRef<HTMLInputElement>(null);

  // With cacheComponents, Next keeps a visited page alive but hidden (React <Activity>) and shows
  // it again on a later visit, state and all: after signing in, the form would come back stuck on
  // "checking…". Effects are cleaned up when the page is hidden, so start over there.
  useEffect(
    () => () => {
      setStep("phone");
      setPhone("");
      setPhoneBad(false);
      setNumber(null);
      setDigits(Array(CODE_LENGTH).fill(""));
      setCodeBad(false);
      setBusy(false);
      setWait(0);
      setResent(false);
    },
    [],
  );

  // The resend countdown.
  useEffect(() => {
    if (wait <= 0) return;
    const id = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(id);
  }, [wait]);

  // Focus follows the step.
  useEffect(() => {
    if (step === "code") boxes.current[0]?.focus();
    else phoneInput.current?.focus();
  }, [step]);

  const pause = () => new Promise<void>((resolve) => setTimeout(resolve, PAUSE_MS));

  async function sendCode(e: FormEvent) {
    e.preventDefault();
    const n = parsePhone(phone);
    if (!n) {
      setPhoneBad(true);
      phoneInput.current?.focus();
      return;
    }
    setBusy(true);
    await pause();
    setBusy(false);
    setNumber(n);
    setDigits(Array(CODE_LENGTH).fill(""));
    setCodeBad(false);
    setWait(RESEND_SECONDS);
    setStep("code");
  }

  async function verify(code: string, student: DemoStudent = inline ? "free" : "full") {
    setBusy(true);
    await pause();
    if (code === "000000") {
      setBusy(false);
      setCodeBad(true);
      setDigits(Array(CODE_LENGTH).fill(""));
      boxes.current[0]?.focus();
      return;
    }
    startDemoSession(student);
    if (inline) {
      inline.onSignedIn();
      return;
    }
    // Read at the moment of success, not through useSearchParams, so the page needs no Suspense.
    const next = safeNext(new URLSearchParams(window.location.search).get("next"));
    // OB15: the free student (LG19) answers onboarding's questions first, unless this browser already stamped a card;
    // onboarding then goes on to their batch's page, or back to `next`.
    if (student === "free" && !onboarded()) {
      router.replace(`/${lang}/onboarding?lab=onboarding${next ? `&next=${encodeURIComponent(next)}` : ""}`);
      return;
    }
    router.replace(next ?? doneHref);
  }

  /** "Continue as demo": the number and the code fill in, then the student is signed in; `free` (LG19) as a student with no courses. */
  async function demoSignIn(student: DemoStudent = inline ? "free" : "full") {
    setPhone(DEMO_PHONE);
    setPhoneBad(false);
    setBusy(true);
    await pause();
    setBusy(false);
    setNumber(DEMO_PHONE);
    setDigits(DEMO_CODE.split(""));
    setCodeBad(false);
    setWait(RESEND_SECONDS);
    setStep("code");
    await verify(DEMO_CODE, student);
  }

  function setDigit(i: number, raw: string) {
    const typed = latinDigits(raw).replace(/\D/g, "");
    if (!typed) return;
    const next = [...digits];
    // A fast typist or an autofill can land several digits in one box: spread them forward.
    typed
      .split("")
      .slice(0, CODE_LENGTH - i)
      .forEach((d, k) => (next[i + k] = d));
    setDigits(next);
    setCodeBad(false);
    const last = Math.min(i + typed.length, CODE_LENGTH - 1);
    boxes.current[last]?.focus();
    if (next.every(Boolean)) void verify(next.join(""));
  }

  function onKey(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      const next = [...digits];
      next[i - 1] = "";
      setDigits(next);
      boxes.current[i - 1]?.focus();
    } else if (e.key === "ArrowLeft" && i > 0) boxes.current[i - 1]?.focus();
    else if (e.key === "ArrowRight" && i < CODE_LENGTH - 1) boxes.current[i + 1]?.focus();
  }

  function onPaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    setDigit(0, e.clipboardData.getData("text"));
  }

  function resend() {
    setWait(RESEND_SECONDS);
    setResent(true);
    setDigits(Array(CODE_LENGTH).fill(""));
    setCodeBad(false);
    boxes.current[0]?.focus();
  }

  function changeNumber() {
    setStep("phone");
    setResent(false);
    setBusy(false);
  }

  const rise = (n: number) => ({ animationDelay: `${n * 70}ms` });

  return (
    <>
      {!inline && (
        <header className="flex items-center justify-between">
          <Link href={homeHref} aria-label={logoLabel} className="text-text">
            <Logo className="h-7 w-auto" />
          </Link>
          <Link
            href={switchHref}
            className="rounded-full px-3 py-1.5 text-sm font-semibold text-muted transition-colors hover:bg-raised hover:text-text"
          >
            {copy.switchLang}
          </Link>
        </header>
      )}

      <div className={cn("mx-auto flex w-full max-w-sm flex-1 flex-col justify-center", inline ? "py-2" : "py-10")}>
        {step === "phone" ? (
          <form key="phone" onSubmit={sendCode} noValidate className="grid gap-6">
            <div className="grid gap-2 motion-safe:animate-rise" style={rise(0)}>
              {inline ? <h2 className="type-headline">{inline.title}</h2> : <h1 className="type-display">{copy.title}</h1>}
              <p className="text-base text-muted">{inline ? inline.lead : copy.subtitle}</p>
            </div>

            <div className="grid gap-2 motion-safe:animate-rise" style={rise(1)}>
              <label htmlFor="login-phone" className="text-sm font-semibold">
                {copy.phoneLabel}
              </label>
              <div
                className={cn(
                  "flex h-12 items-center gap-2 rounded-md border bg-surface pl-3.5 shadow-card transition-[border-color,box-shadow] focus-within:ring-3",
                  phoneBad
                    ? "border-danger focus-within:ring-danger/20 motion-safe:animate-shake"
                    : "border-border-strong hover:border-subtle focus-within:border-brand focus-within:ring-brand/20",
                )}
              >
                <Smartphone className="size-4 shrink-0 text-subtle" aria-hidden />
                <span className="shrink-0 border-r border-border pr-2.5 text-base font-semibold text-muted">+880</span>
                <input
                  ref={phoneInput}
                  id="login-phone"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  value={phone}
                  placeholder={copy.phonePlaceholder}
                  aria-invalid={phoneBad}
                  aria-describedby={phoneBad ? "login-phone-error" : undefined}
                  onChange={(e) => {
                    // Bangla digits from the keyboard turn into Latin ones as they are typed.
                    setPhone(latinDigits(e.target.value));
                    setPhoneBad(false);
                  }}
                  className="h-full min-w-0 flex-1 bg-transparent pr-3.5 text-base text-text outline-none placeholder:text-subtle"
                />
              </div>
              {phoneBad && (
                <p id="login-phone-error" role="alert" className="text-sm text-danger">
                  {copy.phoneError}
                </p>
              )}
            </div>

            <div className="grid gap-3 motion-safe:animate-rise" style={rise(2)}>
              <Button type="submit" variant="raised" size="lg" disabled={busy} className="w-full">
                {busy ? (
                  <>
                    <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden />
                    {copy.sending}
                  </>
                ) : (
                  copy.sendCode
                )}
              </Button>
              <p className="text-center text-xs text-subtle">{copy.terms}</p>
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => demoSignIn()}
                  disabled={busy}
                  className="rounded-full px-3 py-1 text-sm font-semibold text-brand-text hover:underline disabled:opacity-50"
                >
                  {copy.demoSignIn}
                </button>
                {/* LG19: the same demo, as a free student with no courses. */}
                {!inline && (
                  <button
                    type="button"
                    onClick={() => demoSignIn("free")}
                    disabled={busy}
                    className="rounded-full px-3 py-1 text-sm font-semibold text-brand-text hover:underline disabled:opacity-50"
                  >
                    {copy.demoFreeSignIn}
                  </button>
                )}
              </div>
            </div>
          </form>
        ) : (
          <form
            key="code"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              if (digits.every(Boolean) && !busy) void verify(digits.join(""));
            }}
            className="grid gap-6"
          >
            <div className="grid gap-2 motion-safe:animate-rise" style={rise(0)}>
              <button
                type="button"
                onClick={changeNumber}
                className="-ml-1 flex w-fit items-center gap-1.5 rounded-full px-1 py-0.5 text-sm font-semibold text-brand-text hover:underline"
              >
                <ArrowLeft className="size-4" aria-hidden />
                {copy.changeNumber}
              </button>
              {inline ? <h2 className="type-headline">{copy.otpTitle}</h2> : <h1 className="type-display">{copy.otpTitle}</h1>}
              <p className="text-base text-muted">{fill(copy.otpSent, { phone: formatPhone(number ?? "") })}</p>
            </div>

            <div className="grid gap-3 motion-safe:animate-rise" style={rise(1)}>
              <div role="group" aria-label={copy.otpGroup} className={cn("grid grid-cols-6 gap-2 sm:gap-3", codeBad && "motion-safe:animate-shake")}>
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      boxes.current[i] = el;
                    }}
                    name={`code-${i + 1}`}
                    value={d}
                    type="text"
                    inputMode="numeric"
                    autoComplete={i === 0 ? "one-time-code" : "off"}
                    aria-label={fill(copy.otpDigit, { n: numerals(i + 1) })}
                    aria-invalid={codeBad}
                    disabled={busy}
                    onChange={(e) => setDigit(i, e.target.value)}
                    onKeyDown={(e) => onKey(i, e)}
                    onPaste={onPaste}
                    onFocus={(e) => e.target.select()}
                    className={cn(
                      "h-14 min-w-0 rounded-md border bg-surface text-center type-figure text-text outline-none transition-[border-color,box-shadow] focus:ring-3 disabled:opacity-60",
                      codeBad
                        ? "border-danger focus:ring-danger/20"
                        : d
                          ? "border-brand focus:border-brand focus:ring-brand/20"
                          : "border-border-strong focus:border-brand focus:ring-brand/20",
                    )}
                  />
                ))}
              </div>
              <div className="min-h-5 text-sm" aria-live="polite">
                {codeBad ? (
                  <p role="alert" className="text-danger">
                    {copy.otpError}
                  </p>
                ) : resent && wait > 0 ? (
                  <p role="status" className="text-success">
                    {copy.resent}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-3 motion-safe:animate-rise" style={rise(2)}>
              <Button type="submit" variant="raised" size="lg" disabled={busy || !digits.every(Boolean)} className="w-full">
                {busy ? (
                  <>
                    <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden />
                    {copy.verifying}
                  </>
                ) : (
                  copy.verify
                )}
              </Button>
              {wait > 0 ? (
                <p className="text-center text-sm text-muted">{fill(copy.resendIn, { s: numerals(wait) })}</p>
              ) : (
                <button
                  type="button"
                  onClick={resend}
                  className="mx-auto rounded-full px-3 py-1 text-sm font-semibold text-brand-text hover:underline"
                >
                  {copy.resend}
                </button>
              )}
              <p className="text-center text-xs text-subtle">{copy.demoHint}</p>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
