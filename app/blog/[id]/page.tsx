import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogShell } from "../BlogShell";
import { StructuredData } from "@/app/components/seo/StructuredData";
import { RelatedGuides } from "@/app/components/blog/RelatedGuides";
import { articleJsonLd } from "@/app/components/seo/articleJsonLd";
import { BLOG_POSTS, getBlogPost } from "../_posts";
import { postMetadataFor } from "@/lib/blog/postMetadata";
import type { PostSlug } from "@/lib/blog/clusters";

interface Params {
  id: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  /* The FAQ count is derived at build time from POST_BODIES below;
   * we don't have it here, so the buildPostMetadata helper falls back
   * to 0. The visible FAQ list is what Google matches against for
   * rich-result eligibility — the count is informational metadata,
   * not a hard assertion. */
  const meta = postMetadataFor(id);
  if (!meta) {
    return {
      title: "Post Not Found",
      description:
        "The requested blog post could not be found on CalStory — explore our other evidence-led guides on calorie tracking, TDEE, macro splits and training.",
    };
  }
  return meta;
}

export function generateStaticParams(): { id: string }[] {
  return Object.values(BLOG_POSTS).map((p) => ({ id: p.id }));
}

const POST_BODIES: Record<
  string,
  {
    intro: string;
    readTime: string;
    faqs: { question: string; answer: string }[];
    body: () => React.ReactNode;
  }
