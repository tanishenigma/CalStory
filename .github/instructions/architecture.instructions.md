---
applyTo: "**/*.{ts,tsx}"
description: CalStory architecture & coding conventions — state, auth, data, AI, UI, forms.
---

# CalStory Architecture Reference

CalStory is a Next.js 16 (App Router) + React 19 + TypeScript 6 app for tracking
meals, workouts and weight. Firebase Auth + Firestore is the system of record;
the Gemini API powers two chat-based loggers (food & workout); Tailwind v4 with
shadcn primitives does styling. Read this before adding or modifying code.

> **Framework note** — `next@16.2.7`, `react@19.2.4`, `typescript@6.0.3`,
> `tailwindcss@4.3.0` are recent majors. Conventions from older training data
> may be wrong (e.g. `next/router` is gone, `next/navigation` is the only
> router, the App Router uses route groups `(app)`, etc.). When in doubt,
> check `node_modules/next/dist/docs/` and the actual installed types.

---

## 1. Top-level layout

```
app/                     Next.js App Router root
  layout.tsx             Root HTML shell — fonts, AppProvider, Toaster, theme pre-paint
  page.tsx               Landing page (public)
  cta.tsx / footer.tsx   Landing-only sections
  (app)/                 Authenticated route group
    layout.tsx           PillNav / BottomNav / FAB + page chrome
    dashboard/page.tsx
    nutrition/page.tsx
    workouts/page.tsx
    progress/page.tsx
    settings/{page,nutrition}/page.tsx
  onboarding/page.tsx    First-time profile setup
  api/                   Server-only route handlers (Gemini proxy, FatSecret proxy)
  components/            Reusable UI (forms, cards, nav, animations)
  components/ui/         shadcn primitives (do NOT hand-edit; rerun shadcn CLI)
  components/{nutrition,progress,landing}/  Feature-specific components
  components/animations/ Framer/GSAP wrappers
  context/AppContext.tsx The single source of truth for app data
  hooks/                 Custom hooks (useAuthGuard, useStreak)
  lib/                   Pure utilities + Firebase + FatSecret + Gemini wrappers
  store/                 Zustand stores (auth, prefs)
  types.ts               All shared TypeScript types — ADD new types here
docs/                    Design docs / implementation plans
public/                  Static assets
```

Path alias `@/*` maps to the project root (see [jsconfig.json](jsconfig.json)).
Always import via the `@/` alias — never with relative `../../../` chains.

---

## 2. State management — the three layers

There are exactly three places state can live. Pick deliberately:

| Layer | When to use | Examples |
|---|---|---|
| **Firestore** (system of record) | Anything that must survive across devices & users | Profile, meals, workouts, templates, weight logs |
| **`useApp()` context** | The hydrated in-memory copy of the Firestore data that components read/mutate | `state.profile`, `state.meals[day]`, `addMeal()` |
| **Zustand store** | Cross-cutting UI prefs and auth that don't belong in Firestore | `useAuthStore` (user), `usePrefsStore` (theme, navbar style) |
| **`localStorage`** | Only via `lib/storage.ts` helpers — user-scoped cache of Firestore data + raw prefs | `getUserKey(uid, ...)`, `LS.get/set` |

### 2a. `useApp()` is the read/write API for app data

```ts
import { useApp } from "@/app/context/AppContext";
const { state, addMeal, addWorkout, setProfile, logWeight, saveTemplate } = useApp();
```

- `state` is an `AppState` (see [app/types.ts](app/types.ts)): `{ profile, meals, workouts, savedWorkouts, recents, weightLogs, selDate }`.
- Date-keyed data (`meals`, `workouts`) is `Record<YYYY-MM-DD, T[]>`. Always read with `state.meals[selDate] ?? []`.
- All mutations are optimistic: they update local state immediately and fire-and-forget the Firestore write. Reads are hydrated once at boot.
- New domain entities **must** be added as (1) a type in [types.ts](app/types.ts), (2) a DB helper in [db.ts](app/lib/db.ts), (3) reducer cases + exposed actions in [AppContext.tsx](app/context/AppContext.tsx), (4) hydration in `AppProvider`.

### 2b. Zustand stores

