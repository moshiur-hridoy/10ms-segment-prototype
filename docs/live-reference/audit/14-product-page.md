# Product page: Live Website Audit

**Site:** 10minuteschool.com (live) · **Captured:** 26 Oct 2026 · **Viewports:** desktop 1440, mobile 390
**Account:** logged out (public page)
**FigJam:** https://www.figma.com/board/6jivx7do1cG2alktPSUsG9/10MS-Website-Audit → section "14 Product page"
**See also:** [Overview and cross-page issues](00-overview.md)

## Summary

| S1 Blocker | S2 Major | S3 Minor | S4 Cosmetic | Suggestion | Total |
|---|---|---|---|---|---|
| 0 | 9 | 17 | 4 | 2 | 32 |

The page has strong content (instructors, routine, syllabus) but a weak first screen: no one-line hook or audience, a 19-line paragraph, and on mobile the price and Enroll sit at the fold (PDP-1, PDP-5, PDP-22). The price shows no plans or inclusions, the payment section is one sentence, and one FAQ answer looks like an unfilled template (PDP-3, PDP-6, PDP-4). The English route is mostly Bangla, and the brand green fails contrast on every button (PDP-2, PDP-8).

**S1 and S2 issues:**
- **PDP-1** (S2): On mobile, price and Enroll start at y 842 of 844, after the H1, description and video; the sticky bar appears only after scrolling.
- **PDP-2** (S2): The English route is mostly Bangla copy; only labels and the browser title are English.
- **PDP-3** (S2): The price is one line ("৳4500 থেকে শুরু") with no plans, inclusions or instalment options.
- **PDP-4** (S2): The class-start answer sits in square brackets with no date, like an unfilled template.
- **PDP-5** (S2): The hero never says who the course is for; the FAQ answer mixes SSC 2026 with HSC 28.
- **PDP-6** (S2): "Payment process" is one sentence and a video link; no steps, payment methods or refund link.
- **PDP-7** (S2): Accordion headers are plain divs; nothing on the page has aria-expanded.
- **PDP-8** (S2): Brand green text and the Enroll button are 3.00:1, below AA.
- **PDP-9** (S2): Grey text is 2.52:1 (college name and the course-detail prompt).

## Screens reviewed

| # | Screen | URL | Captures |
|---|---|---|---|
| 1 | English route, top half | 10minuteschool.com/en/product/hsc-28-online-batch-physics-chemistry-biology-higher-math/ | `captures/pdp__en__desktop__part1.png`; `captures/pdp__en__mobile__part1.png` |
| 2 | English route, bottom half | same page, continued | `captures/pdp__en__desktop__part2.png`; `captures/pdp__en__mobile__part2.png` |
| 3 | States: after BN/EN switch · mobile sticky buy bar | same page | `captures/state-pdp-after-language-switch__desktop.png`; `captures/state-pdp-sticky-cta-bar__mobile.png` |

## Findings

### 1 · English route, top half

