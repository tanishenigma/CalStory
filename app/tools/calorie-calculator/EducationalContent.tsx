/**
 * EducationalContent — long-form educational body for
 * `/tools/calorie-calculator`.
 *
 * Pure server component (no `"use client"`). Every word is in
 * the initial HTML response Googlebot sees, and the page
 * renders identically with or without JavaScript.
 *
 * Six original sections in CalStory's voice — direct,
 * numbers-first, lifters-aware. No wording is borrowed from
 * any other calculator site.
 *
 * Internal links point at the closest existing CalStory
 * destination (blog posts, /about) because the sibling tool
 * pages (`/tools/macro-calculator`, `/tools/bmr-calculator`,
 * `/tools/bmi-calculator`) don't exist yet.
 */

import Link from "next/link";

export default function EducationalContent() {
  return (
    <div className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-heading prose-headings:tracking-tight prose-h2:text-3xl prose-h2:mt-14 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-p:leading-relaxed prose-p:text-muted-foreground prose-li:text-muted-foreground prose-a:text-primary hover:prose-a:text-primary/80 prose-strong:text-foreground">
      {/* ────────────────────────────────────────────────── */}
      <h2 id="understanding-bmr-vs-tdee">Understanding BMR vs. TDEE</h2>
      <p>
        Every daily calorie target starts with two numbers most people mix up.
        Your <strong>BMR</strong> — basal metabolic rate — is the energy your
        body burns at complete rest to keep your heart beating, your lungs
        breathing, and your brain online. Your <strong>TDEE</strong> — total
        daily energy expenditure — is what you actually burn in a 24-hour window
        once you add movement, digestion, and training. TDEE is the number you
        plan around; BMR is the floor you can never safely eat below.
      </p>
      <p>
        Three equations dominate the field. The <strong>Mifflin-St Jeor</strong>{" "}
        formula (1990) is the modern default: it predicts BMR within roughly ten
        percent for about seventy percent of adults and is what CalStory ships
        by default. The <strong>Revised Harris-Benedict</strong> equation (Roza
        &amp; Shizgal, 1984) is the older clinical standard and tends to
        over-shoot modern populations by around five percent. The{" "}
        <strong>Katch-McArdle</strong> formula (1996) is the only one of the
        three that asks for your body-fat percentage, because it works directly
        from lean mass. When your body-fat number is accurate, Katch-McArdle is
        the most precise of the three. When it&apos;s a guess, stick with
        Mifflin.
      </p>
      <h3>The equations, side by side</h3>
      <ul>
        <li>
          <strong>Mifflin-St Jeor (1990).</strong> Men:{" "}
          <code>10 · kg + 6.25 · cm − 5 · age + 5</code>. Women:{" "}
          <code>10 · kg + 6.25 · cm − 5 · age − 161</code>.
        </li>
        <li>
          <strong>Revised Harris-Benedict (1984).</strong> Men:{" "}
          <code>88.362 + 13.397 · kg + 4.799 · cm − 5.677 · age</code>. Women:{" "}
          <code>447.593 + 9.247 · kg + 3.098 · cm − 4.330 · age</code>.
        </li>
        <li>
          <strong>Katch-McArdle (1996).</strong>{" "}
          <code>370 + 21.6 · (kg · (1 − bodyFatPct/100))</code>.
          Sex-independent.
        </li>
      </ul>
      <p>
        TDEE is just BMR scaled by your weekly activity. A sedentary desk worker
        multiplies by about 1.2, a four-days-a-week lifter by about 1.55, and
        someone who trains twice a day or works a physical job by 1.9. The
        calculator above uses those exact multipliers and lets you swap between
        the three BMR formulas with one click.
      </p>

      {/* ────────────────────────────────────────────────── */}
      <h2 id="how-many-calories-do-you-actually-need">
        How many calories do you actually need?
      </h2>
      <p>
        Five variables drive the answer: age, sex, height, weight, and activity.
        Age and sex are fixed; the other three are levers you can move. A
        30-year-old male who is 180 cm and 80 kg burns more than a 60-year-old
        female who is 160 cm and 60 kg at the same activity level — sometimes by
        a thousand calories a day. General population ranges for maintenance
        calories, taken from the published Mifflin-St Jeor validation cohorts,
        look roughly like this:
      </p>
      <ul>
        <li>
          <strong>Sedentary men:</strong> ~1,900–2,200 kcal/day.{" "}
          <strong>Sedentary women:</strong> ~1,500–1,800 kcal/day.
        </li>
        <li>
          <strong>Moderately active men:</strong> ~2,400–2,800 kcal/day.{" "}
          <strong>Moderately active women:</strong> ~1,900–2,200 kcal/day.
        </li>
        <li>
          <strong>Very active men:</strong> ~3,000–3,500 kcal/day.{" "}
          <strong>Very active women:</strong> ~2,400–2,800 kcal/day.
        </li>
      </ul>
      <p>
        Muscle mass shifts the same person&apos;s BMR upward by roughly six to
        ten kcal per pound of additional lean tissue, because muscle is
        metabolically active and fat is not. Two people who weigh the same on
        the scale can burn meaningfully different calories at rest.
      </p>
      <p>
        <strong>Floor warning.</strong> The body needs a minimum amount of
        energy to keep its organs running. For most adult women that floor is
        around <strong>1,200 kcal/day</strong>; for most adult men it&apos;s
        around <strong>1,500 kcal/day</strong>. Going meaningfully below those
        floors for more than a few days without medical supervision risks muscle
        loss, hormonal disruption, and the metabolic slowdown that makes a crash
        diet backfire. The calculator won&apos;t show you anything below
        maintenance, but it also can&apos;t warn you when maintenance itself is
        below your real needs — that&apos;s a conversation to have with a
        clinician if you suspect under-eating. For a deeper primer on the unit
        itself, see{" "}
        <Link href="/blog/what-is-a-calorie">what a calorie actually is</Link>.
      </p>

      {/* ────────────────────────────────────────────────── */}
      <h2 id="a-practical-guide-to-calorie-counting">
        A practical guide to calorie counting
      </h2>
      <p>
        Calorie counting works because energy balance is the only mechanism that
        decides whether body weight goes up, down, or nowhere. But the math is
        only half the job; the rest is process. Five steps, in order:
      </p>
      <ol>
        <li>
          <strong>Calculate your BMR.</strong> Use Mifflin-St Jeor as the
          default, switch to Katch-McArdle if you have a recent DEXA or caliper
          body-fat number. The calculator above does this for you.
        </li>
        <li>
          <strong>Set a deficit or surplus.</strong> Subtract 250–500 kcal for a
          fat-loss target, add 200–400 kcal for muscle gain. Bigger swings work
          in the short term but cost muscle, energy, and adherence.
        </li>
        <li>
          <strong>Pick a tracking method.</strong> The best tracker is the one
          you still open in week three.{" "}
          <Link href="/blog/calorie-tracking-for-beginners">
            Beginners do best with AI food logging
          </Link>{" "}
          — describing a meal in plain English gets you out of the database
          scrolling that kills most trackers by day ten.
        </li>
        <li>
          <strong>Log consistently, not perfectly.</strong> Restaurant meals
          will be guesses, home meals will be precise, and that mix is fine.
          Logging a placeholder is always better than logging a zero, because
          the streak survives.
        </li>
        <li>
          <strong>Reassess weekly.</strong> A seven-day rolling average is the
          only signal worth reading. Daily weight bounces two to four pounds on
          water and sodium alone; the trend line is the truth.
        </li>
      </ol>
      <p>
        CalStory is built around those five steps. The AI food logger handles
        step three, the dashboard calorie ring handles step four, and the weekly
        recalibration in your settings handles step five — your target drifts up
        or down by 100 kcal depending on whether your actual weight change is
        matching the planned rate.
      </p>

      {/* ────────────────────────────────────────────────── */}
      <h2 id="safe-rate-of-weight-loss">Safe rate of weight loss</h2>
      <p>
        The famous <strong>3,500 kcal ≈ 1 lb of fat</strong> rule is a
        simplification, but a useful one. A daily 500-calorie deficit adds up to
        3,500 kcal over a week, which lines up with roughly one pound of fat
        lost. A 250-calorie deficit produces about half a pound per week, which
        is the gentle end of the spectrum. Those numbers assume the deficit
        comes from intake, not from over-training on top of an already low
        baseline.
      </p>
      <p>
        Most coaches cap fat loss at roughly one percent of bodyweight per week.
        For a 180-pound adult that&apos;s about 1.8 lb/week; for a 130-pound
        adult it&apos;s about 1.3 lb/week. Going meaningfully faster than that
        has three predictable costs:
      </p>
      <ul>
        <li>
          <strong>Muscle loss.</strong> Aggressive cuts cannibalize lean tissue
          alongside fat. The classic study from Garthe et al. (2011) showed
          faster weight loss produced more muscle loss than slower weight loss
          even at the same total deficit.
        </li>
        <li>
          <strong>Hormonal drag.</strong> Testosterone drops, cortisol rises,
          thyroid function slows. None of that is good for a lifter trying to
          keep strength in a cut.
        </li>
        <li>
          <strong>Metabolic adaptation.</strong> The body down-regulates BMR to
          defend its set-point. The more aggressive the cut, the more the
          down-regulation, and the harder the eventual reverse-diet becomes.
        </li>
      </ul>
      <p>
        A standard 500-kcal/day cut runs about a pound a week and is the sweet
        spot for most lifters. Anything below a 750-kcal/day deficit should be
        paired with medical sign-off. For a deeper look at the mechanics of
        running a deficit without losing muscle, see{" "}
        <Link href="/blog/what-is-a-calorie-deficit">
          what a calorie deficit actually is
        </Link>
        .
      </p>

      {/* ────────────────────────────────────────────────── */}
      <h2 id="calorie-quality">Calorie quality: not all calories are equal</h2>
      <p>
        A calorie is a unit of energy and nothing else — but the food that
        delivers that energy changes how your body uses it. Three brief notes:
      </p>
      <ul>
        <li>
          <strong>Whole vs. processed.</strong> Whole foods tend to be
          high-volume and high-fiber, which means you can eat more of them for
          the same calories and feel fuller. A 300-calorie chicken-and-rice bowl
          fills most people; a 300-calorie pastry rarely does.
        </li>
        <li>
          <strong>The thermic effect of food.</strong> Protein costs roughly
          20–30% of its calories to digest; carbs cost 5–10%; fat costs 0–3%.
          That means 100 kcal of chicken effectively contributes about 70–80
          usable kcal — a meaningful gap over months of tracking.
        </li>
        <li>
          <strong>Empty-calorie sources.</strong> Sugary drinks and alcohol
          deliver calories without meaningful satiety. A 12-oz soda (≈150 kcal)
          doesn&apos;t suppress the next meal; a sandwich of the same calories
          does. The same logic applies to fruit juice versus whole fruit.
        </li>
      </ul>
      <p>
        None of this contradicts energy balance. Two people on the same daily
        calorie target will see different hunger, energy, and body composition
        depending on where those calories come from. Aim for the high-quality
        bulk of your calories first; the last 10% is fine-tuning.
      </p>

      {/* ────────────────────────────────────────────────── */}
      <h2 id="zigzag-calorie-cycling">Zigzag / calorie cycling</h2>
      <p>
        Zigzag (or calorie cycling) means varying daily calorie intake while
        hitting the same weekly average. A 14,000-kcal week works out to 2,000
        kcal/day if every day is identical, but it also works out to 1,800 kcal
        four days a week paired with 2,600 kcal three days a week. Same weekly
        total, different daily shape.
      </p>
      <p>
        Why bother? Three reasons. First, social occasions rarely line up with
        your deficit day — front-loading calories for a Saturday dinner removes
        the friction of saying no to a restaurant. Second, training days and
        rest days have genuinely different energy needs, so eating to the
        training day makes the deficit feel less restrictive. Third, the
        psychological novelty of a higher-calorie day helps long-term adherence
        — most people find a flat 1,800 kcal harder to sustain than a
        1,500–2,100 swing that averages to the same place.
      </p>
      <p>
        Zigzag isn&apos;t magic. If the weekly average matches your goal and you
        can sustain it, the daily shape is a personal-preference dial.
        CalStory&apos;s daily calorie ring stays accurate whether you zig or
        zag, because the underlying target is the same and the recalibration
        uses your seven-day average weight.
      </p>

      {/* ────────────────────────────────────────────────── */}
      <h2 id="sibling-tools">Related tools and guides</h2>
      <p>
        The Calorie Calculator is one of three free tools on CalStory. The{" "}
        <Link href="/blog/best-macro-calculator">best macro calculator</Link>{" "}
        splits a daily calorie target into protein, carbs, and fat — once you
        have a TDEE number, the next decision is how to spend it. For the
        underlying maintenance math, the calorie-deficit deep-dive on the{" "}
        <Link href="/about">About</Link> page walks through the same Mifflin
        equation with more clinical context. New tool pages for BMR-only and BMI
        calculations are queued for the next round of updates.
      </p>
    </div>
  );
}