- [`store/authStore.ts`](app/store/authStore.ts): holds `{ user, loading }`. The Firebase `onAuthStateChanged` listener is attached exactly once via `initAuthListener()` (called from `AppProvider`).
- [`store/prefsStore.ts`](app/store/prefsStore.ts): holds `{ navbarStyle, theme }`. Both are persisted to `localStorage` (per-user when authenticated, guest key otherwise). `hydratePrefs(uid)` is called when the user logs in/out to swap scopes.
- Stores **must not** hold domain data — keep that in Firestore + Context.

### 2c. Hooks

- `useAuthGuard()` in [hooks/useAuthGuard.tsx](app/hooks/useAuthGuard.tsx): the canonical "I'm in an authenticated page" guard. It blocks on `loading || profile === undefined`, redirects to `/` if no user, redirects to `/onboarding` if `profile` is `null` or missing `onboardedAt`. **Use this in every page under `(app)/`** instead of writing bespoke auth checks.
- Custom hooks go in `app/hooks/`. Co-locate feature-specific hooks with the component that uses them only if they're not reusable.

---

## 3. Auth flow

1. `app/layout.tsx` mounts `AppProvider` → calls `initAuthListener()` once.
2. `useAuthStore` fires `loading: false` and resolves `user` on the first `onAuthStateChanged`.
3. `AppProvider` then hydrates from Firestore (profile, meals, workouts, …) via `getProfile` / `getMeals` / etc.
4. Each page calls `useAuthGuard()` to gate rendering. While `isLoading`, render `<Spinner />`.

**Never** gate a page with a hand-rolled `useEffect(() => router.replace("/"))` — always go through `useAuthGuard`.

---

## 4. Data model (canonical types)

All shared types live in [app/types.ts](app/types.ts). When you add a domain entity, **add the type here first**, then mirror it through DB / context.

Key types and their invariants:

- **`Profile`** — canonical weight/height stored in **kg / cm** regardless of display unit. `dob` (YYYY-MM-DD) is the source of truth for age; `age` is derived on read. `onboardedAt` (Unix-ms) marks a fully-completed onboarding and is what `useAuthGuard` checks for.
- **`Meal`** — keyed under `meals[day][i]`. `time ∈ "breakfast" | "lunch" | "dinner" | "snack"`. `savedDate` is the calendar day the meal was actually logged (for streak integrity when backdating).
- **`Workout` / `Exercise`** — see the **Workout schema** section below.
- **`SavedWorkout`** — reusable template, mirrors `Workout` minus `duration` and `notes`.
- **`WeightLog`** — always kg internally; `weightUnit` records the display unit the user was on at log time.
- **`MealTime`, `GoalKey`, `IntensityKey`, `Gender`, `WeightUnit`, `HeightUnit`** — string unions, exported.

### Workout schema (post-refactor)

The workout form is schema-driven — DO NOT hardcode field lists per type.

- `WORKOUT_TYPES` and `WORKOUT_METRIC_KEYS` map each workout type to its optional metric block key (`"cardio" | "hiit" | "yoga" | "pilates" | "crossfit" | "powerlifting" | "flexibility" | "sports" | "other" | null`).
- `WORKOUT_METRIC_SCHEMAS` is the single source of truth for which fields appear for each type (`{ key, label, kind: "number" | "text", placeholder }[]`).
- `Exercise` shape:
  ```ts
  sets?: { reps: number; kg: number; note?: string }[]   // Resistance / Powerlifting / CrossFit / HIIT
  durationMin?: number;                                 // any type
  metrics?: ExerciseMetrics;                            // per-type metric block
  // + legacy `reps?: number[]` / `kg?: number` for backwards compatibility with old records
  ```
- When extending: add a new `ExerciseMetrics` subtype in types.ts, then add it to `WORKOUT_METRIC_KEYS` and `WORKOUT_METRIC_SCHEMAS`. The form, workouts list, and AI confirmation card will pick it up automatically.

---

## 5. Forms

All form components follow the same shape:

1. `"use client"` at the top.
2. `useApp()` for reads/writes.
3. `toast.warning(...)` / `toast.success(...)` from `sonner` for inline validation feedback (see [app/lib/use-food-chat.ts](app/lib/use-food-chat.ts) for usage).
4. Local state mirrors the in-progress entity; `handleSave` parses strings to numbers and pushes to context.
5. Forms close themselves on success (`onClose()`), and reset their state.

Existing canonical forms to mirror:

- [app/components/DetailedMealForm.tsx](app/components/DetailedMealForm.tsx) — meal entry with auto-calc between calories and macros.
- [app/components/WorkoutForm.tsx](app/components/WorkoutForm.tsx) — workout entry, schema-driven metric fields, "Quick log" toggle for name-only logging.
- [app/components/RecipeForm.tsx](app/components/RecipeForm.tsx) — recipe builder.

---

## 6. AI integration (Gemini)

Two symmetric chat flows live in `app/api/`:

- [`ai-log-food/route.ts`](app/api/ai-log-food/route.ts) → paired with [`use-food-chat.ts`](app/lib/use-food-chat.ts) and [`ai-chat-logger.tsx`](app/components/nutrition/ai-chat-logger.tsx).
- [`ai-log-workout/route.ts`](app/api/ai-log-workout/route.ts) → paired with [`use-workout-chat.ts`](app/lib/use-workout-chat.ts) and [`ai-workout-logger.tsx`](app/components/nutrition/ai-workout-logger.tsx).

Pattern:

1. The route accepts `{ message, conversationHistory, userId, date }`.
2. The server prompt enforces **strict JSON-only** output (no markdown fences) matching a `PendingMeal` / `PendingWorkout` shape.
3. The route strips accidental code fences, parses, and returns the typed shape. On parse failure it returns a friendly fallback `{ type: "error", ... }` rather than 500ing.
4. The client hook maintains `messages: ChatMessage[]`, derives `pendingMeal` / `pendingWorkout` via a reverse-scan `useMemo`, and exposes `sendMessage`, `confirmLog`, `reset`.
5. A confirmation card (`meal-confirmation-card.tsx`, `workout-confirmation-card.tsx`) renders the parsed payload and gives the user **Edit** / **Log** actions. The Edit action converts the pending shape back into the form's initial state.

When extending:

- New AI features should follow this route → hook → logger → confirmation-card pipeline. Don't call the Gemini SDK directly from components.
- `GEMINI_API_KEY` is read from env on the server only. Always handle the missing-key case with the same "AI not configured" fallback shape.

---

## 7. External services

- **Firebase**: configured in [app/lib/firebase.ts](app/lib/firebase.ts). Reads `NEXT_PUBLIC_FIREBASE_*` env vars. Singleton app via `getApps()[0]`. Exports `auth`, `db`, `googleProvider`.
- **Firestore rules**: [firestore.rules](firestore.rules) restrict all reads/writes to `request.auth.uid == uid` under `/users/{uid}/**`. **Never** put user data outside `/users/{uid}/` — the rules will deny it.
- **FatSecret** (food search): wrapped in [app/lib/fatsecret.ts](app/lib/fatsecret.ts). OAuth client-credentials flow with in-memory token cache. The proxy route is [`api/food/search/route.ts`](app/api/food/search/route.ts), which falls back to Fuse.js fuzzy matching for multi-word queries. All requests are logged to `api.log` via [app/lib/logger.ts](app/lib/logger.ts).
- **Gemini**: see §6.

---

## 8. UI conventions

- Tailwind v4 with CSS-first config — see [app/globals.css](app/globals.css). Custom `@utility` blocks for project-specific classes (`text-muted-foreground-foreground`, `num`, `font-bricolage`, …). Brand color tokens (`--color-ink`, `--color-bg`, …) are defined in `@theme`; reuse them via Tailwind utilities (`bg-card`, `text-muted-foreground`, …).
- Fonts: `Instrument Sans` (`font-instrument`), `Bricolage Grotesque` (`font-bricolage`), `DM Mono` (numeric / code-y). Loaded via `next/font/google` in `app/layout.tsx`.
- shadcn primitives live under `app/components/ui/`. **Don't hand-edit them**; rerun the shadcn CLI to regenerate.
- Custom components that wrap multiple primitives (`Card`, `BottomNav`, `PillNav`, `ToastContainer`, `BorderGlow`, `GSAPModal`, `BlurFade`, `LenisProvider`) live in `app/components/`.
- **Toasts** come in two flavors:
  - `useToast()` from [app/components/ToastContainer.tsx](app/components/ToastContainer.tsx) — in-app toast stack, returns `(msg, icon?) => void`. Use this for action feedback in pages.
  - `toast` / `toast.warning` / `toast.success` from `sonner` — bottom-right transient notifications. Used inside forms / hooks. Both are wired up in `app/layout.tsx`.
