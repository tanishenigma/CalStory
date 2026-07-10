# Baseline Security Checklist — Full-Stack Web Apps (Next.js / Firebase focus)

Read this when doing Job 2 (baseline audit) from SKILL.md. Organized by the taxonomy category it maps to. Not every item applies to every app — skip what isn't present (e.g. no Cloud Functions means skip that subsection) rather than forcing a finding.

## Web Application (Pentesting category)

**Input handling**
- API routes (`app/api/**/route.ts`, `pages/api/**`) validate and type-check request bodies rather than trusting `req.body` directly — look for a schema validator (Zod, Yup) or its absence.
- User-supplied strings that reach a database query are parameterized, not concatenated.
- File upload endpoints restrict file type/size and don't trust the client-provided MIME type alone.

**XSS**
- Any use of `dangerouslySetInnerHTML` — check what's being injected and whether it's sanitized (e.g. DOMPurify) first.
- Rendering user-generated content (comments, chat messages, profile bios) without escaping.

**CSRF / auth boundaries**
- State-changing routes (POST/PUT/DELETE) check the session/auth token server-side, not just render conditionally on the client.
- Server actions (Next.js App Router) re-validate permissions inside the action itself — client-side gating is not enough.

**Secrets in the client bundle**
- Anything read via `process.env.NEXT_PUBLIC_*` is, by design, shipped to the browser — confirm nothing sensitive (service account keys, admin secrets) is prefixed this way.
- Check `next.config.js` for accidental `env` block exposure of server-only secrets.

**Rate limiting**
- Login, signup, and password-reset endpoints have some form of throttling or are behind Firebase Auth's own limits — flag if a custom auth flow bypasses this.

## Cloud (Pentesting category) — Firebase specifics

**Firestore / Realtime DB rules**
- Default-deny posture: rules should not read `allow read, write: if true;` in anything beyond a local emulator config.
- Every collection that contains user data checks `request.auth != null` and, where relevant, that the requesting user owns the document (`request.auth.uid == resource.data.ownerId`).
- Rules don't rely solely on obscurity (unguessable document IDs) as an access control.

**Storage rules**
- Same default-deny check as Firestore, applied to `storage.rules`.
- Upload rules cap file size and restrict content-type where the bucket is user-writable.

**Auth configuration**
- Check whether email enumeration protection is on, and whether anonymous auth (if enabled) is scoped down from full read/write.

**Cloud Functions**
- Callable functions re-check `context.auth` themselves — don't assume the client only calls them when authorized.
- No secrets passed as plain function config where Secret Manager (or at minimum environment config, not source) should be used.

**API keys**
- Firebase's client-side API key being public is expected and fine by Firebase's own design — don't flag it as a finding on its own. Instead check that Firestore/Storage rules (above) are what's actually gating access, since the API key isn't meant to be the security boundary.

## Static Analysis (Code Auditing category)

- Run (or ask to run) `npm audit` / `pnpm audit` and summarize any high/critical advisories with a fix path (usually a version bump).
- Use `scripts/scan_secrets.py` to catch committed credentials, private keys, or `.env` files that made it into git history or the working tree.
- Look for `eval()`, `new Function()`, or dynamic `require()` on user-influenced input.
- Check `.gitignore` actually excludes `.env*`, `serviceAccountKey.json`, and similar files — a missing entry is a common way secrets end up committed.

## What's usually out of scope for this kind of app

Call these out explicitly in the report as "not checked" rather than silently omitting them:

- **Network** (Nmap/Wireshark-style testing) — not meaningful for a serverless/managed-hosting app with no exposed infrastructure to scan.
- **Active Directory** — only relevant if the org also runs on-prem Windows infrastructure, which a Next.js/Firebase app typically doesn't touch.
- **Smart Contracts** — only relevant if the app has an on-chain component.
- **Threat Hunting / Forensics / Incident Response** — these are operational/live-environment concerns, not a static codebase audit; mention them only if the user's asking about production monitoring rather than a pre-ship review.
