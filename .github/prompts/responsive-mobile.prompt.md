---
description: Audit and fix mobile responsiveness across the CalStory app — layouts, forms, charts, navigation, and touch targets.
mode: agent
---

# Make CalStory mobile-responsive

The goal is to make every page in the CalStory Next.js app usable on phone-sized
screens (320 – 480 px wide) **without breaking the existing desktop layout**.
This is an incremental, page-by-page pass — do NOT attempt a single big-bang
rewrite.

> **Before doing anything else**, read `.github/instructions/architecture.instructions.md`
> to load the project conventions (state, forms, AI flows, design tokens, etc.).
> Then re-read the file paths listed in the **Audit pass** section below.

---

## 1. Target breakpoints

Use Tailwind v4's default scale (the project's only breakpoint configuration):

| Prefix | Min width | Use for |
|---|---|---|
| _(none)_ | 0 – 639 px | Phone-first base styles |
| `sm:` | 640 px | Large phone / small tablet |
| `md:` | 768 px | Tablet portrait |
| `lg:` | 1024 px | Tablet landscape / small laptop |
| `xl:` | 1280 px | Desktop |
| `2xl:` | 1536 px | Wide desktop |

CalStory's primary breakpoint is `md:`. Desktop features (sidebar nav, multi-column
grids) should appear at `md:` and up; phone users should get a single-column,
vertically-stacked experience with the bottom tab bar.

---

## 2. Audit pass

Run these reads in parallel before touching any file:

1. [app/layout.tsx](app/layout.tsx) — root shell, font variables, theme pre-paint script.
2. [app/(app)/layout.tsx](app/(app)/layout.tsx) — **note the `lg:pl-[240px]` / `lg:pl-20`
   left padding**. Below `lg:` there should be zero left padding so the bottom
   tab bar's content can use full width. Confirm this is what happens today.
3. [app/components/PillNav.tsx](app/components/PillNav.tsx),
   [app/components/BottomNav.tsx](app/components/BottomNav.tsx) — confirm the
   desktop sidebar (`PillNav` in "floating" style) is hidden on mobile and the
   `BottomNav` is the phone navigation.
4. Every page under `app/(app)/`:
   - [dashboard/page.tsx](app/(app)/dashboard/page.tsx)
   - [nutrition/page.tsx](app/(app)/nutrition/page.tsx)
   - [workouts/page.tsx](app/(app)/workouts/page.tsx)
   - [progress/page.tsx](app/(app)/progress/page.tsx)
   - [settings/page.tsx](app/(app)/settings/page.tsx)
   - [settings/nutrition/page.tsx](app/(app)/settings/nutrition/page.tsx)
5. Every form / input component:
   - [app/components/DetailedMealForm.tsx](app/components/DetailedMealForm.tsx)
   - [app/components/WorkoutForm.tsx](app/components/WorkoutForm.tsx)
   - [app/components/RecipeForm.tsx](app/components/RecipeForm.tsx)
   - [app/components/ManualFoodEntry.tsx](app/components/ManualFoodEntry.tsx)
   - [app/components/InlineFoodSearch.tsx](app/components/InlineFoodSearch.tsx)
   - [app/components/EditProfileModal.tsx](app/components/EditProfileModal.tsx)
   - [app/components/nutrition/ai-chat-logger.tsx](app/components/nutrition/ai-chat-logger.tsx)
   - [app/components/nutrition/ai-workout-logger.tsx](app/components/nutrition/ai-workout-logger.tsx)
6. Charts (responsive chart options needed):
   - any file matching `app/components/progress/**.tsx`
7. [app/components/FAB.tsx](app/components/FAB.tsx) and [app/components/LenisProvider.tsx](app/components/LenisProvider.tsx).
8. Landing pages (`app/page.tsx`, `app/cta.tsx`, `app/footer.tsx`,
   `app/components/landing/**`).
9. `tailwind.config.*` / `app/globals.css` — note the project already uses
   Tailwind v4 with `@custom-variant dark (&:is(.dark *))`. Don't introduce a
   separate Tailwind config; use `@custom-variant` / `@utility` blocks instead
   if you need a new breakpoint or utility.

For each file, log a one-line **finding** in the form:
`path:Lstart-Lend — <what breaks on mobile>`.

---

## 3. Per-file fix recipes

Use the patterns below when fixing. **Apply only the patterns that match the
finding — don't refactor unaffected code.**

### 3a. Multi-column → stacked

```tsx
// Before
<div className="grid grid-cols-3 gap-4">

// After
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
```

If columns 1 and 2 already look fine on mobile but column 3 needs more room,
use `sm:grid-cols-2 lg:grid-cols-3` instead — only break the layout at the
width where the third column actually fits.