| ID | Sev | Category | Finding | Fix | Evidence |
|---|---|---|---|---|---|
| PDP-1 | S2 | Layout | Mobile: price and Enroll start at y 842 on an 844 px screen, after the H1, a 14-line description and the video carousel; the sticky bar only appears after scrolling. | Price + Enroll under the H1, or the bar from first paint. | `captures/pdp__en__desktop__part1.png`; `captures/pdp__en__mobile__part1.png`; m-en-mobile.json: Enroll button top 842, h 36; sticky bar present at scrollY 2000 (measure2.json) |
| PDP-2 | S2 | Copy | The English route is mostly Bangla (H1, description, features, FAQ); only labels and the browser title are English. | Real English copy, or no EN route for this page. | `captures/pdp__en__desktop__part1.png`; `captures/pdp__en__mobile__part1.png`; text-en-desktop.txt; measure2.json heads (H1 Bangla); title "HSC 28 Physics, Chemistry, Biology, H.Math Online Batch" |
| PDP-3 | S2 | Data | Price is one line, “৳4500 থেকে শুরু”: no plans, nothing on what the from-price covers, no instalments. | Show each plan and what it includes. | `captures/pdp__en__desktop__part1.png`; `captures/pdp__en__mobile__part1.png`; m-en-desktop.json text "৳4500 থেকে শুরু" |
| PDP-8 | S2 | Accessibility | Brand green fails AA: white on #1CAB55 = 3.00:1 (Enroll, login); green text on white = 3.00:1 (Book A Free Class, phone, routine download). | A darker green for text and button fills (≥ 4.5:1). | `captures/pdp__en__desktop__part1.png`; `captures/pdp__en__mobile__part1.png`; m-en-desktop.json lows (Enroll, লগ-ইন, Book A Free Class, ডাউনলোড রুটিন) |
| PDP-9 | S2 | Accessibility | Grey text #A3A3A3 on white = 2.52:1 (“কোর্সটি সম্পর্কে বিস্তারিত জানতে”, testimonial colleges). | #737373 or darker. | `captures/pdp__en__desktop__part1.png`; `captures/pdp__en__mobile__part1.png`; m-en-desktop.json lows (“Narsingdi Government College, Narsingdi.” 2.52; “কোর্সটি সম্পর্কে বিস্তারিত জানতে” 2.52) |
| PDP-11 | S3 | Copy | The button says “Enroll” here but “কোর্সটি কিনুন” (buy) on the Bangla route. | One verb that matches the action. | `captures/pdp__en__desktop__part1.png`; `captures/pdp__en__mobile__part1.png`; m-en-mobile.json btns (Enroll); m-bn-mobile.json btns (কোর্সটি কিনুন) |
| PDP-12 | S3 | Navigation | Switching BN/EN reloads the page at the top (scroll 1200 → 0); in the switched state the header sits ~210 px lower (screen 3). | Keep the reader’s place on switch. | `captures/pdp__en__desktop__part1.png`; `captures/pdp__en__mobile__part1.png`; measure2.json switch (urlAfter /product/..., scroll 1200 → 0); state-pdp-after-language-switch__desktop.png |
| PDP-13 | S3 | Accessibility | The sidebar feature list is ten H4 headings (order H1 → H4 → H2), plus a hidden empty H1. | A list (ul); H2 for sections; remove the empty H1. | `captures/pdp__en__desktop__part1.png`; `captures/pdp__en__mobile__part1.png`; measure2.json heads (desktop and mobile); pdp__en__desktop.png (sidebar) |
| PDP-14 | S3 | Accessibility | BN/EN toggle: 27×18 and 26×18 px targets, touching; 12 px labels at 3.83:1 and 3.30:1. | 24 px+ targets, 14 px text, ≥ 4.5:1. | `captures/pdp__en__desktop__part1.png`; `captures/pdp__en__mobile__part1.png`; measure2.json small list (BN 27x18, EN 26x18); m-en-desktop.json lows (BN 3.83, EN 3.30) |
| PDP-15 | S3 | Responsive | Mobile: the routine table is 500 px in a 358 px box; Cycle 2 is cut, with no scroll cue. | Stack the cycles as cards on mobile. | `captures/pdp__en__desktop__part1.png`; `captures/pdp__en__mobile__part1.png`; measure2.json tables (wrapper 358, content 500, overflow auto); state-pdp-routine-table__mobile.png |
| PDP-16 | S3 | Layout | Four cycles in one 720 px table: long chapter strings in narrow cells, “Cycle 3/4” labels inside the table body, no cell padding or row tint. | One table per cycle; subject as row header; chapters as a list. | `captures/pdp__en__desktop__part1.png`; `captures/pdp__en__mobile__part1.png`; state-pdp-section-tabs-jump__desktop.png (table body) |
| PDP-17 | S3 | Layout | Section tabs are clipped under the arrows (“…rse syllabus”); all 8 are never visible at 1440. | Fit the labels or fade the edges; fewer tabs. | `captures/pdp__en__desktop__part1.png`; `captures/pdp__en__mobile__part1.png`; state-pdp-sticky-after-scroll__desktop.png; state-pdp-section-tabs-jump__desktop.png |
| PDP-18 | S3 | Accessibility | The tab strip has no nav/tablist semantics; the active tab is shown by colour and underline only. | A nav with aria-current. | `captures/pdp__en__desktop__part1.png`; `captures/pdp__en__mobile__part1.png`; aria2 measurement (role=tab count 0; aria-selected null); state-pdp-section-tabs-jump__desktop.png (Course syllabus active) |
| PDP-19 | S3 | Layout | The 2nd testimonial card is cut mid-line at the column edge; the arrows sit outside the column. | A clear peek with a fade, or keep cards inside. | `captures/pdp__en__desktop__part1.png`; `captures/pdp__en__mobile__part1.png`; state-pdp-section-tabs-jump__desktop.png (second card); pdp__en__desktop__part2.png (top of testimonial row) |
| PDP-20 | S3 | Typography | Section titles are 20 px (“Course syllabus”, “Students opinion”) and 24 px (“Class routine”, “Course details”…) on one page. | One section-title size. | `captures/pdp__en__desktop__part1.png`; `captures/pdp__en__mobile__part1.png`; gaps2 measurement (computed h2 font sizes); pdp__en__desktop.png |
| PDP-22 | S3 | Copy | A 19-line Bangla paragraph behind a fade and “Show More”; no summary, no bullets. | 2–3 line summary + 3–4 bullets (who, what, when, price). | `captures/pdp__en__desktop__part1.png`; `captures/pdp__en__mobile__part1.png`; pdp__en__desktop.png (top); state-pdp-description-expanded__desktop.png (expanded: 15 lines) |
| PDP-23 | S3 | Layout | Mobile header: 97 px (two rows) on every scroll, ~11.5% of the screen. | Collapse the category row, or hide it on scroll. | `captures/pdp__en__desktop__part1.png`; `captures/pdp__en__mobile__part1.png`; m-en-mobile.json fixed (div.sticky.top-0 h 97); state-pdp-header-class-menu__mobile.png |
| PDP-24 | S3 | Responsive | Mobile layout shift 0.38 on load (poor), from late mobile-only blocks. | Reserve their height. | `captures/pdp__en__desktop__part1.png`; `captures/pdp__en__mobile__part1.png`; m-en-mobile.json cls 0.38; m-en-desktop.json cls 0.096; m-bn-mobile.json cls 0.364 |
| PDP-37 ✱ | S3 | Visual | The only dark section on the page: small grey body text on navy looks low in contrast (estimated, not measured) and breaks the light rhythm. | Light cards like the rest, or check the contrast. | `captures/pdp__en__desktop__part1.png`; `captures/pdp__en__mobile__part1.png` |
| PDP-38 ✱ | S3 | Copy | “College Timeline” is listed among the subjects in the syllabus. | Move it out of the subject list. | `captures/pdp__en__desktop__part1.png`; `captures/pdp__en__mobile__part1.png` |
| PDP-25 | S4 | Copy | English words inside Bangla headings (“Daily MCQ Exam”, “Board-focused CQ + MCQ প্রস্তুতি”, “AI Doubt Solver (TenTen)”). | Decide per term; keep brand terms consistent. | `captures/pdp__en__desktop__part1.png`; `captures/pdp__en__mobile__part1.png`; pdp__bn__desktop__part1.png; pdp__bn__mobile__part1.png |
| PDP-28 | SUG | Content | Suggestion (impact L): the nine sidebar features repeat as the “How the course is laid out” cards. | Give the lists different jobs, or drop one. | `captures/pdp__en__desktop__part1.png`; `captures/pdp__en__mobile__part1.png`; pdp__en__desktop.png (sidebar and feature block) |
| PDP-29 | SUG | Content | Suggestion (impact M): trust comes from the enrolled count (23151), credentials and first-name testimonials. Missing: a rating with count, a refund line beside the price, dated results. | Add them next to the price. | `captures/pdp__en__desktop__part1.png`; `captures/pdp__en__mobile__part1.png`; pdp__en__desktop.png (sidebar); pdp__en__desktop__part2.png (footer and refund link) |

