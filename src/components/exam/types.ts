import type { Dictionary } from "@/i18n/get-dictionary";

/** A question ready for the browser: text, options and explanation already typeset (HTML). */
export type ExamQuestion = {
  id: string;
  /** "অধ্যায় ৩" */
  chapter: string;
  html: string;
  options: string[];
  answer: number;
  explanation: string | null;
  /** All options are short, so the paper can set them in two columns. */
  short: boolean;
};

export type ExamLabels = Dictionary["exam"];

/** `null` = not answered. */
export type Answers = (number | null)[];
