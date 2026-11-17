# Design system

Atomic structure: every visual piece of the product lives here, one folder per component, sorted by tier. The same names will be used in Storybook and the Figma library, so a change to one Figma component maps to one folder.

```
foundations/   JS token maps (tones, book colours, subject icons). CSS tokens stay in src/styles.
motion/        Page and navigation motion (no visuals of their own).
atoms/         Smallest pieces: Button, Badge, Card, ProgressBar/Ring, Avatar …
molecules/     Atoms combined: SectionCard, Select, ClassRow, TaskTile, NoticeList …
organisms/     Whole sections, grouped by area: header/, dashboard/
templates/     Page layouts with empty slots: DashboardTemplate
registry.ts    The list of every component (name, path); Figma ids join it later.
```

A component folder holds `<name>.tsx` and an `index.ts`. Import the folder: `@/design-system/atoms/button`.

## Rules (enforced by `design-system.test.ts`)

- **Imports point down.** An organism may use molecules and atoms; an atom may not use a molecule. Within a tier is fine.
- **No data loading.** Components get everything through props. Importing types from `@/lib/api` or `@/i18n` is fine; calling `getX()`, `createDataContext` or `getDictionary` is not.
- **No product code.** Nothing here imports from `src/features`, `src/components` or `src/app`.
- **Registry in step.** Every component folder is listed in `registry.ts`, and every entry has a folder.

## Where data comes in

`src/features/<page>/` holds containers: a container loads its data, then renders one organism. For the dashboard, `features/dashboard/config.ts` lists which section goes in which column and in what order; to hide or move a section, edit that list.

```
app/(app)/[lang]/page.tsx    page: fills DashboardTemplate from the config
features/dashboard/notices   container: getNotices() → <NoticesCard items fmt …/>
organisms/dashboard/notices-card   view: props only
```

## Adding or changing a component

1. Pick the lowest tier it fits. Create `tier/<name>/<name>.tsx` and `index.ts` (`export * from "./<name>";`).
2. Add it to `registry.ts`.
3. If it needs data, write or extend a container in `src/features`, never inside the component.

Other pages (course, subject, report, SuperPrep, library) still keep their own components in `src/components/<page>`; they move here page by page.
