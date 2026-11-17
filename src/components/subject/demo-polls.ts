/*
 * Lab `class` v20 (P103): sample polls for the demo. In a live class the teacher starts a poll from the
 * teacher studio; it stays open for a minute and closes by itself. A recording replays it at the same
 * moment. Nothing in the data carries polls yet (design-audit 9.2), so these stand in: the question,
 * the options, where in the video it opened, and how the live class answered (percent).
 */
export type Poll = {
  /** Seconds into the video when the teacher opened it. */
  at: number;
  /** How long it stays open. */
  seconds: number;
  question: string;
  options: string[];
  /** The live class's answers, percent per option. */
  votes: number[];
};

export const DEMO_POLLS: Record<string, Poll> = {
  // Class 1 (the sample live class, P98): 15 s after the start.
  v_2: {
    at: 15,
    seconds: 60,
    question: "কোষের শক্তিঘর বলা হয় কোনটিকে?",
    options: ["রাইবোজোম", "মাইটোকন্ড্রিয়া", "গলজি বডি", "লাইসোজোম"],
    votes: [12, 64, 15, 9],
  },
  // Class 2 (a recording): half a minute after where the student left off (30:30).
  v_5: {
    at: 1860,
    seconds: 60,
    question: "কোষঝিল্লির প্রধান উপাদান কোনগুলো?",
    options: ["লিপিড ও প্রোটিন", "সেলুলোজ", "কাইটিন", "পেপটিডোগ্লাইকান"],
    votes: [71, 8, 6, 15],
  },
};
