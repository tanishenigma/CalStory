# Voice Input for AI Chat — Implementation Plan

**Status:** Draft, awaiting approval
**Feature:** Wire up disabled `Mic` buttons in both AI chat panels
**Date:** June 19, 2026

---

## 1. Scope

Enable the disabled `Mic` buttons in:

- [app/components/nutrition/ai-chat-logger.tsx](app/components/nutrition/ai-chat-logger.tsx) (food logging)
- [app/components/nutrition/ai-workout-logger.tsx](app/components/nutrition/ai-workout-logger.tsx) (workout logging)

…so users can dictate a meal or workout instead of typing. Users still tap **Send** to commit (no auto-send), so they can review/edit the transcript before it hits the AI.

---

## 2. Approach

Use the browser's built-in **Web Speech API** (`SpeechRecognition` / `webkitSpeechRecognition`).

- Zero new dependencies
- Works in Chrome, Edge, Safari (incl. iOS Safari) today
- Falls back gracefully on unsupported browsers (Firefox desktop, very old builds)
- Free — no server-side STT API costs

---

## 3. Files to change

| # | File | Change |
|---|---|---|
| 1 | **`app/lib/use-speech-recognition.ts`** *(new)* | Shared React hook wrapping `SpeechRecognition`. Exposes state (`idle` / `listening` / `error`), transcript management, start/stop/cancel, browser-capability detection, and a typed `getRecognition()` helper. |
| 2 | **[app/components/nutrition/ai-chat-logger.tsx](app/components/nutrition/ai-chat-logger.tsx)** | Enable the disabled `Mic` button — tap to start/stop, show pulsing red ring + `MicOff` icon while recording, append the final transcript to the input on stop, show a Sonner toast on unsupported browsers. |
| 3 | **[app/components/nutrition/ai-workout-logger.tsx](app/components/nutrition/ai-workout-logger.tsx)** | Same wiring as #2 (mic button is in a different layout — a flex column with Send). |
| 4 | **[app/lib/utils.ts](app/lib/utils.ts)** | Add a small `formatTranscript(s)` helper that trims, collapses whitespace, and capitalizes the first letter so dictated text reads naturally. |

**No new types** — `SpeechRecognition` types are not installed, so we declare the minimal types locally inside the new hook file to avoid pulling in `@types/...`.

---

## 4. Behavior spec

### Tap-to-toggle recording

- **Tap mic** → start listening. Button turns red, icon becomes `MicOff`, subtle pulse ring around it. Transcript updates **live** in the input field as the user speaks (interim results).
- **Tap again** → stop. Final transcript stays in the input.
- **Auto-stop** → on browser `onend` event (driven by silence detection, usually ~5–10s of silence). User can also tap the Send button mid-recording to send the current transcript.

### Browser support

- **Supported** (Chrome, Edge, Safari, iOS Safari) → button is visible, fully functional.
- **Unsupported** (Firefox desktop, very old browsers) → button is hidden entirely.
- **Permission denied / no mic** → show a specific Sonner toast: *"Voice input isn't supported in this browser. Try Chrome or Safari."*

### Error handling

Each `SpeechRecognitionErrorEvent.error` gets a specific Sonner toast. The hook **never throws** — it always returns a state.

| Error | Toast message |
|---|---|
| `no-speech` | "Didn't catch that — try again?" |
| `audio-capture` | "Couldn't access your microphone." |
| `not-allowed` | "Microphone access denied. Check browser permissions." |
| `network` | "Network error — voice input needs a connection." |
| `aborted` | *(silent — user-initiated stop)* |
| other | "Voice input failed. Please try again." |

### Dependencies already available

- `lucide-react` → `Mic`, `MicOff` icons
- `sonner` → toast helper
- Tailwind v4 → red-500 / red-600 / animate-ping utilities

---

## 5. Out of scope (intentional)

- **Auto-send on speech end** — user reviews transcript first; safer for the AI parse
- **Continuous/interim-mode waveform animation** — simple pulse only
- **Server-side STT fallback** — no paid API; Web Speech API is free and good enough for short dictation
- **i18n for toast strings** — matches existing app which is English-only
- **Re-recording UX** (e.g. swipe-to-clear) — covered by the existing input clear logic
- **Visual transcript highlighting** (final vs interim) — interim results are appended to the input but not visually distinguished; the browser shows its own mic indicator

---

## 6. Verification

- `npm run typecheck` — must pass
- `npm run lint` — must pass
- **Manual in Chrome:** tap mic → see red state → say *"two eggs and toast"* → tap again → see text in input → tap Send → AI returns a meal as usual
- **Manual in Firefox:** mic button is hidden
- **Manual in Chrome with mic blocked:** tap mic → permission prompt → deny → see "Microphone access denied" toast
- **No regression** in the existing send/edit/confirm flows (the mic is purely additive)

---

## 7. Estimated time

~20–25 min, single round of edits across 4 files (1 new + 3 modified).

---

## 8. Implementation order

1. Create `app/lib/use-speech-recognition.ts` (the hook + types)
2. Add `formatTranscript` to `app/lib/utils.ts`
3. Wire mic into `app/components/nutrition/ai-chat-logger.tsx`
4. Wire mic into `app/components/nutrition/ai-workout-logger.tsx`
5. Run `npm run typecheck && npm run lint`
6. Manual smoke test in Chrome + Firefox

---

## 9. Open questions for the user

None at this time. Plan is ready for approval.
