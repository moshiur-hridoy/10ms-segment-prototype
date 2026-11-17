# Live audit: functional (LF) and consistency (LG)

**Covered URLs (26 Oct 2026, read-only, designer's logged-in session):**
- https://10minuteschool.com/dashboard/
- https://10minuteschool.com/user/practice-exam/ (SuperPrep; reached by the "কন্টিনিউ করো" CTA on the dashboard at 390; at 1440 the CTA click timed out on a hidden duplicate, so SuperPrep was opened by direct URL and only contrast was sampled there)
- https://10minuteschool.com/user/learning-report/
- https://10minuteschool.com/bn/programs/learn/program/422/course/2253/ (redirects to `/programs/learn/program/422/course/2253/live-class/ZEkl5fbfdZ/`, a live-class player; no video was played)
- https://10minuteschool.com/inbox/, /explore/, /recap/, /more/
- https://10minuteschool.com/en/product/hsc-28-online-batch-physics-chemistry-biology-higher-math/ (redirects to `/programs/short-routine/online_batch/11234/?slug=hsc-28-online-batch-physics-chemistry-biology-higher-math`)

**Viewports:** 1440x900 and 390x844 (iPhone UA, touch).

**Not reachable or not done read-only:**
- Notification "Mark all read", inbox "সব দেখো" (cross-domain), the lesson/video player, and the SuperPrep exam start were not clicked.
- The site language (BN/EN) control was not found on the dashboard at either size. Visible DOM was searched and the header user menu was probed (no header avatar match). Not verified in full; see "Open questions".
- Desktop SuperPrep computed styles (LG) were not measured. Only its text contrast was sampled. The mobile SuperPrep numbers are in the appendix.
- Mobile dashboard header height could not be isolated with the DOM heuristic (the 140px block is the greeting area, not the top bar).
- Console and network checks cover a 2.5-3 s settle after load, not a full session.

**Method notes:** Scripts are in `/tmp/10ms-live/x2/` (`audit.mjs`, `probe2.mjs`, `probe3.mjs`, `probe4.mjs`). Raw JSON is in `/tmp/10ms-live/x2/out/`. Link status was checked with a server-side GET (`page.request`), so it does not see client-side redirects. Those were checked with a page load. Contrast is computed from the nearest opaque ancestor background, assuming white where none is set. Card radius and padding use a heuristic (visible, bordered or filled, at least 150x60px). Evidence shots: `captures/x-func-404-inbox__desktop.png` (only one; focus and overflow shots were not needed because every page passed).

---

## LF: functional

| ID | Screen / element | Finding | Cat | Ref | Sev / Impact | Kind | Evidence (capture file + measurement) | Recommendation |
|---|---|---|---|---|---|---|---|---|
| LF-01 | /inbox/ and /more/ at 1440 | Direct load of `/inbox/` and `/more/` at desktop width ends on `https://10minuteschool.com/404/` (two runs, plus the probe). The same URLs load correctly at 390 (mobile bottom nav). The desktop header has no Inbox or More link, so the pages are reachable only by URL. Raw server response is 200 with the app shell, so the redirect is client-side. | NAV | H9 (error recovery) | S2 Major | Issue | `captures/x-func-404-inbox__desktop.png`; desktop final URL `/404/`, title unchanged; raw GET `/inbox/` 200 | Make the inbox and more routes render at 1440, or hide the routes at desktop width so they do not fail. |
| LF-02 | PDP `/en/product/...` (both sizes) | The English product URL redirects to `/programs/short-routine/online_batch/11234/?slug=...`. The page is in Bangla with `<html lang="bn">`. The slug and the path point at different product identifiers. | CPY | WCAG 3.1.1 (language of page); H4 | S3 Minor | Issue | URL before/after in `probe`/`audit` JSON (pdp entries); `captures/pdp__en__*.png` already shows Bangla copy | Serve the EN product in English with `lang="en"`, or link the EN route to the matching EN product. Confirm the intended product for the slug. |
| LF-03 | PDP at 390, fixed header | The "হোমপেজ" (Homepage) link in the fixed header points to `/bn/user/profile/edit/` (resolves 200 at `/user/profile/edit/`). The label says home; the destination is the profile editor. | NAV | H2 (match between system and real world); H4 | S2 Major | Issue | `audit` mobile pdp links: first `a` = `হোমপেজ -> /bn/user/profile/edit/` | Point the home link to `/dashboard/` (or the site home) and check the header component for the PDP template. |
| LF-04 | All pages except /recap/ | Document title is the same on 8 of 9 pages: "10 Minute School - The Largest Online Classroom of Bangladesh" (dashboard, SuperPrep, learning report, course, inbox, explore, more, PDP). /recap/ has its own title. Screen readers and tab lists show no page name. | A11Y | WCAG 2.4.2 (AA) | S3 Minor (S2 on daily-use dashboard, per the rule) | Issue | `audit` JSON `title` field, both viewports | Set a per-route title, e.g. "Dashboard - 10 Minute School", "Learning report", "Inbox". |
| LF-05 | All 9 pages, both sizes | No skip link on any page (no `a[href^="#"]` with skip or main text). Tab order from the top starts with the logo, then the header links. Desktop: logo, Dashboard, Learning report, Search, phone link. | A11Y | WCAG 2.4.1 (bypass blocks, A; AA target) | S3 Minor | Issue | `skip: []` on every page; desktop tab sequence in `results-desktop.json` | Add a visible-on-focus "Skip to content" link as the first focusable element and a `<main>` landmark. |
| LF-06 | Mobile bottom nav (dashboard, explore, more, PDP, and others) | Inactive bottom-nav labels use `#9CA3AF` text at 10px on white: contrast 2.54:1 (measured on dashboard, explore, more, PDP, four to five elements each). The navigation is used on every daily screen. | A11Y | WCAG 1.4.3 (AA) | S2 Major (AA fail, on a daily-use screen) | Issue | `probe4-mobile.json`: `rgb(156,163,175) on 255,255,255 ratio 2.54 small x4 e.g. "ড্যাশবোর্ড" 10px` (dashboard), same on explore, more and PDP | Use at least `#6B7280` (4.83:1 on white) or darker for inactive labels, and keep labels at 11px or larger. |
| LF-07 | Mobile dashboard, grey and blue text on grey cards | Secondary text fails AA: date line `#6B7280` on `#F3F4F6` at 14px = 4.39:1; time stamps `#6B7280` on `#F4F4F4` at 9px = 4.40:1; `#6B7280` on `#E5E7EB` = 3.90:1 ("মিসড ক্লাস" 14px); white on `#828894` = 3.56:1 ("CLASS" 12px); blue `#3A7CFF` on white = 3.81:1 ("৫ম শ্রেণি" 12px). | A11Y | WCAG 1.4.3 (AA) | S2 Major (AA fail on secondary content) | Issue | `probe4-mobile.json` dashboard entries (counts x9, x5, x1, x5, x5) | Darken the grey secondary token to at least 4.5:1 on its card background, and check the blue and card tokens against the same rule. |
| LF-08 | Green text on white (PDP buy label, SuperPrep and explore links) | Brand green text `#1CAB55` on white = 3.00:1 at 14-16px ("মাস্টারবুক কিনুন" 14px, PDP at 390 and 1440; "16910" and "এক্সপ্লোর" at 1440). Text `#16A34A` = 3.30:1 at 10px (explore, more). | A11Y | WCAG 1.4.3 (AA) | S3 Minor (primary CTA label, not secondary) | Issue | `probe4-desktop.json` and `probe4-mobile.json` (pdp x4 mobile, x9 desktop; superprep x5; explore x6) | Use a darker green for text (at least 4.5:1) and keep the brighter green for fills only. |
| LF-09 | Dashboard and course, 390 and 1440 | Small text: 9px on mobile dashboard (time stamps "4:30 PM", "6:00 PM"); 8px and 9px on learning report (fraction labels "0/7" x25 at 9px at both sizes; 8px text nodes x7 with no innerText, likely chart labels); 10px bottom-nav labels. | VIS | H8 (aesthetic and minimalist design); legibility | S3 Minor | Issue | `results-*.json` and `probe2-*.json` `fonts` and `tiny` fields | Set a 11px floor for any text, and 12px for timestamps and data labels. |
| LF-10 | Course player (`/programs/learn/.../live-class/...`) | No in-page back link, breadcrumb or close control. The only visible button in the DOM is a "1x" playback speed control. Browser Back works (see strengths), and the header logo returns home. | NAV | H3 (user control and freedom) | S3 Minor | Issue | `extra.courseBefore.inAppBackCandidates` = playback-speed button only, both sizes | Add a visible "Back to course" or breadcrumb (course > lesson) at the top of the player. |
| LF-11 | Inbox, "সব দেখো" link | The link goes to `app.10minuteschool.com/notice` with a long tracking query (`_gl`, `_ga`, `_fplc` and similar) in the href. This hands off to a second domain without a visible cue. | INT | H4 (consistency) | S4 Cosmetic | Issue | `results-mobile.json` inbox links | Strip analytics query parameters from visible-link hrefs, or keep the hand-off on-domain. |

**Checked and passed (no finding):**
- **Dead or `#` links:** none in the header or bottom nav on either size. Every header and bottom-nav `href` returned 200 on server GET. The only 404 is the client-side desktop route in LF-01.
- **Horizontal overflow:** `scrollWidth` equals `innerWidth` on every page at both sizes (390 and 1440). The wide elements found on the mobile dashboard and recap (right edge at 2006px and 504px) are carousel slides and a decorative blob inside clipped containers, not page overflow.
- **Tab focus:** on every page at both sizes, the fifth Tab stop shows a visible focus ring (browser `outline: auto`, 1px, `rgb(0,95,204)`).
- **Browser Back:** course player to dashboard returns to `/dashboard/` and renders it (verified).
- **Console and network:** no console errors, page errors, or failed requests recorded during the settle window on any page at either size.
- **HTML lang:** `bn` on all pages (see LF-02 for the EN route).

**Open questions (not findings yet):**
- BN/EN switch: no EN or BN control found in visible DOM on the dashboard at either size. The header user menu was not opened fully. If a switch exists in that menu, LF-02 needs a second look.
- Mobile dashboard header height: not isolated (see notes above).

---

## LG: consistency

Measured values across pages are in the appendix. Summary of differences:

| ID | Screen / element | Finding | Cat | Ref | Sev / Impact | Kind | Evidence (capture file + measurement) | Recommendation |
|---|---|---|---|---|---|---|---|---|
| LG-01 | Top header height (desktop) | Header is 64px on dashboard, explore, learning report, course, PDP and the 404 pages, but 72px on /recap/ (+8px). At 390, the fixed header measured 68px on /recap/ and 57px on the PDP. | CON | H4 | S3 Minor | Issue | desktop `styles.headerH` / `hdr.h`: 64 (x7), 72 (recap); mobile recap 68, pdp 57 | Use one header component height at each breakpoint across the student area. |
| LG-02 | Type scale (font sizes and weights) | Sizes in use per page (desktop): dashboard 7 sizes (10-24px); learning report 7 (9-20px); explore 4 (14-20px); inbox and more 3 (14, 16, 20px); PDP 5 (14-24px); course 5 (12-20px). At 390: dashboard 9 sizes (9-22px); report 10 (8-24px); SuperPrep 6; course 4; PDP 5. Weights 400, 500, 600, 700 and 800 all appear. Across the set there are 14 distinct sizes, and headings do not repeat a single scale (dashboard uses 20, 21, 22 and 24px headings). | TYP | H4; H8 | S3 Minor | Issue | `results-*.json` and `probe2-*.json` `styles.fonts` / `fonts` (see appendix) | Define a short type scale (for example 10, 12, 14, 16, 20, 24) and use it on every student screen. |
| LG-03 | Text colours | At least three near-black text values appear: `rgb(17,24,39)` (gray-900 family, most pages), `rgb(23,23,23)` (neutral-900, dashboard, SuperPrep, more, PDP) and `rgb(0,0,0)` (dashboard, PDP). Greys include `#525252`, `#262626`, `#404040`, `#737373`, `#4B5563`, `#374151`, `#6B7280` and `#9CA3AF`. Dashboard mobile uses 10 distinct text colours. | VIS | H4 | S3 Minor | Issue | per-page `colors` lists (appendix) | Keep one primary text and three grey steps, and map each route to them. |
| LG-04 | Brand green and blue | Three greens: `#149353` (dashboard primary button), `#1CAB55` (dashboard and PDP text, inbox and more buttons), `#16A34A` (explore, inbox, more text). Blues: `#3A7CFF` (dashboard), `#3983F7` (learning report), `#4179C7` (dashboard tag). | VIS | H4 | S3 Minor | Issue | `btnBg` and `colors` lists (appendix) | Use one green token for actions and one blue for links, and reuse it on every page. |
| LG-05 | Primary button heights | Button heights measured (filled or primary): 36, 40, 42, 44, 46 and 48px on the dashboard, and 44px on inbox and more. PDP at 390 has a filled button 28px tall. Targets above 24px pass WCAG 2.5.8 (AA). | CON | WCAG 2.5.8 (AA); H4 | S4 Cosmetic | Issue | `primaryBtn` lists (appendix): dashboard mobile `h=36/40/42/46px`, desktop `h=40/42/44/48px`; PDP mobile `h=28px` | Use one button height (44px suggested) for primary actions. |
| LG-06 | Card radius and padding | Card border radius ranges from 4px to 32px. Dashboard desktop uses 24px (10 cards), 20px, 16px, 12px, 8px and 32px. Learning report desktop uses 4px, 6px and 8px. SuperPrep at 390 uses 24px. Inbox and more at 390 use 12px. Padding ranges from `0` to `24px 16px` on the same dashboard (for example `16px` x6, `14px 8px 14px 14px` x3 and `24px 24px 24px 24px` x1 on desktop). | CON | H4 | S3 Minor | Issue | `radii` and `pads` lists (appendix); heuristic: visible, bordered or filled, at least 150x60px | Set one card radius and one card padding per breakpoint and reuse them. |

---

## Appendix: measured values per page

Units: px. Counts are the number of elements with that value. Font lists are `size/weight x count`. Colour lists are `colour x count`. Button and primary lists are background colour and height.

### Desktop 1440

| Page | Header h | Font sizes (distinct) | Text colours (top) | Button background | Primary button heights | Radii | Padding |
|---|---|---|---|---|---|---|---|
| Dashboard | 64 | 10, 11, 12, 14, 16, 20, 24 (7) | 107,114,128 · 17,24,39 · 82,82,82 · 0,0,0 · 255,255,255 · 28,171,85 · 23,23,23 · 58,124,255 | `#FFF`, `rgba(0,0,0,.02)`, `#171717`, `#149353` | `#FFF` 40 (x2), `rgba(0,0,0,.02)` 28 (x2), `#FFF` 44 and 48, `#171717` 40, `#149353` 42 | 24 (x10), 20 (x4), 8, 32, 16, 12 | 16 (x6), 0 (x3), 14/8/14/14 (x3), 14 (x2), 4, 24 |
| SuperPrep (direct URL `/user/practice-exam/`) | not measured | not measured | contrast sampled: `#1CAB55` on white 3.00:1 x5 ("16910" 16px) | not measured | not measured | not measured | not measured |
| Learning report | 64 | 9, 11, 12, 14, 16, 18, 20 (7) | 17,24,39 · 255 · 107,114,128 · 82,82,82 · 28,171,85 · 38,38,38 · 0 · 75,85,99 · 115,115,115 · 57,131,247 | none | none | 4 (x12), 6 (x3), 8 (x3) | 16 (x17), 0 (x1) |
| Inbox (`/inbox/` → `/404/`) | 64 (404 page) | 14, 16, 20 (3) | 82,82,82 · 28,171,85 · 75,85,99 · 0 · 17,24,39 · 255 | `#1CAB55` | `#1CAB55` 44 | none | none |
| Explore | 64 | 14, 16, 18, 20 (4) | 17,24,39 · 82,82,82 · 28,171,85 · 107,114,128 · 0 · 75,85,99 | none | none | none | none |
| Recap | 72 | 16, 20, 60 (3) | 255 · rgba(255,255,255,.8) · rgba(255,255,255,.5) | none | none | none | none |
| More (`/more/` → `/404/`) | 64 (404 page) | 14, 16, 20 (3) | as Inbox | `#1CAB55` | `#1CAB55` 44 | none | none |
| PDP (redirected) | 64 | 14, 16, 18, 20, 24 (5) | 82,82,82 · 17,24,39 · 28,171,85 · 75,85,99 · 0 · 107,114,128 · 38,38,38 | `#FFF` | `#FFF` 36 | none | none |
| Course player (live-class) | 64 | 12, 14, 16, 18, 20 (5) | 14/500 and 16/500 and 16/600 dominant; lang toggle buttons "Bangla"/"English" (course content language, not site language) | none measured | none | 12 (x6), 8, 16 | 0 (x8) |

Desktop header links (all pages): logo `/`, `ড্যাশবোর্ড` `/dashboard/`, `লার্নিং রিপোর্ট` `/user/learning-report/`, search input, `16910` `tel:16910`. The desktop header has no Explore, Inbox or More links.

Desktop direct-load results: `/inbox/` → `/404/`; `/more/` → `/404/`.

### Mobile 390

| Page | Header h | Font sizes (distinct) | Text colours (top) | Button background | Primary button heights | Radii | Padding |
|---|---|---|---|---|---|---|---|
| Dashboard | not isolated (140 = greeting block) | 9, 10, 11, 12, 14, 16, 18, 21, 22 (9) | 107,114,128 · 17,24,39 · 255 · 0 · 23,23,23 · 58,124,255 · 55,65,81 · 156,163,175 · 65,121,199 · 20,147,83 | `#FFF`, `#149353`, `#171717` | `#FFF` 40 (x2), 36, 46; `#149353` 42; `#171717` 40 | 16 (x7), 24 (x3), 20 (x2) | 14/8/14/14 (x3), 0 (x3), 10 (x2), 16 (x1), 24/16/24/16 (x1), 10/12 (x1) |
| SuperPrep (`/user/practice-exam/`) | not measured (no header detected) | 10, 12, 14, 16, 18, 24 (6) | 107,114,128 · 17,24,39 · 115,115,115 · 23,23,23 · 156,163,175 · 64,64,64 | none | none | 24 (x19) | 8/12/8/12 (x17), 40/24/0/24, 16 (x1) |
| Learning report | not measured | 8, 9, 10, 11, 12, 14, 16, 18, 20, 24 (10) | 17,24,39 · 255 · 107,114,128 · 38,38,38 · 156,163,175 · 115,115,115 · 28,171,85 · 57,131,247 | none | none | 8 (x2), 6 (x1) | 16 (x2), 8 (x1) |
| Inbox | not measured | 10, 12, 14, 16, 18 (5) | 17,24,39 · 55,65,81 · 107,114,128 · 156,163,175 · 255 · 22,163,74 | none | none | 12 (x7) | 12/16/12/16 (x7) |
| Explore | not measured | 10, 14, 18 (3) | 17,24,39 · 107,114,128 · 156,163,175 · 22,163,74 | none | none | none | none |
| Recap | 68 (fixed/sticky top) | 14, 16, 20, 32 (4) | 255 · rgba(255,255,255,.8) · rgba(255,255,255,.5) | none | none | none | none |
| More | not measured | 10, 16 (2) | 23,23,23 · 156,163,175 · 17,24,39 · 64,64,64 · 230,60,60 · 22,163,74 | none | none | 12 (x5) | 0 (x5) |
| PDP (redirected) | 57 (fixed/sticky top) | 10, 12, 14, 16, 18 (5) | 17,24,39 · 156,163,175 · 28,171,85 · 107,114,128 · 23,23,23 · 82,82,82 · 38,38,38 · 75,85,99 | `#FFF` | `#FFF` 28 | none | none |
| Course player (live-class) | not measured | 11, 12, 14, 16 (4) | not captured (no visible text heuristics matched) | none | none | none | none |

Mobile bottom nav / fixed header links (all tested pages): `ড্যাশবোর্ড` `/dashboard/`, `এক্সপ্লোর` `/explore/`, `লার্নিং রিপোর্ট` `/user/learning-report/`, `ইনবক্স` `/inbox/`, `আরও` `/more/`. All returned 200 on server GET and loaded at 390.

Mobile-only link findings: PDP `হোমপেজ` `/bn/user/profile/edit/` (LF-03). Recap `(/)` logo link with no visible text.

### Contrast samples (WCAG 1.4.3, computed)

| Page / size | Colour on background | Ratio | Text sample (size) | Count |
|---|---|---|---|---|
| Dashboard, 390 | `#6B7280` on `#F3F4F6` | 4.39 | date line (14px) | 9 |
| Dashboard, 390 | `#6B7280` on `#F4F4F4` | 4.40 | time stamps (9px) | 5 |
| Dashboard, 390 | `#FFF` on `#828894` | 3.56 | "CLASS" (12px) | 5 |
| Dashboard, 390 | `#3A7CFF` on `#FFF` | 3.81 | course title (12px) | 5 |
| Dashboard, 390 | `#9CA3AF` on `#FFF` | 2.54 | "এক্সপ্লোর" (10px) | 4 |
| Dashboard, 390 | `#4179C7` on `#D8E6F9` | 3.47 | "অনলাইন ব্যাচ" (12px) | 3 |
| Dashboard, 390 | `#149353` on `#FFF` | 3.94 | "ফুল রুটিন দেখো" (14px) | 2 |
| Explore, 390 | `#9CA3AF` on `#FFF` | 2.54 | "ড্যাশবোর্ড" (10px) | 4 |
| Explore, 390 | `#16A34A` on `#FFF` | 3.30 | "এক্সপ্লোর" (10px) | 1 |
| More, 390 | `#E63C3C` on `#FFF` | 4.14 | "লগআউট" (16px) | 1 |
| More, 390 | `#16A34A` on `#FFF` | 3.30 | "আরও" (10px) | 1 |
| PDP, 390 | `#9CA3AF` on `#FFF` | 2.54 | "ড্যাশবোর্ড" (10px) | 5 |
| PDP, 390 | `#1CAB55` on `#FFF` | 3.00 | "মাস্টারবুক কিনুন" (14px) | 4 |
| SuperPrep, 1440 | `#1CAB55` on `#FFF` | 3.00 | "16910" (16px) | 5 |
| Explore, 1440 | `#1CAB55` on `#FFF` | 3.00 | "এক্সপ্লোর" (14px) | 6 |
| PDP, 1440 | `#1CAB55` on `#FFF` | 3.00 | "16910" (16px) | 9 |

Contrast was computed from the nearest opaque background. Where no background was set, white was assumed.