- **Animations**: GSAP (`GSAPModal`), Framer Motion (`motion`, `AnimatePresence` — see `PillNav.tsx`), Lenis for smooth scroll (`LenisProvider`). Prefer Framer for simple enter/exit; GSAP for timeline-based sequences.
- Icons: `lucide-react` only (`@1.18.0` — note this is the modern API, not the legacy `lucide-react@0.x`).

---

## 9. Naming & file conventions

- **Files**: `PascalCase.tsx` for components (e.g. `DetailedMealForm.tsx`); `camelCase.ts` for utilities/hooks/stores; route folders are lowercase (`api/`, `dashboard/`).
- **Components**: one default-export per file. File name = component name.
- **Types**: domain types in [app/types.ts](app/types.ts). Local props in the same file as the component.
- **Imports**: use the `@/` alias; use `import type { Foo } from "@/app/types"` for types (ESLint enforces `consistent-type-imports`).
- **No barrel files** (`index.ts` re-exports) — they confuse tree-shaking and Next.js route inference. Import from the source file directly.
- **`@/`** aliases: components `@/components`, ui `@/components/ui`, lib `@/lib`, hooks `@/hooks` (per `components.json`). But the actual project uses `@/app/...` paths because that's where the code lives — keep using `@/app/...`.

---

## 10. Validation, errors & logging

- The DB layer wraps every Firestore call in a `safe()` helper that logs the underlying error to `console.error("[db] Firestore error:", err)` and returns the supplied fallback. **Surface real errors loudly** — don't swallow them silently.
- API routes log via `console.log("[API Request] ...")` / `console.log("[API Response] ...")`. Match this style for new endpoints.
- FatSecret-specific requests are appended to `api.log` via `logApiRequest()`.

---

## 11. Theming

- Theme is owned by `usePrefsStore` (`"system" | "light" | "dark"`). The actual `dark` class is applied via the inline blocking script in `app/layout.tsx` to avoid FOUC.
- Theme transitions use the View Transitions API — see the `::view-transition-*` rules in `app/globals.css`. Don't add new cross-fade logic.
- `resolveTheme(t)` in `prefsStore.ts` is the canonical resolver; reuse it instead of re-checking `prefers-color-scheme` inline.

---

## 12. Date handling

- All calendar dates are stored as `YYYY-MM-DD` strings (no `Date` objects in Firestore).
- `todayKey()` (UTC, slices `toISOString`) and `todayLocalKey()` (local TZ) both exist in [AppContext.tsx](app/context/AppContext.tsx). Prefer `todayLocalKey()` for user-facing "today" so users east of UTC don't see yesterday's logs before 05:30 local time.
- For date math / formatting use `date-fns` (already a dependency) — don't pull in `moment` / `dayjs`.

---

## 13. Things to AVOID

- ❌ Don't add new Zustand stores without a strong reason — most state belongs in Firestore + Context.
- ❌ Don't write to Firestore outside `/users/{uid}/` — the rules deny it.
- ❌ Don't call the Gemini SDK from client components — always go through a route handler so the API key stays server-side.
- ❌ Don't hand-edit `app/components/ui/*` — those are generated by the shadcn CLI.
- ❌ Don't introduce barrel files (`index.ts` re-exports).
- ❌ Don't use relative imports (`../../../`) — use `@/`.
- ❌ Don't use `any` except at narrow integration boundaries (already linted as `warn`). Prefer `unknown` + narrowing.
- ❌ Don't bake in the old `Exercise.cardio` / `sets` / `reps` legacy fields for new code — write to the new `metrics` block (with type-specific keys).
- ❌ Don't write per-type metric fields by hand — extend `WORKOUT_METRIC_SCHEMAS` and the form picks them up.
- ❌ Don't bypass `useAuthGuard` with bespoke redirects.

---

## 14. Quick checklist for a new feature

- [ ] Add / update the type in [app/types.ts](app/types.ts).
- [ ] Add a DB helper in [app/lib/db.ts](app/lib/db.ts) (or a new `lib/` module).
- [ ] Expose it through `AppContext` (reducer + action + hydration if it has remote data).
- [ ] Build the UI in `app/components/` and the page under `app/(app)/<feature>/`.
- [ ] If it needs AI, follow the route → hook → logger → confirmation pipeline in §6.
- [ ] Gate the page with `useAuthGuard()`.
- [ ] Run `pnpm typecheck` (or `npx tsc --noEmit`) and `pnpm lint` before finishing.