# Security Baseline Audit — [App Name]

**Date:** [date]
**Scope:** [what was reviewed — e.g. "Next.js API routes + Firestore rules, no infra/network testing"]
**Not covered:** [categories explicitly skipped, per the checklist's "out of scope" section]

## Summary

[1-3 sentences: overall posture, count of findings by severity]

| Severity | Count |
|---|---|
| Critical | |
| High | |
| Medium | |
| Low | |

## Findings

### [Finding title] — [Severity]

**Location:** `path/to/file.ts:line`
**Issue:** [what's wrong, in plain terms — not just "insecure," explain the actual exposure]
**Why it matters:** [what an attacker could actually do with this]
**Suggested fix:**

```diff
- vulnerable code
+ fixed code
```

(repeat per finding, highest severity first)

## Things that looked fine

[Briefly note what was checked and passed — this is as useful as the findings, so the user knows the audit was thorough rather than only looking for problems]

## Suggested next steps

- [ ] [Apply fixes above — confirm before I make changes]
- [ ] [Any follow-up the user should do themselves, e.g. rotate a leaked key]
- [ ] [Anything worth a deeper look beyond this baseline pass]
