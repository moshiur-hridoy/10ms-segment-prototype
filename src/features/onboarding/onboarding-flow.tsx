"use client";

import { ArrowLeft, Download, Stamp } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/design-system/atoms/button";
import { HoldButton } from "@/design-system/atoms/hold-button";
import { Logo } from "@/design-system/atoms/logo";
import { CARD_TONES, StudentCard } from "@/design-system/organisms/onboarding/student-card";
import { TenTenSays } from "@/design-system/organisms/onboarding/tenten-says";
import { OnboardingTemplate } from "@/design-system/templates/onboarding-template";
import { drawCard, saveCard } from "./card-image";
import { BigChoice, MoodRow, Path, rise, Stairs } from "./pickers";
import { useOnboarding } from "./state";
import {
  AVATARS,
  CLASSES,
  examOf,
  groupsFor,
  stepsFor,
  streamOf,
  toneOf,
  UNITS,
  withClass,
  type Answers,
  type ClassId,
  type Mood,
  type StepId,
  type SubjectsByStream,
} from "./steps";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { cn } from "@/lib/cn";
import { localDigits } from "@/lib/phone";

/*
 * Onboarding (OB1): TenTen asks one question at a time, the student taps an answer, and it lands
 * on their card. A single choice moves on by itself after a beat, so the stamp is seen first;
 * subjects are a multiple choice with a skip. There is no "step 3 of 5": the card filling up is
 * the progress. Nothing is sent anywhere yet (section 9); the answers stay on this device.
 *
 * v2 (OB10–OB12): TenTen answers each answer in its own words (per class, group and subject), and
 * the last step is the student's: they hold a button to stamp the card, it turns over to its back,
 * and they can save it as a picture.
 *
 * v3 (OB14): answers to tap, not text chips. The school classes are a staircase the student's face hops onto, with
 * what each step means (the exam and its year); groups and units are big cards saying what's inside; each subject
 * gets a mood (easy, so-so, hard) instead of "pick the hard ones", hard being the "boss level". A thin path under
 * the header shows how far along they are.
 */

/** OB14: each group's and unit's card. */
const GROUP_EMOJI: Record<string, string> = { science: "🥼", business: "💼", humanities: "🎭", bh: "🎭" };
const UNIT_EMOJI: Record<string, string> = { A: "🔬", B: "📜", C: "📊" };
/** The compulsory subjects, left out of a group card's line of what the group studies. */
const COMPULSORY = new Set(["bangla", "english", "ict"]);
/** The class step waits a little longer, so the face is seen landing on its step. */
const HOP_MS = 700;

type Copy = Dictionary["onboarding"];

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, k) => values[k] ?? "");
/** Long enough to see the answer land on the card before the next question. */
const BEAT_MS = 450;
/** After the stamp lands, the card turns over to its back. */
const TURN_MS = 650;

