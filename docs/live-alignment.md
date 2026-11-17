# Aligning the prototype with the live 10minuteschool.com

**Goal.** The segment page and the class page in this repo are a redesign of the 10 Minute School student journey. A student who leaves them for the live site's product page, cart or checkout should not feel they have moved to another website. So the prototype takes the live site's **skin**: page and card backgrounds, border (stroke) colour and width, brand greens, greys, corner radius, shadows, type and buttons. It keeps its own **layout and content**: sections, order, hierarchy, copy and behaviour stay as designed.

**Scope.** Frontend only: tokens in `src/styles/`, and component classes where a token can't do it. No data, routes, logic or copy changes.

**Source of truth.** Values measured on the live site on 17 Nov 2026 (computed styles, desktop 1440 and phone 390):

- the home page (`/`),
- the HSC academic listing (`/academic/10/?group=science`), which is the live page closest to our segment page,
- the HSC 27 product page (`/product/hsc-27-science-group-online-batch/`), which is the first step of the purchase journey.

The raw numbers are in [live-reference/live-styles-2026-11-17.json](live-reference/live-styles-2026-11-17.json) and the screenshots in [live-reference/shots/](live-reference/shots/). Earlier audit notes, including contrast measurements across the live site, are in [live-reference/audit/](live-reference/audit/). The `captures/…` paths inside those notes point to the original audit and are not included here.

---

## 1. What the live site looks like

The home page is dark (black and glass, a landing page). The academic and product pages, where the journey goes, are light. **Align with the light pages.**

| Property | Live value (light pages) | Notes |
|---|---|---|
| Page background | `#FFFFFF` | The academic and product pages are white; a few chips use `#F9FAFB` and `#F3F3F3` |
| Card background | `#FFFFFF` | |
| Card border | `1px #E5E7EB` | The most common stroke on both light pages (28–33 elements) |
| Shadow | none | No card shadows on the light pages (one faint `0 0 5px #E7EAF6`) |
| Card radius | `8px` on the academic page; `24px` and `38px` on the product page | |
| Button radius | `6px` (academic: "বিস্তারিত দেখো", "লগ-ইন"); pill `9999px` (product: "কোর্সটি কিনুন") | Academic buttons have a darker bottom edge (a 3D step) |
| Primary button | Fill `#1CAB55` (academic, login) or `#149353` (product CTAs), white text, 16px; height 44 on desktop, 36 on phone (academic) and 48 (product) | |
| Secondary button | White, `1px #E5E7EB`, `#111827` text, pill | Product page "সব দেখুন (12)" |
| Text, primary | `#111827` | |
| Text, body | `#4B5563` (academic), `#374151` / `#525252` (product) | |
| Text, secondary | `#6B7280` | |
| Text, muted | `#A3A3A3`, `#9CA3AF` | Both fail contrast (2.5:1); see section 3 |
| Brand greens | `#1CAB55` (links, login, academic buttons), `#149353` (product CTAs), `#16A34A` (BN/EN toggle) | Three greens in use |
| Header | 64px, white, logo · nav (ক্লাস ৫-১২, ইংলিশ, স্টোর, অন্যান্য) · search pill · BN/EN · "16910" in green · "লগ-ইন" green button, 6px radius, 32px tall | |
| Hero band | Dark navy `#172136` (academic), dark gradient (product) | Full width under the header |
| Font | Inter, then Anek Bangla | The same as ours. The product page also has stray Arial, Hind Siliguri and Saira; don't copy those |
| Type sizes | Body 14–16; H2 24 on desktop and 16–18 on phone; H1 36 on desktop and 21 on phone (product) | |

## 2. Token map: live value → our token

Our tokens live in `src/styles/primitives.css` (raw colours), `modes.css` (light, dark and warm roles), `brands.css` (the brand scale) and `theme.css` (the Tailwind mapping, radius and type scales). Change the **role** tokens in `modes.css` and the scales in `theme.css`. Don't recolour components one by one.