### 3b. Row → column on small screens

```tsx
// Before
<div className="flex items-center justify-between gap-4">

// After
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
```

### 3c. Forms: stack inputs

Forms should always use a single column under `md:`. The grid `md:grid-cols-2`
pattern is already used in `DetailedMealForm` / `WorkoutForm` — keep using it,
but verify that **every** new field you encounter is wrapped in the same
`grid-cols-1 md:grid-cols-2` container.

For input width, use `w-full` instead of fixed `w-[NNNpx]` whenever possible.
If a fixed width is required (e.g. a small numeric cell), keep it on desktop
but ensure the row it's in either flexes or scrolls horizontally.

### 3d. WorkoutForm sets × reps × kg

The 3-column sets table in [app/components/WorkoutForm.tsx](app/components/WorkoutForm.tsx)
(`Set / Reps / Kg`) is narrow on phones. Options:

- **Preferred:** keep the table on all sizes but reduce horizontal padding
  (`px-2` → `px-1.5`) and shrink the numeric input placeholder text.
- **Alternative:** if the table doesn't fit at < 360 px, allow the row to
  scroll horizontally inside the exercise card with `overflow-x-auto`.
- **Never:** hide the Kg column on mobile — sets × reps × kg are the whole
  point of resistance logging.

### 3e. Charts

Chart.js (via `react-chartjs-2`) needs explicit `responsive: true` and a
non-zero parent height. Audit each chart wrapper:

```tsx
<div className="relative w-full h-48 sm:h-64 md:h-80">
  <Line data={data} options={{ responsive: true, maintainAspectRatio: false }} />
</div>
```

The current `progress/*` charts render at fixed pixel heights — convert them
to a mobile-friendly scale. Legend / tooltip layout: use Chart.js
`plugins.legend.position = "bottom"` so labels don't get clipped on narrow
screens.

### 3f. Heatmap

The GitHub-style heatmap in
[app/components/progress/ConsistencyHeatmap.tsx](app/components/progress/ConsistencyHeatmap.tsx)
likely overflows on phones. If the cell size is fixed, wrap the heatmap in a
horizontally-scrollable container:

```tsx
<div className="overflow-x-auto -mx-4 px-4">
  {/* heatmap */}
</div>
```

Or shrink cells at `sm:` so the whole year fits in the viewport.

### 3g. Bottom tab bar

[BottomNav.tsx](app/components/BottomNav.tsx) is already mobile-first. Verify
that:

- It is hidden on `md:` and up (or rendered transparently above the
  sidebar's `lg:` breakpoint).
- Its `paddingBottom: "96px"` reserve on `<main>` in `(app)/layout.tsx`
  still applies at every breakpoint — not only mobile.
- Touch targets are ≥ 44 px tall.

### 3h. FAB

The dashboard FAB ([FAB.tsx](app/components/FAB.tsx)) is shown only on
`/dashboard`. Check its position: it should sit above the bottom tab bar on
mobile (`bottom-24` or similar) and in the natural corner on desktop. Don't
let it overlap tab-bar items.

### 3i. Modals → drawer on mobile

Any modal built with the shadcn `Dialog` primitive should switch to a
bottom-sheet-style layout under `md:`. The shadcn `Sheet` component
(`app/components/ui/sheet.tsx`) is already installed — use it:

```tsx
<Sheet open={open} onOpenChange={setOpen}>
  <SheetContent side="bottom" className="md:max-w-md md:mx-auto md:rounded-t-2xl">
    {/* content */}
  </SheetContent>
</Sheet>
```

### 3j. Inputs that open keyboards

`type="number"` is fine. `type="email"` / `type="tel"` set the right mobile
keyboard. **Do not** add `inputMode` unless you've measured a real keyboard
problem; the default is correct.

### 3k. Touch targets

Audit every clickable element (`<button>`, clickable `<div>`, icon-only
buttons). Anything smaller than 44 × 44 px on mobile is too small.

```tsx
// Before
<button className="p-1"><Trash2 className="w-4 h-4" /></button>

// After
<button className="p-2 sm:p-1.5"><Trash2 className="w-5 h-5 sm:w-4 sm:h-4" /></button>
```

### 3l. Text overflow

Long workout names / food names will truncate ugly on mobile. Use
`truncate` + `min-w-0` on the flex parent, or `break-words` where truncation
is wrong (e.g. notes):

```tsx
<div className="flex items-center gap-2 min-w-0">
  <span className="truncate">{workout.name}</span>
</div>
```

---

## 4. CalStory-specific gotchas

These are the highest-impact things to look for, based on the current
architecture:

1. **`(app)/layout.tsx` reserves desktop sidebar width at `lg:` only.**
   Confirm phones get `padding-left: 0`. If something looks mis-padded on
   mobile, the left padding is the first thing to check.

2. **The dashboard hero (`CalorieHero`, `MacroBars`, `MacroPills`) and the
   macro grid in [nutrition/page.tsx](app/(app)/nutrition/page.tsx)**
   both use multi-column grids — they MUST collapse to one column under `md:`.

3. **The workouts page has a tab strip + button row that can wrap awkwardly
   on small screens.** Use `flex flex-col sm:flex-row` + `gap-3` so the row
   stacks cleanly on phones.

4. **The AI chat loggers** ([ai-chat-logger.tsx](app/components/nutrition/ai-chat-logger.tsx),
   [ai-workout-logger.tsx](app/components/nutrition/ai-workout-logger.tsx))
   have a fixed 400 px message thread — this is fine on phones (it will
   scroll), but make sure the input row doesn't get squeezed off-screen.

5. **Confirmation cards** ([meal-confirmation-card.tsx](app/components/nutrition/meal-confirmation-card.tsx),
   [workout-confirmation-card.tsx](app/components/nutrition/workout-confirmation-card.tsx))
   use gradient backgrounds and chip lists. Chips should wrap freely
   (`flex flex-wrap gap-1.5`) — verify they do.

6. **The `DetailedMealForm` macro auto-calc** uses two `useEffect`s that
   listen to each other. Don't touch them — they're correct — but make sure
   the inputs they control are full-width on mobile so users can see all
   three (cal/p/c/f) at once without horizontal scroll.

7. **`PillNav` floating sidebar** uses 240 px width — this overflows on a
   320 px phone if the breakpoint logic is wrong. Make sure it's hidden
   below `lg:`.

8. **Charts in [progress/](app/components/progress/)** — pick them up under
   §3e. Most likely they need a parent with explicit height and
   `maintainAspectRatio: false`.

---

## 5. Order of operations

1. Run the audit (§2) and produce a list of findings. **Don't write code yet.**
2. Fix the `(app)/layout.tsx` padding first if it's broken — every page
   inherits from it.
3. Fix shared chrome: `BottomNav`, `PillNav`, `FAB`.
4. Fix the form components next (`DetailedMealForm`, `WorkoutForm`,
   `RecipeForm`). These show up in multiple pages so unblocking them
   unblocks everywhere.
5. Fix page-by-page: dashboard → nutrition → workouts → progress → settings.
6. Fix the AI chat panels + confirmation cards.
7. Run `npx tsc --noEmit` after each page; never leave the build red.
8. Smoke-test each page at 375 × 812 (iPhone 14) and 320 × 568 (iPhone SE)
   widths in the browser dev-tools device toolbar.

---

## 6. Anti-patterns — do NOT do these

- ❌ Don't introduce `sm:flex-row` on the **root** of a page layout. Stack
  vertically first; only go horizontal at `md:` if it actually looks better.
- ❌ Don't add a separate `mobile.tsx` / `desktop.tsx` pair. Use responsive
  Tailwind classes — they're already loaded.
- ❌ Don't change the design tokens, fonts, or color palette. Mobile
  responsiveness is layout, not redesign.
- ❌ Don't hide the kg column in `WorkoutForm` on mobile.
- ❌ Don't replace the desktop sidebar with a hamburger menu. The bottom
  tab bar is the mobile nav.
- ❌ Don't use `100vh` — it causes overflow on iOS Safari. Use `100dvh`
  (already used in `(app)/layout.tsx`) or `min-h-[100svh]`.
- ❌ Don't write per-component `useEffect` listeners for `resize` to swap
  layouts — Tailwind handles this with CSS only.
- ❌ Don't add new dependencies (e.g. `react-responsive`) — Tailwind
  utilities are sufficient.
- ❌ Don't touch the form's logic or save flow. Mobile responsiveness is
  visual / layout only.

---

## 7. Definition of done

For each page:

- [ ] At 320 px width, no horizontal scroll on the page itself.
- [ ] All inputs and buttons have ≥ 44 px touch targets.
- [ ] Charts render without clipping and don't require horizontal scroll.
- [ ] Modals become bottom sheets on mobile.
- [ ] Dark mode still works (no `light:` / `dark:` inversions introduced).
- [ ] `npx tsc --noEmit` passes.
- [ ] Existing tests / lint pass (or note any regressions explicitly).

Once a page passes the checklist above, move to the next one. Stop and ask
for clarification only if you encounter a layout that genuinely requires a
design decision (e.g. "should the macro grid become 2 columns at `sm:` or
stay 1 column until `md:`?") — otherwise, pick the option that matches the
file's existing breakpoint convention.