"use client";

import { useSyncExternalStore } from "react";
import { EMPTY, fromLanding, LANDING_KEY, stepsFor, type Answers, type StepId, type SubjectsByStream } from "./steps";

/*
 * The answers and where the student is, kept in localStorage so a reload carries on from the same
 * question. There is no backend for these fields yet (section 9). On a first visit, what the
 * landing page already knows becomes a guess the student confirms with one tap (OB4).
 */

const KEY = "10ms-onboarding";

type Saved = {
  answers: Answers;
  step: StepId;
  /** The class and group came from the landing page and wait for a yes. */
  guessed: boolean;
  /** The student has stamped their card on the last screen (OB10). Going back clears it. */
  stamped: boolean;
};

const START: Saved = { answers: EMPTY, step: "hello", guessed: false, stamped: false };
let cache: Saved | null = null;
const listeners = new Set<() => void>();

function read(): Saved {
  if (cache) return cache;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null") as Saved | null;
    if (saved?.answers) cache = { ...START, ...saved, answers: { ...EMPTY, ...saved.answers } };
    else {
      const known = fromLanding(localStorage.getItem(LANDING_KEY));
      cache = known ? { ...START, answers: { ...EMPTY, ...known }, guessed: true } : START;
    }
  } catch {
    cache = START;
  }
  return cache;
}

function write(patch: Partial<Saved>) {
  cache = { ...read(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // Private mode or a full store: the answers stay for this visit only.
  }
  for (const l of listeners) l();
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => void listeners.delete(l);
};

export function useOnboarding(subjects: SubjectsByStream) {
  const saved = useSyncExternalStore(subscribe, read, () => null);
  const { answers, step, guessed, stamped } = saved ?? START;

  const steps = stepsFor(answers, subjects);
  const at = Math.max(0, steps.indexOf(step));
  // `next` reads the steps from the answers it is given, so a group or unit chosen in the same tap counts.
  const next = (with_: Answers = read().answers) => {
    const list = stepsFor(with_, subjects);
    write({ step: list[Math.min(list.indexOf(read().step) + 1, list.length - 1)] });
  };
  const back = () => write({ step: steps[Math.max(0, at - 1)], stamped: false });

  /** Yes to the landing page's guess: past the class, group and unit questions. */
  const confirmGuess = () => {
    const list = stepsFor(answers, subjects);
    write({ guessed: false, step: list.find((s) => !["hello", "name", "class", "group", "unit"].includes(s)) ?? "done" });
  };

  return {
    answers,
    setAnswers: (a: Answers) => write({ answers: a }),
    step,
    steps,
    at,
    next,
    back,
    guessed,
    setGuessed: (g: boolean) => write({ guessed: g }),
    confirmGuess,
    stamped,
    stamp: () => write({ stamped: true }),
    restart: () => write(START),
    /** False until localStorage is read (and while prerendered). */
    ready: saved !== null,
  };
}
