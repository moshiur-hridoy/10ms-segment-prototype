# Project notes for Claude

## What this repo is
A standalone prototype of the 10 Minute School HSC student journey. It covers the segment page (`/bn/hsc/hsc-28`) → a subject → the class page (`/bn/subject/<paper>`), where classes play (YouTube) and class materials (PDF) open and download.

It was split off on 17 Nov 2026 from the design repo where it was built, as that repo's "segment-page v7" and "LX v75". There are no lab versions here: the code's lab gates are pinned to those versions by `readLab` in `src/lib/lab-version.ts`, which treats a missing `?lab=` as `on`. Don't add version switches. The one exception is the designer's **New UI / Old UI** toggle (bottom-right; `?ui=old` or `?ui=new` in a link): new is the live-aligned skin and the default, old is the look before the alignment. It switches tokens only (`data-skin` on `<html>`, `src/styles/modes.css`, `src/lib/skin.ts`); new design work goes into the new skin.

Stack: Next.js 16 (App Router, Turbopack, `cacheComponents`), React 19, Tailwind 4, TypeScript. All data is local JSON in `src/data/snapshot` and `src/data/new`, loaded through `src/lib/api`. There is no backend and no env vars.

Run it with `npm install`, then `npm run dev` (or `npm run build && npm start`), and open `/bn/hsc/hsc-28?stream=science`.

## Current goal: look like the live site
Align the frontend with the live 10minuteschool.com, so a student moving from these pages to the live product page, cart or checkout feels it is one website. **The design system here is a twin of the live site's skin**, and every new change follows it. **Read [docs/live-alignment.md](docs/live-alignment.md) before any design change.** It has the measured live values, the token map, the rules and the designer's decisions.

- **Skin, not layout.** Change backgrounds, strokes, greens, greys, radius, shadows, type and buttons. Keep the layout, sections, content and behaviour.
- **Tokens first.** Change role tokens in `src/styles/modes.css` and the scales in `src/styles/theme.css`. Change a component in `src/design-system/` only when a token can't do it. Never hard-code colours in pages.
- **Live values only.** Every value comes from the live site (`docs/live-reference/`) or from a rule in the guideline. Don't invent colours. If a value isn't measured, measure it on the live site first.
- **Green rule.**
  - Fills and icons use `#1CAB55`.
  - Green text, and green buttons with white text, use `#12884D` (the live CTA green, darkened to pass 4.5:1).
- **Decisions are recorded.** Q1–Q3 are decided in section 4 of the guideline. Anything new that isn't covered there is the designer's call; ask first.
- **Both sizes.** Every change is checked on desktop 1440 and phone 390, side by side with the matching live page.
- **Frontend only.** No changes to data, routes, logic or copy unless the designer asks.

## Working with the designer
- **Ideas before code.** For a design change, propose options with a recommendation, and build after the designer picks.
- **Copy.** Bangla UI uses the তুমি form ("কেনো", not "কিনুন").
- **Commits.** Commit each finished step with a clear message. Push only when asked.
- **Privacy.** This repo is public. Never add real student names, phone numbers, emails or tokens.
