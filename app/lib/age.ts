// ─── Age / DOB helpers ───────────────────────────────────
// CalStory stores age as a derived value from `Profile.dob`
// (ISO string YYYY-MM-DD). The helpers here keep that contract
// consistent across the onboarding form, settings edit modal,
// and any place that needs to round-trip the two values.

/**
 * Convert a date-of-birth ISO string (YYYY-MM-DD) to the user's
 * completed age in years. Returns `null` for invalid input.
 *
 * The birthday-has-passed adjustment is correct for both leap
 * and non-leap years — we compare month + day directly against
 * the local current date.
 */
export function dobToAge(dob: string | undefined | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob + "T00:00:00");
  if (Number.isNaN(birth.getTime())) return null;

  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  // Clamp to a sane adult range — the onboarding form's age
  // input used to enforce 12..99, and we want the same floor /
  // ceiling when the user picks a DOB in the calendar.
  if (age < 12) return 12;
  if (age > 99) return 99;
  return age;
}

/**
 * Lower bound of a reasonable DOB window — the user can't be
 * older than `maxYears` years old. Default 99 to mirror the
 * old numeric age cap.
 */
export function minDobIso(maxYears = 99): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - maxYears);
  return d.toISOString().slice(0, 10);
}

/**
 * Upper bound of a reasonable DOB window — the user can't be
 * younger than `minYears` years old. Default 12 to mirror the
 * old numeric age floor.
 */
export function maxDobIso(minYears = 12): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - minYears);
  return d.toISOString().slice(0, 10);
}

/**
 * Convert a completed age (years) to the latest DOB that would
 * produce that age. Useful for the settings edit modal when the
 * legacy profile only has `age` and no `dob` yet.
 */
export function ageToDobIso(age: number | null | undefined): string | null {
  if (age === null || age === undefined || !Number.isFinite(age)) return null;
  const d = new Date();
  d.setFullYear(d.getFullYear() - age);
  return d.toISOString().slice(0, 10);
}
