import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BlogShell } from "../BlogShell";
import { StructuredData } from "@/app/components/seo/StructuredData";
import { articleJsonLd } from "@/app/components/seo/articleJsonLd";
import { BLOG_POSTS, getBlogPost } from "../_posts";

interface Params {
  id: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const post = getBlogPost(id);
  if (!post) {
    return {
      title: "Post Not Found",
      description:
        "The requested blog post could not be found on CalStory — explore our other evidence-led guides on calorie tracking, TDEE, macro splits and training.",
    };
  }
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.id}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      publishedTime: post.publishedTime,
      modifiedTime: post.modifiedTime,
      authors: ["CalStory Team"],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
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

        <h2>What to do when tracking breaks down</h2>
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

        <h2>Step 1: compute a starting TDEE</h2>
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
        <p className="mt-10">
          {post.id === "calorie-tracking-for-beginners" ? (
            <>
              Want a deeper dive into macros specifically? Read{" "}
              <Link
                href="/blog/best-macro-calculator"
                className="text-primary hover:underline">
                The Best Macro Calculator for Lifters
              </Link>
              .
            </>
          ) : (
            <>
              New to tracking altogether? Start with{" "}
              <Link
                href="/blog/calorie-tracking-for-beginners"
                className="text-primary hover:underline">
                Calorie Tracking for Beginners
              </Link>
              .
            </>
          )}
        </p>
      </BlogShell>
    </>
  );
}
