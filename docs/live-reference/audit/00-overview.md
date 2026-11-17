# 10 Minute School · live website audit

**In short.** The live student area works, but it doesn’t add up for the student. The same metric shows different numbers on different screens (LX-1), the report shows the wrong week (LX-2), and several buttons don’t go where their label says (LX-3). Much of the rest comes from having no shared design system: text colours that fail contrast, cards, buttons and tabs that change from page to page, and mixed language and digits (LX-9, LX-13). **182 findings across 5 sections (3 blockers), plus 14 cross-page issues.** Fix the cross-page issues first: each one fixes several screens at once.

What students see today on 10minuteschool.com, after login, plus one public product page. One section per area. Each issue has a numbered marker on the screenshot and a sticky with the finding and the fix. Stickies marked ✱ are spacing, colour and consistency notes added in review.

## How to read a sticky

| Sticky | Colour | Meaning |
|---|---|---|
| S1 · Blocker | Custom (dark) | A core task fails, or the data is wrong or misleading. |
| S2 · Major | Orange | Clear confusion or extra steps; the page contradicts itself. |
| S3 · Minor | Yellow | Friction, or off-system styling. Easy to work around. |
| S4 · Cosmetic | Grey | Polish only. |
| Suggestion | Blue | Works today, could be better. |
| Strength to keep | Green | Works well; don’t lose it in a redesign. |
| Open / can’t check | Violet | Needs a test account or a product answer. |

Accessibility (WCAG AA) failures are never below S3. A screen students use daily moves up one severity level.

## Sticky format

`ID · severity · category`, then what is wrong, then `→` and the fix. Marker circles on the screenshots use the same colour and the ID number.

Categories: Navigation, Layout, Visual, Typography, Copy, Interaction, Accessibility, Responsive, Consistency, Data.

## IDs

| Prefix | Area |
|---|---|
| LD | Dashboard and header |
| LC | Course home |
| LS | Class player |
| LR | Learning report |
| LP | SuperPrep |
| PDP | Product page |
| LF | Links and functional |
| LG | Consistency |
| LX | Issues that span several pages |

Earlier SuperPrep audit IDs (PG-, SU-, EX-, …) are reused where the same problem is still live.

## How this was captured

26 Oct 2026 · Desktop 1440 and mobile 390 · logged in as a real Class 5 student (name, school and photo masked) · read-only: nothing was started, submitted, posted or bought. Screens behind an exam or payment couldn’t be reached and are marked with violet stickies. Full findings, evidence and measurements: `docs/live-audit/` in the project repo.

## Sections

| Section | File | S1 | S2 | S3 | S4 | Suggestion |
|---|---|---|---|---|---|---|
| 10 Dashboard | [10-dashboard.md](10-dashboard.md) | 0 | 6 | 24 | 10 | 0 |
| 11 Course & player | [11-course-player.md](11-course-player.md) | 0 | 6 | 30 | 5 | 0 |
| 12 Learning report | [12-learning-report.md](12-learning-report.md) | 1 | 12 | 21 | 3 | 0 |
| 13 SuperPrep | [13-superprep.md](13-superprep.md) | 2 | 14 | 13 | 3 | 0 |
| 14 Product page | [14-product-page.md](14-product-page.md) | 0 | 9 | 17 | 4 | 2 |

Counts are findings with an ID. Cross-page issues (LX) are listed below and counted separately.

## Cross-page issues (LX)

Each one merges findings from several sections. The related IDs are the codes on the sticky’s last line.

| ID | Sev | Category | Issue | Fix | Related IDs |
|---|---|---|---|---|---|
| LX-1 | S1 | Data | Numbers disagree across screens: accuracy 38% (dashboard, paper) vs 0.71% (subject list) vs 0% / 29.73% (report); answered 24 vs 9; syllabus 0% vs 1%; chapter totals don’t add up. | One definition and one source per metric; always label the period. | LP-8–13 · LR-3 · LR-4 |
| LX-2 | S1 | Data | The report’s week choice doesn’t carry through: links keep this week, Back resets it, the URL doesn’t hold it; activity and program views use different day boundaries. | Range in the URL and in every link; Bangla-time days. | LR-1 · LR-2 · LR-22 |
| LX-3 | S2 | Navigation | Labels promise one place, links go to another: “কোর্স হোম” → batch routine; course link → an arbitrary first class; “কন্টিনিউ করো” → subject list; “ইনবক্স” → notices; “← রেজাল্ট” → paper. | Each label goes where it says. | LD-20 · LC-01 · LP-3 · LD-4 · LP-30 |
| LX-4 | S2 | Interaction | Dead affordances: pointer, hover and chevron, but nothing happens (course routine rows, subject cards, SuperPrep chapter rows). | Make them open something, or remove the click styling. | LC-03 · LC-04 · LP-5 |
| LX-5 | S2 | Navigation | No way forward or out in focus screens: no previous/next on desktop, class list hidden on mobile, no tab bar or logo on the mobile player and solution pages, back links that rely on history. | None stated. | LS-06 · LS-08 · LS-09 · LP-1 · LR-21 |
| LX-6 | S2 | Data | Notices: four counts (8, 7, 8, 17), two names (ইনবক্স / নোটিশ), and other classes’ notices shown to a Class 5 student. | None stated. | LD-3 · LD-4 · LD-41 |
| LX-7 | S2 | Accessibility | The mobile tab bar fails contrast on every page: 10 px #9CA3AF on white = 2.54:1. | None stated. | LD-7 · LF-06 · LR-9 |
| LX-8 | S2 | Accessibility | Controls without names: icon-only buttons (17 on the report alone), accordions without aria-expanded, the header envelope and back arrows as bare divs or SVGs. | None stated. | LR-14 · PDP-7 · LD-22 · LS-01 |
| LX-9 | S2 | Accessibility | Brand and grey text fail AA site-wide: greens #1CAB55 / #149353 at 3.0–3.9:1, greys 2.5–4.4:1, chart legends 1.6–3.6:1, setup pills 1.47:1. | One design-system fix. | PDP-8 · PDP-9 · LD-9 · LF-07 · LP-16–19 · LR-6–8 |
| LX-10 | S3 | Accessibility | The same browser title on 8 of 9 pages; no H1 on most pages. | None stated. | LF-04 · LD-24 · LC-11 · LS-04 · LR-13 |
| LX-11 | S2 | Consistency | Nothing is filtered to the student: 14 programs in the report and HSC notices for a Class 5 student. | None stated. | LR-17 · LD-41 |
| LX-12 | S4 | Navigation | Mobile-only routes (/inbox/, /more/) show a soft 404 on desktop. | None stated. | LD-1 · LD-2 · LF-01 |
| LX-13 ✱ | S3 | Consistency | No shared design system: card radius 4–32 px, padding 0–24 px, primary buttons 28–48 px tall, 3 greens, 3 near-blacks, 8 greys; different tabs, notice cards and “show more” on each page; তুমি vs আপনি; Bangla vs Latin digits. | None stated. | LG-01–06 · LD-16 · LD-30 · LC-19–21 · PDP-21 |
| LX-14 | S3 | Typography | Small text everywhere: 8–11 px labels on the dashboard, report and SuperPrep (mostly mobile). | 12 px floor for labels, 14 px for body. | LD-12 · LR-11 · LP-22 · LF-09 |

---
✱ = added or re-rated during review (design QA: spacing, colour, consistency; or a reviewer severity change). Severity scale and method: this file.