| Our token | Now | Live | Proposed | Status |
|---|---|---|---|---|
| `--color-bg` | `#F6F7F9` (gray-50) | `#FFFFFF` | Open: `#FFFFFF`, or keep a light grey (see Q1) | Decide |
| `--color-surface` | `#FFFFFF` | `#FFFFFF` | Same | Matches |
| `--color-raised` | `#F9FAFB` | `#F9FAFB` (chips) | Same | Matches |
| `--color-border` | `#E7E9EE` | `#E5E7EB` | `#E5E7EB` | Change |
| `--color-border-strong` | `#D5D9E0` | `#DBE1EB` (rare) | Keep | Matches closely |
| `--color-text` | `#111827` | `#111827` | Same | Matches |
| `--color-muted` | `#4B5563` | `#4B5563` | Same | Matches |
| `--color-subtle` | `#6B7280` | `#6B7280` | Same | Matches |
| `--color-brand` (fills, icons, progress) | `#1CAB55` | `#1CAB55` | Same | Matches |
| `--color-brand-text` (green text, links) | `#18763B` | `#1CAB55` / `#149353` | `#12884D` | Change (rule 3.1) |
| `--color-primary` (primary button fill) | `#18763B` | `#1CAB55` / `#149353` | `#12884D` | Change (rule 3.1) |
| `--color-primary-hover` | `#155F2F` | n/a | about 10% darker than `#12884D` | Change |
| `--shadow-card` | soft two-layer shadow | none | `none` (cards rely on the border) | Change |
| `--radius-md` / `--radius-lg` (cards) | 10 / 16px | 8px (academic) | Open (see Q2) | Decide |
| Button radius | per component | 6px (academic) or pill (product) | Open (see Q2) | Decide |
| Fonts | Inter + Anek Bangla | Inter + Anek Bangla | Same | Matches |

Most greys and text colours already match. **The visible differences are the page background, card shadows, card and button radius, and the button green.**

## 3. Rules

### 3.1 Green (the designer's rule, 17 Nov 2026)
- **Fills, icons, progress, accents:** the live `#1CAB55`, exactly.
- **Green text, and green buttons with white text:** look like the live green but stay readable at 4.5:1 or more. Use **`#12884D`** (4.51:1 on white). It is the live CTA green `#149353`, darkened just enough to pass.
  - Not `#1CAB55` (3.00:1) or `#149353` (3.94:1): both fail AA for text, which the live audit flagged (LX-9).
- Don't add a fourth green.

### 3.2 Greys and muted text
- Use only `--color-text`, `--color-muted` and `--color-subtle`. These are the live `#111827`, `#4B5563` and `#6B7280`.
- Don't copy the live `#A3A3A3` or `#9CA3AF` for text (2.5:1).

### 3.3 Strokes and surfaces
- Cards: white, a `1px var(--color-border)` stroke (`#E5E7EB`), no shadow.
- Pop-ups and sheets keep `--shadow-pop`. The live site has none, but a floating layer needs to read as floating.
- No double strokes. Where a card sits inside a card, the inner one uses `--color-raised` with no stroke, or a stroke with no fill.

### 3.4 Buttons
- Heights: 44px on desktop and 40–48px on phone for primary actions; 32–36px for small ones.
- Text 16px, weight 500–600.
- Radius and edge follow Q2 once decided.

### 3.5 What we keep from our design
Layout, section order, the folder and book illustrations, the class tiles and their coloured bands, the subject colours, the TenTen and SuperPrep marks, the copy (তুমি form), the motion and the dark mode. These are content and identity, not skin.

### 3.6 What we don't take from the live site
- The dark glass styling of the live home page.
- Stray fonts (Arial, Hind Siliguri, Saira).
- Text colours that fail contrast.
- Inconsistencies the live audit lists (`audit/visual-consistency.md`, LG-03 and LG-04).

## 4. Open questions (decide before changing tokens)

- **Q1. Page background.** Live is white everywhere. Our pages put white cards on a light grey.
  - Option A: white page, with cards separated by their `#E5E7EB` stroke, like live.
  - Option B: keep a very light grey (`#F9FAFB`) so cards still lift on phones.
- **Q2. Radius and button shape.** The live academic page, closest to ours, uses 8px cards and 6px buttons with a darker bottom edge. The product page uses pills and 24px cards. Option A: follow the academic page for the segment page and class page, and keep the product page's pill only for buy buttons.
- **Q3. Hero band.** Should the segment page's top (the batch title card) become a full-width dark navy band (`#172136`), as on the live academic page, or stay a white card?

## 5. How to work

1. **Tokens first.** Change role tokens in `src/styles/modes.css` (light mode) and the scales in `theme.css`. Rebuild and look.
2. **Components only where a token can't reach.** Examples: a button's bottom edge, a card's radius class. Fix it in the design-system component (`src/design-system/`), not in a page.
3. **Both sizes.** Every change is checked on desktop 1440 and phone 390.
4. **Compare side by side.** Screenshot our page and the matching live page at the same width, and check background, strokes, green, radius, shadows and type in that order.
5. **Contrast.** Any text colour change is checked against its background (4.5:1, or 3:1 for 18px+ bold and for icons).
6. **Record it.** Tick the checklist below and note what changed in the commit message.

## 6. Checklist

| Area | Background | Stroke | Green | Radius | Shadow | Type | Checked on both sizes |
|---|---|---|---|---|---|---|---|
| Header (guest) | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Segment page: batch card / hero | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Segment page: তোমার জন্য ফ্রি (rows, uploads, folders) | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Segment page: subjects, free course, offers, masterbooks, English courses | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Segment page: footer sections | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Login pop-up | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Class page: list panel, player, PDF reader | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Buttons (primary, secondary, small) | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