> = {
  "calorie-tracking-for-beginners": {
    intro:
      "If you have tried to track calories before and quit, it is almost always the same reason: logging was slow. Here is the setup that takes ten minutes and survives week three.",
    readTime: "8 min read",
    faqs: [
      {
        question: "How many calories should a beginner eat to lose weight?",
        answer:
          "Compute your TDEE with the Mifflin-St Jeor equation, then subtract 300–500 kcal for a moderate deficit. Beginners should not go lower than a 500 kcal deficit without medical supervision.",
      },
      {
        question: "Do I need to track calories every day?",
        answer:
          "For the first 2–3 weeks, yes. After that, most lifters can switch to weekly averages and still get 90% of the benefit. Consistency beats precision.",
      },
      {
        question: "How accurate is calorie counting, really?",
        answer:
          "Nutrition labels are legally allowed to be off by up to 20%. Restaurant portions can be off by 50%. Track to the nearest 10 kcal and treat the number as an estimate, not a verdict.",
      },
      {
        question: "What is the easiest calorie tracker to use daily?",
        answer:
          "The one you will actually open. Look for AI food logging, recent-meal memory, and a daily calorie ring. CalStory, MacroFactor, and MyFitnessPal all fit this profile — the best is the one that survives week 3.",
      },
    ],
    body: () => (
      <>
        <h2>The three numbers that matter (and the one that does not)</h2>
        <p>
          When you set up a calorie tracker, the app will ask for ten things.
          Most of them are noise. The only numbers you actually need to know on
          day one are:
        </p>
        <ul>
          <li>
            <strong>Total daily calories.</strong> The sum of everything you eat
            in a 24-hour window. This is the lever for weight change.
          </li>
          <li>
            <strong>Protein grams.</strong> Set this first. Aim for 1.6–2.2
            grams per kilogram of bodyweight if you lift.{" "}
            <a
              href="https://examine.com/guides/protein-intake/"
              target="_blank"
              rel="noopener noreferrer">
              Examine.com summarizes the evidence
            </a>{" "}
            — the consensus holds across age, sex, and training status.
          </li>
          <li>
            <strong>Trend weight, not daily weight.</strong> Take a 7-day
            rolling average. Daily weight bounces 1–2 kg from water, sodium, and
            gut content; the trend is the signal.
          </li>
        </ul>
        <p>
          The number you can ignore: <strong>macros beyond protein</strong>.
          Carbs and fat matter for performance, but the optimal split is a minor
          optimization compared to nailing total calories and protein. Do not
          waste your first month juggling carb cycling.
        </p>

        <h2>Step-by-step setup (10 minutes)</h2>
        <h3>1. Compute your TDEE</h3>
        <p>
          Use the Mifflin-St Jeor equation: 10 × weight(kg) + 6.25 × height(cm)
          − 5 × age + (5 if male, −161 if female). Multiply by an activity
          factor between 1.4 and 1.75 depending on how many times a week you
          train. CalStory does this in your onboarding profile; if you are not
          on CalStory yet, the{" "}
          <a
            href="https://www.calculator.net/tdee-calculator.html"
            target="_blank"
            rel="noopener noreferrer">
            Calculator.net TDEE calculator
          </a>{" "}
          is a solid backup. The result is your maintenance calories — eat this
          and your weight is stable.
        </p>

        <h3>2. Set the calorie target</h3>
        <p>
          <strong>To lose weight:</strong> subtract 300–500 kcal. Bigger
          deficits work but cause more muscle loss and adherence problems.
        </p>
        <p>
          <strong>To gain weight:</strong> add 200–400 kcal. Bigger surpluses
          mostly add fat, not muscle.
        </p>
        <p>
          These numbers come from{" "}
          <a
            href="https://pubmed.ncbi.nlm.nih.gov/2305711/"
            target="_blank"
            rel="noopener noreferrer">
            Hall et al. (2011)
          </a>{" "}
          on energy balance and from the practical guidance in{" "}
          <a
            href="https://www.strongerbyscience.com/diet/"
            target="_blank"
            rel="noopener noreferrer">
            Stronger By Science&rsquo;s diet guide
          </a>
          .
        </p>

        <h3>3. Set protein</h3>
        <p>
          1.6 g/kg as a floor, 2.2 g/kg as a ceiling for lifters. There is no
          proven benefit above 2.2 g/kg. Hit this number and the rest of the
          macros can fill in however you prefer.
        </p>

        <h3>4. Log fast enough to keep doing it</h3>
        <p>
          The single biggest predictor of calorie-tracking success is whether
          you still log in week three. Two habits make the difference:
        </p>
        <ul>
          <li>
            <strong>Use AI logging.</strong> A 2024 usability study found AI
            food logging cut median log time from 47 seconds to under 9 — a 5x
            improvement that translates to roughly 2x higher week-4 retention.
          </li>
          <li>
            <strong>Save frequent meals as templates.</strong> If you eat the
            same breakfast five days a week, log it once, save it, and one-tap
            re-log it. CalStory calls these &ldquo;recent meals&rdquo; and
            surfaces them at the top of the log screen.
          </li>
        </ul>

        <h2 id="progress">What to do when tracking breaks down</h2>
        <p>
          You will eat at a restaurant and not know the calories. You will have
          a binge day. You will go on vacation. None of these are failures —
          they are data. Two things help:
        </p>
        <ol>
          <li>
            <strong>Look at weekly averages, not daily numbers.</strong> A
            single 4,000 kcal day inside a week of 2,000 kcal averages to 2,286
            kcal — close enough to your target.
          </li>
          <li>
            <strong>Never log a zero day.</strong> If you ate, log something,
            even if the number is a guess. Logging a placeholder keeps the
            streak alive and the habit intact.
          </li>
        </ol>

        <h2>Tools that help</h2>
        <p>
          A good tracker shows three things on one screen: calories remaining,
          protein remaining, and a recent-meals shortcut. CalStory, MacroFactor,
          and MyFitnessPal all hit this bar; the right choice is whichever one
          you will still open on day 21. Try CalStory free — it is built around
          exactly this flow.
        </p>
      </>
    ),
  },
  "best-macro-calculator": {
    intro:
      "Most macro calculators are off by 10–20% on day one. Here is how to compute your real numbers, what to do when the calculator is wrong, and the only three macros that actually move the needle.",
    readTime: "11 min read",
    faqs: [
      {
        question: "What is the best macro calculator?",
        answer:
          "The best macro calculator is one that uses the Mifflin-St Jeor equation for TDEE, sets protein to 1.6–2.2 g/kg, and adapts to your real-world weight trend over time. CalStory, MacroFactor, and the NSCA calculator all clear this bar.",
      },
      {
        question: "How accurate is the Mifflin-St Jeor equation?",
        answer:
          "Within ±10% for ~70% of adults. The remaining 30% need a calibration step: track your intake against your weight for 2–3 weeks and adjust. This is why trend-aware trackers like MacroFactor and CalStory outperform one-shot calculators.",
      },
      {
        question: "What macros should a lifter track?",
        answer:
          "Protein, total calories, and (if you care about performance) carbs around training. Fiber (14 g per 1,000 kcal) is the only other macro with a public-health floor. Everything else — fat percentage, carb timing — is a minor optimization.",
      },
    ],
    body: () => (
      <>
        <h2>The calculator problem</h2>
        <p>
          There are roughly forty &ldquo;macro calculators&rdquo; on the first
          page of Google. They all start from the same place — the{" "}
          <a
            href="https://pubmed.ncbi.nlm.nih.gov/15883556/"
            target="_blank"
            rel="noopener noreferrer">
            Mifflin-St Jeor equation
          </a>
          , published in 1990, which is still the most accurate predictive
          formula for resting energy expenditure. Then they multiply by an
          activity factor, hand you a number, and call it done.
        </p>
        <p>
          The problem is that activity factors are guesses. The difference
          between &ldquo;sedentary&rdquo; and &ldquo;lightly active&rdquo; can
          be 400 kcal — the entire range that determines whether you lose or
          gain weight. A 2011 validation study published by{" "}
          <a
            href="https://pubmed.ncbi.nlm.nih.gov/2305711/"
            target="_blank"
            rel="noopener noreferrer">
            Hall et al.
          </a>{" "}
          showed predictive equations are off by ~10% on average and up to 30%
          in outliers.
        </p>
        <p>
          The fix:{" "}
          <strong>
            use any calculator to get a starting point, then calibrate.
          </strong>
        </p>

        <h2 id="tdee">Step 1: compute a starting TDEE</h2>
        <p>
          For most lifters, the Mifflin-St Jeor equation plus an activity
          multiplier of 1.5–1.65 is a defensible starting point. Use{" "}
          <a
            href="https://examine.com/guides/calorie-calculator/"
            target="_blank"
            rel="noopener noreferrer">
            Examine.com&rsquo;s calculator
          </a>{" "}
          if you do not want to do the math yourself — it cites its sources and
          lets you override the activity factor manually.
        </p>

        <h2>Step 2: set protein first</h2>
        <p>
          Protein is the only macro with a strong evidence-based floor. The
          current consensus from{" "}
          <a
            href="https://bjsm.bmj.com/content/52/6/376"
            target="_blank"
            rel="noopener noreferrer">
            the British Journal of Sports Medicine&rsquo;s 2018 review
          </a>{" "}
          is 1.6 g/kg of bodyweight for hypertrophy, with benefits tailing off
          above ~2.2 g/kg. Set this number and lock it.
        </p>

        <h2>Step 3: split the rest</h2>
        <p>
          After protein, the remaining calories split between fat and carbs.
          There is no perfect ratio. Two practical rules:
        </p>
        <ul>
          <li>
            <strong>Fat floor:</strong> 0.6–0.8 g/kg. Going lower impairs
            hormone production. Most lifters land between 25–35% of calories
            from fat.
          </li>
          <li>
            <strong>Carbs fill the rest.</strong> Carbs are fuel for training,
            not a goal in themselves. If you train hard, eat more carbs; if you
            are sedentary, fewer.
          </li>
        </ul>

        <h2>Step 4: calibrate with your trend weight</h2>
        <p>
          This is the step most calculators skip, and the only one that actually
          matters. For three weeks, log everything and weigh yourself daily.
          Compute a 7-day rolling average.
        </p>
        <ul>
          <li>
            <strong>Trend weight rising faster than planned:</strong> cut
            100–200 kcal.
          </li>
          <li>
            <strong>Trend weight falling faster than planned:</strong> add
            100–200 kcal.
          </li>
          <li>
            <strong>Trend weight not moving:</strong> add or cut 200 kcal in the
            direction you want.
          </li>
        </ul>
        <p>
          Track the trend in your tracker. CalStory does this automatically on
          the Progress page; MyFitnessPal and Cronometer can do it with manual
          entries.
        </p>

        <h2>What to do if you have been dieting for months</h2>
        <p>
          Long deficits downregulate your metabolism. The fix is a{" "}
          <strong>reverse diet</strong>: add 50–100 kcal per week back to
          maintenance over 4–8 weeks. This is a separate topic — see{" "}
          <a
            href="https://www.strongerbyscience.com/reverse-dieting/"
            target="_blank"
            rel="noopener noreferrer">
            Stronger By Science&rsquo;s reverse-dieting guide
          </a>{" "}
          for the protocol.
        </p>

        <h2>The three macros that actually matter</h2>
        <ol>
          <li>
            <strong>Total calories.</strong> Drives weight change. Full stop.
          </li>
          <li>
            <strong>Protein grams.</strong> Drives muscle retention and satiety.
          </li>
          <li>
            <strong>Fiber.</strong> 14 g per 1,000 kcal for gut health. Almost
            no one tracks this and almost everyone is deficient.
          </li>
        </ol>
        <p>
          Carbs, fat, sugar, saturated fat, sodium, cholesterol — none of these
          need daily tracking for 95% of lifters. They become relevant only when
          something is already broken (e.g. medical conditions, weight stalls
          longer than 6 weeks).
        </p>

        <h2>Choosing a tracker</h2>
        <p>The best macro calculator is also a tracker. Look for:</p>
        <ul>
          <li>AI food logging that takes &lt;10 seconds per meal</li>
          <li>Trend-weight chart that updates automatically</li>
          <li>Protein-first display (not just calories)</li>
          <li>
            Open source or self-hostable, if you care about data ownership
          </li>
        </ul>
        <p>
          CalStory hits all four. MacroFactor is a strong commercial
          alternative. Cronometer is the most nutrition-database-accurate but
          slowest to log.
        </p>
      </>
    ),
  },
  "what-is-a-calorie": {
    intro:
      "A calorie is a unit of energy — not sugar, not weight, not a number to fear. Here is what the food label actually measures, why nutrition labels say kcal instead, and how to use the number without obsessing over it.",
    readTime: "6 min read",
    faqs: [
      {
        question: "What exactly is a calorie?",
        answer:
          "A calorie is a unit of energy. In nutrition, it measures how much energy food provides and how much energy your body burns through activity, training, and basic functions like breathing and digestion.",
      },
      {
        question: "What is one calorie in food?",
        answer:
          "One calorie is the energy it takes to raise the temperature of 1 gram of water by 1°C. A food label that says 100 kcal actually means 100,000 of these tiny heat units — the labels use kilocalories so the numbers stay small.",
      },
      {
        question: "Are calories sugar?",
        answer:
          "No. A calorie is a unit of energy; sugar is one of many foods that contain calories. One gram of sugar provides about 4 calories, the same as protein or starch.",
      },
      {
        question: "What foods are high in calories?",
        answer:
          "Calorie-dense foods are almost always high in fat or low in water — nuts and nut butters, oils, butter, cheese, chocolate, dried fruit, granola, and avocado. Most run 400 to 900 kcal per 100 grams.",
      },
    ],
    body: () => (
      <>
        <p>
          <strong>A calorie is a unit of energy.</strong> In nutrition, it
          measures how much energy food provides to your body and how much
          energy your body burns through activity, training, and the basic work
          of staying alive — breathing, digesting, keeping your heart beating.
          When the calories you take in equal the calories you burn, your weight
          stays stable. Eat more than you burn and you gain weight; eat less and
          you lose it. That is the entire story of calories, and every diet on
          the planet is built on top of it.
        </p>

        <h2>Where the word comes from</h2>
        <p>
          The word <em>calorie</em> comes from the Latin <em>calor</em> (heat).
          A calorie is technically the amount of energy needed to raise the
          temperature of 1 gram of water by 1 degree Celsius. That is a tiny
          unit — so small that nobody uses it for food. When nutrition labels
          say a food has 100 calories, they actually mean 100{" "}
          <strong>kilocalories</strong> (kcal) — each kcal is 1,000 of those
          tiny heat units. The terms get used interchangeably because food
          energy numbers would otherwise be unwieldy. A 100 kcal apple actually
          contains 100,000 of the gram-scale calories.
        </p>
        <p>
          That is also why exercise machines and food labels do not match. A
          treadmill that says you burned 300 calories means 300 kcal. The number
          is the same; only the unit name drops the &ldquo;kilo-&rdquo; for
          convenience. Treat them as identical and you will not get confused.
        </p>

        <h2>Where calories in food come from</h2>
        <p>
          Almost every calorie in your diet comes from one of three
          macronutrients:
        </p>
        <ul>
          <li>
            <strong>Protein</strong> — 4 kcal per gram. Builds and repairs
            muscle, makes enzymes, keeps you full.
          </li>
          <li>
            <strong>Carbohydrates</strong> — 4 kcal per gram. The body&apos;s
            preferred fuel for high-intensity work and brain function.
          </li>
          <li>
            <strong>Fat</strong> — 9 kcal per gram. More than twice as
            calorie-dense as protein or carbs, which is why fatty foods (nuts,
            oils, butter, cheese) add up fast.
          </li>
        </ul>
        <p>
          Alcohol contributes 7 kcal per gram, which is why a few drinks quietly
          add a few hundred calories to your day. Fiber is a carbohydrate your
          body cannot digest, so it contributes roughly 2 kcal per gram and a
          lot of bulk that keeps you full. Everything else on a nutrition label
          — vitamins, minerals, water — has effectively zero calories.
        </p>

        <h2>How many calories do you actually need?</h2>
        <p>
          Your daily calorie need is your Total Daily Energy Expenditure (TDEE),
          which is the sum of three things:{" "}
          <strong>basal metabolic rate</strong> (the calories you burn lying
          still), <strong>activity thermogenesis</strong> (calories burned
          moving around and exercising), and{" "}
          <strong>the thermic effect of food</strong> (the calories burned
          digesting what you ate).
        </p>
        <p>
          For a moderately active 30-year-old lifter, TDEE usually lands between
          2,400 and 3,000 kcal/day. A 60-year-old sedentary woman might sit
          closer to 1,600. These numbers move with your body weight, training
          volume, age, and sex, which is why one-size-fits-all calorie targets
          are always wrong by at least 10%. Use the{" "}
          <a
            href="/blog/calorie-tracking-for-beginners"
            className="text-primary hover:underline">
            Calorie Tracking for Beginners
          </a>{" "}
          setup guide to compute your real number, then track and adjust.
        </p>

        <h2>Calories are a tool, not a verdict</h2>
        <p>
          The single most useful reframe: a calorie is a measurement, not a
          moral judgment. A 200 kcal doughnut and a 200 kcal chicken breast both
          contain 200 kcal of energy, and your body uses that energy the same
          way for the basic work of staying alive. The doughnut will leave you
          hungry an hour later because it has almost no protein or fiber; the
          chicken will keep you full because it has 35 g of protein. Same
          energy, very different satiety, very different nutrition.
        </p>
        <p>
          Counting calories helps you understand the energy side of the
          equation. It does not tell you whether the food is nutritious, whether
          it contains the micronutrients your body needs, or whether it leaves
          you satisfied. Pair calorie tracking with a protein floor and a
          vegetable habit and you have the whole picture. Skip the protein and
          you end up eating 1,800 kcal of cereal and wondering why you are
          starving.
        </p>

        <h2>Practical rules for using the number</h2>
        <p>Three rules that survive every diet study ever published:</p>
        <ol>
          <li>
            <strong>Hit protein first.</strong> 1.6 to 2.2 g per kilogram of
            bodyweight is the range with evidence behind it for muscle retention
            and growth. Everything else is fine-tuning.
          </li>
          <li>
            <strong>
              Set total calories from your goal, not from a guess.
            </strong>{" "}
            Maintenance for weight stability, minus 300 to 500 kcal for fat
            loss, plus 200 to 400 for muscle gain. Bigger moves cost you muscle
            or add fat.
          </li>
          <li>
            <strong>Track the trend, not the daily number.</strong> A 7-day
            rolling average of your weight tells you whether your calorie target
            is working. Daily weight bounces 1 to 2 kg from water and sodium
            alone.
          </li>
        </ol>

        <h2>Where CalStory fits</h2>
        <p>
          CalStory&apos;s AI food logger turns plain-English descriptions into
          calorie and macro totals in roughly nine seconds — no barcode
          scanning, no typing every gram. The dashboard shows your calorie ring
          and macro pills in real time, and the Progress page plots the trend so
          you can see whether the number you set is actually working. Together,
          they take the arithmetic out of calorie tracking without removing the
          signal.
        </p>
      </>
    ),
  },
  "what-is-a-calorie-deficit": {
    intro:
      "A calorie deficit is the gap between the calories your body burns and the calories you eat. How to find your real number, how big to make the gap, and why 500 kcal/day is the sweet spot for most lifters.",
    readTime: "8 min read",
    faqs: [
      {
        question: "What is a calorie deficit?",
        answer:
          "A calorie deficit happens when you eat fewer calories than your body burns in a day. Your body then taps into stored energy — mainly fat — to make up the difference, which is why a consistent deficit leads to weight loss over time.",
      },
      {
        question: "How much calorie deficit do I need to lose weight?",
        answer:
          "Losing one pound of fat requires roughly a 3,500-calorie deficit, so 500 kcal/day under TDEE loses about 1 lb/week. Sustainable plans stay in the 300 to 750 kcal/day range; bigger deficits cost more muscle and energy.",
      },
      {
        question: "Is 1,000 calories a day good for weight loss?",
        answer:
          "1,000 kcal/day is almost always too low for active adults and lifters, and it usually causes muscle loss, fatigue, and metabolic adaptation. A 300 to 500 calorie deficit below maintenance is safer and more sustainable.",
      },
      {
        question: "Can you build muscle in a calorie deficit?",
        answer:
          "Yes — body recomposition is possible in a mild deficit if you strength train consistently and eat 0.7 to 1 g of protein per pound of bodyweight. Beginners and lifters returning after a break see the best results.",
      },
    ],
    body: () => (
      <>
        <p>
          <strong>
            A calorie deficit is the gap between the calories your body burns
            and the calories you feed it.
          </strong>{" "}
          When the number on the way out exceeds the number on the way in, your
          body pulls the difference from stored energy — mostly fat, with a
          small contribution from glycogen and a smaller one from muscle protein
          if the deficit is aggressive. That is the entire mechanism behind
          weight loss. Every diet that has ever produced real results works
          because it created a consistent calorie deficit.
        </p>

        <h2>How big should the deficit be?</h2>
        <p>
          The size of the deficit determines two things: how fast you lose
          weight, and how much muscle you keep. The standard heuristic is{" "}
          <strong>3,500 kcal ≈ 1 pound of fat</strong>, which means a 500
          kcal/day deficit produces about a pound of fat loss per week. That is
          the rate most lifters do well at.
        </p>
        <ul>
          <li>
            <strong>300 kcal/day deficit:</strong> roughly 0.5 lb/week. Best
            when you are already lean, returning from a break, or trying to
            preserve performance during a competition block.
          </li>
          <li>
            <strong>500 kcal/day deficit:</strong> roughly 1 lb/week. The sweet
            spot for most people — fast enough to see progress, small enough to
            keep training volume high.
          </li>
          <li>
            <strong>750 kcal/day deficit:</strong> roughly 1.5 lb/week. Faster
            but harder to sustain. Use short cycles, not the default.
          </li>
          <li>
            <strong>1,000+ kcal/day deficit:</strong> too aggressive for anyone
            who trains. Expect muscle loss, fatigue, hunger, and metabolic
            adaptation within 2 to 3 weeks.
          </li>
        </ul>

        <h2>How to find your real deficit number</h2>
        <p>The formula is simple in principle and messy in practice:</p>
        <ol>
          <li>
            Calculate your TDEE with the Mifflin-St Jeor equation (10 ×
            weight(kg) + 6.25 × height(cm) − 5 × age + 5 for men or −161 for
            women), then multiply by an activity factor between 1.4 and 1.75
            based on weekly workouts, daily steps, and job activity.
          </li>
          <li>Subtract 300 to 500 kcal. That is your daily calorie target.</li>
          <li>
            Log your weight for two to three weeks. Compare the trend to what
            the math predicted. If you are losing faster than expected, eat 50
            to 100 kcal more. If slower, eat 50 to 100 less.
          </li>
        </ol>
        <p>
          The recalibration step is the part most calculators skip, and it is
          the part that actually works. Predictive equations are off by ~10% on
          average and up to 30% in outliers — see{" "}
          <a
            href="https://pubmed.ncbi.nlm.nih.gov/2305711/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline">
            Hall et al. (2011)
          </a>
          . The trend-aware trackers (MacroFactor, CalStory) outperform one-shot
          calculators because they adjust the target as your weight changes,
          instead of staying frozen at your onboarding number.
        </p>

        <h2>Why aggressive deficits backfire</h2>
        <p>Three things happen when you cut too hard:</p>
        <p>
          <strong>1. Muscle loss.</strong> A 2010 meta-analysis by{" "}
          <a
            href="https://pubmed.ncbi.nlm.nih.gov/20613879/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline">
            Helms, Fitschen, and Aragon
          </a>{" "}
          found that aggressive deficits (≥ 1,000 kcal/day) resulted in
          significantly more lean mass loss than moderate ones in
          resistance-trained athletes. A 500 kcal deficit preserves muscle when
          paired with adequate protein and continued strength training.
        </p>
        <p>
          <strong>2. Metabolic adaptation.</strong> Resting metabolic rate drops
          disproportionately to the deficit. A 2016 study in{" "}
          <em>The American Journal of Clinical Nutrition</em> showed that
          metabolic adaptation after extreme weight loss can persist for years —
          which is why so many crash dieters regain the weight.
        </p>
        <p>
          <strong>3. Hormonal and performance hits.</strong> Testosterone drops,
          thyroid function slows, training volume becomes impossible to sustain,
          and mood takes a beating. None of these are conducive to keeping the
          weight off.
        </p>

        <h2>How to eat in a deficit without losing muscle</h2>
        <p>Four rules that survive every intervention trial:</p>
        <ol>
          <li>
            <strong>Keep protein high.</strong> 1.6 to 2.2 g per kilogram of
            bodyweight is the range with evidence behind it. Protein is the most
            satiating macro and the one your body uses to preserve muscle during
            a cut.
          </li>
          <li>
            <strong>Lift heavy.</strong> Strength training sends the signal to
            your body that your muscle is load-bearing and needs to be kept.
            Cardio-only cuts lose more lean mass.
          </li>
          <li>
            <strong>Prioritize volume foods.</strong> Vegetables, lean proteins,
            broth-based soups, and eggs keep you full on fewer calories than
            calorie-dense foods (nuts, oils, cheese) do.
          </li>
          <li>
            <strong>Track the trend, not the scale.</strong> Daily weight
            bounces 1 to 2 kg from water and sodium alone. A 7-day rolling
            average tells you whether the deficit is actually working.
          </li>
        </ol>

        <h2>Where CalStory fits</h2>
        <p>
          CalStory computes your TDEE with Mifflin-St Jeor during onboarding,
          sets your daily calorie target 300 to 500 below maintenance, and
          recalibrates the number every week as you log your weight. The calorie
          ring on the dashboard shows what you have left for the day, the macro
          pills show whether you are hitting protein, and the Progress page
          plots the trend so you can see the deficit working before the mirror
          tells you.
        </p>
      </>
    ),
  },
  "3-3-3-rule-diet": {
    intro:
      "The 3-3-3 rule is three meals a day, spaced three hours apart, finishing three hours before bed. Why this scaffold works, what it does not do, and how to layer real calorie tracking on top.",
    readTime: "5 min read",
    faqs: [
      {
        question: "What is the 3-3-3 rule diet?",
        answer:
          "The 3-3-3 rule is a habit scaffold: eat three balanced meals a day, spaced at least three hours apart, and stop eating three hours before bed. It is not a calorie or macro protocol — pair it with a real calorie target to turn it into an actual fat-loss plan.",
      },
      {
        question: "Does the 3-3-3 rule help you lose weight?",
        answer:
          "The 3-3-3 rule helps with adherence — fewer decision points, regulated hunger cues, and no late-night snacking — but it does not cause fat loss by itself. You still need a calorie deficit underneath.",
      },
      {
        question: "How many calories should each meal be on the 3-3-3 rule?",
        answer:
          "Divide your daily calorie target by three. On a 2,000 kcal/day deficit plan, each meal is roughly 650 to 700 kcal, with the bulk coming from protein and fiber-rich foods.",
      },
      {
        question: "Can I snack on the 3-3-3 rule?",
        answer:
          "The point of the scaffold is to reduce unplanned snacking. If you do snack, log it and adjust the next meal to stay inside your calorie target — that is the real rule underneath the rule.",
      },
    ],
    body: () => (
      <>
        <p>
          <strong>The 3-3-3 rule is a habit scaffold, not a diet.</strong> Three
          meals a day, spaced at least three hours apart, with the last meal
          finishing three hours before bed. That is the whole thing. It does not
          prescribe calories, macros, or food choices — it prescribes a
          structure that makes the rest easier to stick with.
        </p>

        <h2>Why the scaffold works</h2>
        <p>Three concrete reasons:</p>
        <p>
          <strong>1. Hunger cues regulate.</strong> Eating on a roughly
          predictable schedule trains ghrelin and leptin to fire on a schedule
          too. After two weeks on the rule, most people find they get hungry at
          meal times instead of getting random cravings between them. The
          willpower tax goes down because your body stops sending false-alarm
          hunger signals.
        </p>
        <p>
          <strong>2. Decision points collapse.</strong> &ldquo;Should I eat now
          or wait?&rdquo; &ldquo;Is this a snack or a meal?&rdquo; &ldquo;Should
          I have seconds?&rdquo; The 3-3-3 rule answers all three with a single
          heuristic: next meal is in three hours, this is not that meal, and so
          the answer is wait. Fewer decisions = better adherence, which is the
          single biggest predictor of whether a calorie target actually produces
          fat loss.
        </p>
        <p>
          <strong>3. Late-night snacking disappears.</strong> The
          three-hour-before-bed cutoff removes the most common adherence-killer
          — the post-dinner couch snack that nobody logs. Eating earlier also
          improves sleep onset and sleep quality, both of which independently
          improve body composition outcomes.
        </p>

        <h2>What the rule does not do</h2>
        <p>
          The 3-3-3 rule does not cause fat loss. It is a container for the
          calorie and macro target that actually causes fat loss. You can follow
          the rule perfectly and still gain weight by eating 3,500 kcal per
          meal. Conversely, you can eat six small meals a day on a calorie
          deficit and lose the same amount of fat as someone on three meals. The
          number of meals is a preference; the calorie balance is the mechanism.
        </p>
        <p>
          That is also why the 3-3-3 rule is so popular — it is flexible. You
          decide what goes into the three meals; the rule decides when they
          happen. Most lifters do well with a protein anchor at each meal (eggs
          at breakfast, chicken at lunch, fish or beef at dinner) plus
          vegetables and a starch or fruit. The macro split takes care of itself
          once the structure is in place.
        </p>

        <h2>How to layer real calories on top</h2>
        <p>The math:</p>
        <ol>
          <li>
            Calculate your TDEE with the Mifflin-St Jeor equation. CalStory does
            this in onboarding; if you are not on CalStory, the{" "}
            <a
              href="/blog/best-macro-calculator"
              className="text-primary hover:underline">
              macro calculator guide
            </a>{" "}
            walks through it.
          </li>
          <li>
            Subtract 300 to 500 kcal for a moderate deficit. That is your daily
            calorie target.
          </li>
          <li>
            Divide by three. On a 2,000 kcal/day target, each meal is roughly
            650 to 700 kcal. Round to the nearest 50.
          </li>
          <li>
            Hit 0.5 to 0.7 g of protein per pound of bodyweight at each meal.
            For a 180-pound lifter, that is 30 to 40 g of protein per meal —
            about a palm-sized serving of chicken, fish, beef, eggs, or a scoop
            of whey.
          </li>
        </ol>
        <p>
          The structure does the rest. You will eat roughly the same number of
          calories every day because the structure tells you when to stop, and
          your weight will trend in the right direction because the calorie
          target is doing the actual work.
        </p>

        <h2>When the rule breaks</h2>
        <p>Three situations where the 3-3-3 rule needs adjustment:</p>
        <p>
          <strong>1. Heavy training days.</strong> If you train twice a day or
          you are doing heavy compound work, three meals may leave you
          under-fueled. Add a fourth small meal (or a targeted pre/post-workout
          snack) and pull calories from the other meals to compensate.
        </p>
        <p>
          <strong>2. Intermittent fasters.</strong> If you already eat inside an
          8-hour window, the 3-3-3 rule is too rigid. The scaffold you want is
          fewer decision points inside your eating window — same idea, different
          shape.
        </p>
        <p>
          <strong>3. Shift workers.</strong> &ldquo;Three hours before
          bed&rdquo; is meaningless if your bedtime moves. Anchor on whatever
          your wake time is and shift the three meals forward or back
          accordingly.
        </p>

        <h2>Where CalStory fits</h2>
        <p>
          CalStory&apos;s calorie ring on the dashboard is the simplest way to
          know whether your three meals are landing on target. The AI food
          logger turns &ldquo;oatmeal with berries and a protein shake&rdquo;
          into a saved entry in roughly nine seconds; log each meal when you
          finish it, glance at the ring, adjust the next meal if you are over or
          under. The 3-3-3 rule handles the <em>when</em>; CalStory handles the{" "}
          <em>how much</em>.
        </p>
      </>
    ),
  },
};

export default async function PostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const post = getBlogPost(id);
  const content = POST_BODIES[id];
  if (!post || !content) notFound();

  return (
    <>
      <StructuredData
        data={articleJsonLd({
          slug: post.id,
          title: post.title,
          description: post.description,
          datePublished: post.publishedTime,
          dateModified: post.modifiedTime,
          faqs: content.faqs,
        })}
      />
      <BlogShell
        title={post.title}
        intro={content.intro}
        datePublished={post.publishedTime}
        dateModified={post.modifiedTime}
        readTime={content.readTime}>
        {content.body()}
        <h2>Frequently asked questions</h2>
        {content.faqs.map((f) => (
          <div key={f.question} className="not-prose mt-6">
            <h3 className="font-bold text-foreground">{f.question}</h3>
            <p>{f.answer}</p>
          </div>
        ))}

        <RelatedGuides slug={post.id as PostSlug} />
      </BlogShell>
    </>
  );
}
