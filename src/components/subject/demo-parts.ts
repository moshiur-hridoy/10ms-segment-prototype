import type { VideoPart } from "./player-parts";

/*
 * Sample parts for the three demo videos (P49), until the API sends `chapters`. The titles are the
 * topics each class's own title lists; the start times are made up (the videos' YouTube pages give
 * none), so the list under the video carries the sample marker.
 */
export const DEMO_PARTS: Record<string, VideoPart[]> = {
  // কোষ, কোষ তত্ত্ব, RNA World Hypothesis, কোষ প্রাচীর
  EwxIwrMDfDQ: [
    { startSec: 0, title: "কোষ" },
    { startSec: 1260, title: "কোষ তত্ত্ব" },
    { startSec: 2580, title: "RNA World Hypothesis" },
    { startSec: 3720, title: "কোষ প্রাচীর" },
  ],
  // প্রোটোপ্লাজম ও কোষঝিল্লি
  sZPXOB_eSKg: [
    { startSec: 0, title: "প্রোটোপ্লাজম" },
    { startSec: 2100, title: "কোষঝিল্লি" },
  ],
  // সাইটোপ্লাজম ও কোষীয় অঙ্গাণু: মাইটোকন্ড্রিয়া ও প্লাস্টিড
  "7NE4qMG-4v8": [
    { startSec: 0, title: "সাইটোপ্লাজম" },
    { startSec: 1500, title: "কোষীয় অঙ্গাণু" },
    { startSec: 2700, title: "মাইটোকন্ড্রিয়া" },
    { startSec: 3900, title: "প্লাস্টিড" },
  ],
};