export function OnboardingFlow({
  copy,
  subjects,
  lang,
  doneHref,
  logoLabel,
}: {
  copy: Copy;
  subjects: SubjectsByStream;
  lang: Locale;
  doneHref: string;
  logoLabel: string;
}) {
  const o = useOnboarding(subjects);
  const { answers: a, step } = o;
  const timer = useRef<number | null>(null);
  useEffect(() => () => void (timer.current && window.clearTimeout(timer.current)), []);
  /** The subject picked last on the subjects step, for TenTen's word on it. */
  const [picked, setPicked] = useState<string | null>(null);
  const [side, setSide] = useState<"front" | "back">("front");
  const [saving, setSaving] = useState(false);

  const classLabel = (c: ClassId) => copy.classes[c];
  const groupLabel = (g: string) => copy.groups[g as keyof Copy["groups"]] ?? g;
  const exam = examOf(a.cls);
  const classLine = a.cls
    ? [classLabel(a.cls), exam && fill(copy.exam, { exam: exam.exam, year: localDigits(exam.year, lang) })].filter(Boolean).join(" · ")
    : null;
  const badge = a.cls === "admission" && a.unit ? copy.units[a.unit] : a.group ? groupLabel(a.group) : null;
  const stream = streamOf(a.group);
  const options = (stream && subjects[stream]) || [];
  const focus = (a.hard ?? []).map((id) => options.find((s) => s.id === id)?.name ?? id);
  const subjectName = (id: string) => options.find((s) => s.id === id)?.name ?? id;
  /** OB14: what a class means, under the staircase and on the two cards beside it. */
  const meaning = (c: ClassId) => {
    const e = examOf(c);
    if (e) return fill(copy.examMeaning, { exam: e.exam, year: localDigits(e.year, lang), full: localDigits(`20${e.year}`, lang) });
    return c === "admission" ? copy.admissionMeaning : c === "english" ? copy.englishMeaning : null;
  };
  const caption = (c: ClassId) => [classLabel(c), meaning(c)].filter(Boolean).join(" · ");
  // OB15 (v4): a class 11 or 12 student with a group goes on to their batch's segment page, arranged for them, with the
  // "তোমার জন্য সাজানো" strip (the lab carries on there).
  const segment =
    (a.cls === "11" || a.cls === "12") && stream && exam
      ? {
          href: `/${lang}/hsc/${a.cls === "12" ? "hsc-27" : "hsc-28"}?stream=${stream}&lab=onboarding`,
          exam: fill(copy.exam, { exam: exam.exam, year: localDigits(exam.year, lang) }),
        }
      : null;
  const name = a.name.trim();
  const done = step === "done";
  const stamped = done && o.stamped;

  /** TenTen's word on the answer given at a step, shown above the next question (OB11). */
  const reactionTo = (prev: StepId | undefined): string | undefined => {
    switch (prev) {
      case "name":
        return name ? fill(copy.afterName, { name }) : undefined;
      case "class":
        return a.cls ? copy.classReactions[a.cls] : undefined;
      case "group":
        return a.group ? copy.groupReactions[a.group as keyof Copy["groupReactions"]] : undefined;
      case "unit":
        return a.unit ? fill(copy.afterUnit, { unit: copy.units[a.unit] }) : undefined;
      case "subjects":
        if (a.hard?.length) return fill(copy.afterSubjects, { count: localDigits(String(a.hard.length), lang) });
        return Object.keys(a.moods).length ? copy.afterNoBoss : copy.afterSkip;
    }
  };
  const reaction = reactionTo(o.steps[o.at - 1]);

  const leaveDone = () => {
    setSide("front");
    if (timer.current) window.clearTimeout(timer.current);
  };

  const onStamp = () => {
    o.stamp();
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setSide("back"), TURN_MS);
  };

  const draw = () =>
    drawCard(
      {
        name,
        avatar: a.avatar,
        classLine,
        badge,
        focus,
        focusLabel: copy.cardFocus,
        student: copy.cardStudent,
        stamp: copy.cardStamp,
        tone: toneOf(a.cls) ? CARD_TONES[toneOf(a.cls)!] : "var(--color-border-strong)",
      },
      document.querySelector<SVGSVGElement>("[data-card-front] svg"),
    );
  // The picture is drawn as soon as the card is stamped, so a tap on "save" can open the phone's
  // share sheet straight away (it only opens right after a tap).
  const picture = useRef<Promise<Blob> | null>(null);
  useEffect(() => {
    picture.current = null;
    if (!stamped) return;
    const t = window.setTimeout(() => {
      picture.current = draw();
      picture.current.catch(() => (picture.current = null));
    }, TURN_MS);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- answers can't change on the last step
  }, [stamped]);

  const onSave = async () => {
    setSaving(true);
    try {
      await saveCard(await (picture.current ?? draw()));
    } finally {
      setSaving(false);
    }
  };

  /** A single choice: show it on the card, then move on. */
  const pick = (next: Answers, wait = BEAT_MS) => {
    o.setAnswers(next);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => o.next(next), wait);
  };

  const card = (
    <StudentCard
      name={name}
      avatar={a.avatar}
      tone={toneOf(a.cls)}
      classLine={classLine}
      badge={badge}
      focus={focus}
      stamped={stamped}
      writing={step === "name"}
      side={stamped ? side : "front"}
      onFlip={stamped ? () => setSide((s) => (s === "front" ? "back" : "front")) : undefined}
      valid={exam && fill(copy.cardValid, { exam: exam.exam, year: localDigits(exam.year, lang) })}
      labels={{
        label: copy.cardLabel,
        student: copy.cardStudent,
        name: copy.cardName,
        class: copy.cardClass,
        focus: copy.cardFocus,
        stamp: copy.cardStamp,
        flip: copy.flip,
        member: copy.cardMember,
        sign: copy.cardSign,
      }}
    />
  );

  const header = (
    <header className="flex h-10 items-center justify-between">
      {o.at > 0 ? (
        <button
          type="button"
          onClick={() => {
            if (timer.current) window.clearTimeout(timer.current);
            leaveDone();
            setPicked(null);
            o.back();
          }}
          aria-label={copy.back}
          className="-ml-2 grid size-10 place-items-center rounded-full text-muted transition-colors hover:bg-raised hover:text-text"
        >
          <ArrowLeft className="size-5" aria-hidden />
        </button>
      ) : (
        <span className="size-10" />
      )}
      <Link href={doneHref} aria-label={logoLabel} className="rounded-sm">
        <Logo className="h-7 w-auto" />
      </Link>
      <span className="size-10" />
    </header>
  );
  // OB14: one bar per question (not the hello or the last screen).
  // Before the class is known, the usual shape (name, class, group, subjects), so the path doesn't grow mid-way.
  const shape = a.cls ? o.steps : stepsFor({ ...a, cls: "12" }, subjects);
  const questions: StepId[] = shape.filter((s) => s !== "hello" && s !== "done");
  const path = <Path total={questions.length} at={done ? questions.length : Math.max(0, questions.indexOf(step))} />;
  const top = (
    <>
      {header}
      {step !== "hello" && path}
    </>
  );

  // Until localStorage is read, only the frame: no flash of the first question for a returning student.
  if (!o.ready)
    return (
      <OnboardingTemplate header={top} card={card}>
        {null}
      </OnboardingTemplate>
    );

  let body: ReactNode;
  switch (step) {
    case "hello":
      body = (
        <Step key="hello" say={<TenTenSays name={copy.tenten}>{copy.hello}</TenTenSays>}>
          <Button variant="raised" size="lg" className="w-full" onClick={() => o.next()}>
            {copy.start}
          </Button>
        </Step>
      );
      break;

    case "name":
      body = (
        <Step key="name" say={<TenTenSays name={copy.tenten}>{copy.askName}</TenTenSays>}>
          <form
            className="grid gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (name) o.next();
            }}
          >
            <div className="grid gap-2 motion-safe:animate-rise" style={rise(1)}>
              <label htmlFor="onboarding-name" className="text-sm font-semibold">
                {copy.nameLabel}
              </label>
              <input
                id="onboarding-name"
                autoFocus
                autoComplete="given-name"
                maxLength={40}
                value={a.name}
                placeholder={copy.namePlaceholder}
                onChange={(e) => o.setAnswers({ ...a, name: e.target.value })}
                className="h-12 rounded-md border border-border-strong bg-surface px-3.5 text-base text-text shadow-card outline-none transition-[border-color,box-shadow] placeholder:text-subtle hover:border-subtle focus:border-brand focus:ring-3 focus:ring-brand/20"
              />
            </div>
            <fieldset className="grid gap-2 motion-safe:animate-rise" style={rise(2)}>
              <legend className="mb-2 text-sm text-muted">{copy.pickAvatar}</legend>
              <div className="flex flex-wrap gap-2">
                {AVATARS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    aria-pressed={a.avatar === e}
                    aria-label={fill(copy.avatarLabel, { avatar: e })}
                    onClick={() => o.setAnswers({ ...a, avatar: a.avatar === e ? null : e })}
                    className={cn(
                      "grid size-11 place-items-center rounded-full border text-2xl transition-[border-color,background-color,scale] active:scale-90",
                      a.avatar === e ? "border-brand bg-brand-soft" : "border-border bg-surface hover:border-border-strong",
                    )}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="motion-safe:animate-rise" style={rise(3)}>
              <Button type="submit" variant="raised" size="lg" className="w-full" disabled={!name}>
                {copy.next}
              </Button>
            </div>
          </form>
        </Step>
      );
      break;

    case "class": {
      if (o.guessed && a.cls) {
        const answer = [classLine, badge].filter(Boolean).join(", ");
        body = (
          <Step
            key="guess"
            say={
              <TenTenSays name={copy.tenten} reaction={reaction}>
                {fill(copy.guess, { answer })}
              </TenTenSays>
            }
          >
            <div className="grid gap-3 motion-safe:animate-rise" style={rise(1)}>
              <Button variant="raised" size="lg" className="w-full" onClick={o.confirmGuess}>
                {copy.guessYes}
              </Button>
              <Button variant="secondary" size="lg" className="w-full" onClick={() => o.setGuessed(false)}>
                {copy.guessNo}
              </Button>
            </div>
          </Step>
        );
        break;
      }
      body = (
        <Step
          key="class"
          say={
            <TenTenSays name={copy.tenten} reaction={reaction}>
              {copy.askClass}
            </TenTenSays>
          }
        >
          <Stairs
            value={a.cls}
            face={a.avatar ?? (name ? name.slice(0, 1) : "🙂")}
            lang={lang}
            short={(c) => copy.classShort[c as keyof Copy["classShort"]] ?? classLabel(c)}
            caption={caption}
            hint={copy.classHint}
            label={copy.askClass}
            onPick={(c) => pick(withClass(a, c), HOP_MS)}
          />
          <p className="text-center text-xs text-subtle motion-safe:animate-rise" style={rise(8)}>
            {copy.classOr}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {CLASSES.filter((c) => c === "admission" || c === "english").map((c, i) => (
              <BigChoice
                key={c}
                i={i + 8}
                on={a.cls === c}
                emoji={c === "admission" ? "🎓" : "🗣️"}
                title={classLabel(c)}
                sub={meaning(c)}
                stack
                onClick={() => pick(withClass(a, c))}
              />
            ))}
          </div>
        </Step>
      );
      break;
    }

    case "group":
      body = (
        <Step
          key="group"
          say={
            <TenTenSays name={copy.tenten} reaction={reaction}>
              {copy.askGroup}
            </TenTenSays>
          }
        >
          <div className="grid gap-2">
            {groupsFor(a.cls).map((g, i) => {
              // What the group studies, where the catalogue lists it (HSC): its own subjects, not the compulsory ones.
              const own = (subjects[streamOf(g) ?? ""] ?? []).filter((x) => !COMPULSORY.has(x.id)).map((x) => x.name);
              return (
                <BigChoice
                  key={g}
                  i={i}
                  on={a.group === g}
                  emoji={GROUP_EMOJI[g] ?? "📚"}
                  title={groupLabel(g)}
                  sub={a.cls === "11" || a.cls === "12" ? own.join(" · ") || null : null}
                  onClick={() => pick({ ...a, group: g, ...(a.group === g ? {} : { hard: null, moods: {} }) })}
                />
              );
            })}
          </div>
        </Step>
      );
      break;

    case "unit":
      body = (
        <Step
          key="unit"
          say={
            <TenTenSays name={copy.tenten} reaction={reaction}>
              {copy.askUnit}
            </TenTenSays>
          }
        >
          <div className="grid gap-2">
            {UNITS.map((u, i) => (
              <BigChoice key={u} i={i} on={a.unit === u} emoji={UNIT_EMOJI[u]} title={copy.units[u]} onClick={() => pick({ ...a, unit: u })} />
            ))}
          </div>
        </Step>
      );
      break;

    case "subjects": {
      const moods = a.moods;
      // OB14: a mood per subject; tapping the same face again clears it. `hard` follows, in the stream's order.
      const setMood = (id: string, m: Mood) => {
        const next = { ...moods };
        if (next[id] === m) delete next[id];
        else next[id] = m;
        o.setAnswers({ ...a, moods: next, hard: options.filter((x) => next[x.id] === "hard").map((x) => x.id) });
        setPicked(next[id] ? id : null);
      };
      // TenTen's word on the subject just rated; before any, on the group.
      const pickedMood = picked ? moods[picked] : undefined;
      const said =
        !picked || !pickedMood
          ? reaction
          : pickedMood === "hard"
            ? (copy.subjectReactions[picked as keyof Copy["subjectReactions"]] ?? fill(copy.afterSubject, { subject: subjectName(picked) }))
            : fill(pickedMood === "easy" ? copy.afterEasy : copy.afterOk, { subject: subjectName(picked) });
      body = (
        <Step
          key="subjects"
          say={
            <TenTenSays name={copy.tenten} reaction={said}>
              {copy.askSubjects}
            </TenTenSays>
          }
        >
          <p className="text-sm text-muted motion-safe:animate-rise" style={rise(1)}>
            {copy.subjectsHint}
          </p>
          <div className="grid gap-2">
            {options.map((x, i) => (
              <MoodRow key={x.id} i={i + 1} name={x.name} mood={moods[x.id]} onMood={(m) => setMood(x.id, m)} moods={copy.moods} boss={copy.boss} />
            ))}
          </div>
          <div className="grid gap-2 motion-safe:animate-rise" style={rise(options.length + 1)}>
            <Button variant="raised" size="lg" className="w-full" disabled={!Object.keys(moods).length} onClick={() => o.next()}>
              {copy.next}
            </Button>
            <Button
              variant="ghost"
              size="md"
              className="mx-auto"
              onClick={() => {
                o.setAnswers({ ...a, hard: [], moods: {} });
                o.next();
              }}
            >
              {copy.skip}
            </Button>
          </div>
        </Step>
      );
      break;
    }

    case "done":
      body = stamped ? (
        <Step
          key="stamped"
          say={
            <TenTenSays name={copy.tenten} reaction={fill(copy.doneTitle, { name })}>
              {segment ? fill(copy.doneSubHsc, { exam: segment.exam }) : copy.doneSub}
            </TenTenSays>
          }
        >
          <div className="grid gap-3 motion-safe:animate-rise" style={rise(2)}>
            <Button href={segment?.href ?? doneHref} variant="raised" size="lg" className="w-full">
              {segment ? fill(copy.toSegment, { exam: segment.exam }) : copy.toDashboard}
            </Button>
            <Button variant="secondary" size="lg" className="w-full" onClick={onSave} disabled={saving}>
              <Download className="size-5" aria-hidden />
              {saving ? copy.saving : copy.save}
            </Button>
            {segment && (
              <Button href={doneHref} variant="ghost" size="md" className="mx-auto">
                {copy.orDashboard}
              </Button>
            )}
            <Restart onClick={() => (leaveDone(), o.restart())}>{copy.restart}</Restart>
          </div>
        </Step>
      ) : (
        <Step
          key="stamp"
          say={
            <TenTenSays name={copy.tenten} reaction={reaction}>
              {fill(copy.stampAsk, { name })}
            </TenTenSays>
          }
        >
          <div className="grid gap-3 motion-safe:animate-rise" style={rise(2)}>
            <HoldButton onDone={onStamp} icon={<Stamp className="size-5" aria-hidden />} className="w-full">
              {copy.stampHold}
            </HoldButton>
            <Restart onClick={() => (leaveDone(), o.restart())}>{copy.restart}</Restart>
          </div>
        </Step>
      );
      break;
  }

  return (
    <OnboardingTemplate header={top} card={card} done={done}>
      {body}
    </OnboardingTemplate>
  );
}

/** TenTen's question on top, the answers below it, pushed to the bottom on phones (near the thumb). */
function Step({ say, children }: { say: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col gap-6 lg:flex-none">
      {say}
      <div className="mt-auto grid gap-4 lg:mt-0">{children}</div>
    </div>
  );
}

function Restart({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <Button variant="ghost" size="md" className="mx-auto" onClick={onClick}>
      {children}
    </Button>
  );
}