### 2 · English route, bottom half

| ID | Sev | Category | Finding | Fix | Evidence |
|---|---|---|---|---|---|
| PDP-4 | S2 | Data | The “ক্লাস কবে থেকে শুরু?” answer sits in square brackets, “[কলেজের ক্লাস শুরু হওয়া সাপেক্ষে …]”, like an unfilled template; no date. | A date, or “starts X; confirmed by Y”, without brackets. | `captures/pdp__en__desktop__part2.png`; `captures/pdp__en__mobile__part2.png`; state-pdp-faq-open__desktop.png (answer text, third item open) |
| PDP-5 | S2 | Copy | “কোর্সগুলো কাদের জন্য?” → “SSC 2026 এবং ভবিষ্যৎ HSC 28 ব্যাচের জন্য”. The hero never says who it’s for, and this answer mixes SSC 26 with HSC 28. | A one-line audience statement in the hero. | `captures/pdp__en__desktop__part2.png`; `captures/pdp__en__mobile__part2.png`; state-pdp-faq-open__desktop.png (first item open); pdp__en__desktop.png (hero) |
| PDP-6 | S2 | Data | “Payment process” is one sentence and a video link: no steps, no payment methods, no instalment rule, no refund link. | 3–4 numbered steps, methods, refund link. | `captures/pdp__en__desktop__part2.png`; `captures/pdp__en__mobile__part2.png`; pdp__en__desktop__part2.png (Payment process box); state-pdp-faq-open__desktop.png (same section) |
| PDP-7 | S2 | Accessibility | Accordion headers are plain divs; nothing on the page has aria-expanded. | Buttons with aria-expanded and aria-controls. | `captures/pdp__en__desktop__part2.png`; `captures/pdp__en__mobile__part2.png`; aria2 measurement (0 aria-expanded; H3 parent DIV has no role); state-pdp-faq-open__desktop.png; state-pdp-syllabus-accordion-open__desktop.png |
| PDP-21 | S3 | Consistency | Four “show more” patterns: green text link (hero), outlined pill on a card border (instructors), white pill on a card border (FAQ “See all”), text link (testimonials). | One expand pattern. | `captures/pdp__en__desktop__part2.png`; `captures/pdp__en__mobile__part2.png`; expandable-control list (measure2.json); pdp__en__desktop__part2.png (See all on the FAQ border); pdp__en__desktop.png (instructors pill) |
| PDP-27 | S4 | Interaction | Invisible to users: 10 resource 404s on mobile load, a cart API 404, a duplicate Meta Pixel ID. | Remove the stale calls. | `captures/pdp__en__desktop__part2.png`; `captures/pdp__en__mobile__part2.png`; measure2.json bad and logs (desktop and mobile); m-en-mobile.json logs (10 404 lines) |
| PDP-34 ✱ | S4 | Copy | “Frequently Ask Questions” should be “Frequently Asked Questions”. | Fix the heading. | `captures/pdp__en__desktop__part2.png`; `captures/pdp__en__mobile__part2.png` |
| PDP-35 ✱ | S4 | Copy | The English page ends with a Bangla heading (“আরও কোন জিজ্ঞাসা আছে?”) above an English footer. | One language per route. | `captures/pdp__en__desktop__part2.png`; `captures/pdp__en__mobile__part2.png` |

### 3 · States: after BN/EN switch · mobile sticky buy bar

| ID | Sev | Category | Finding | Fix | Evidence |
|---|---|---|---|---|---|
| PDP-10 | S3 | Layout | Mobile sticky buy bar: 108 px (13% of the screen), covering text; the chat bubble sits on its top edge. | A one-row bar (~64 px); move the chat bubble above it. | `captures/state-pdp-after-language-switch__desktop.png`; `captures/state-pdp-sticky-cta-bar__mobile.png`; measure2.json fixedAfterScroll: bar 736 to 844; chat 702 to 738; state-pdp-footer-chat-fab__mobile.png |

## Strengths to keep
- Keep: instructors with photos and credentials near the top.
- Keep: the full class routine and syllabus are visible before buying.

## Not checked
- Looked at logged out, up to the Enroll button only: checkout and payment weren’t opened.

---
✱ = added or re-rated during review (design QA: spacing, colour, consistency; or a reviewer severity change). Severity scale and method: [00-overview.md](00-overview.md).
