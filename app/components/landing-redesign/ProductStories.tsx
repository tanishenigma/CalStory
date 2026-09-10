"use client";
import {
  Check,
  Dumbbell,
  Repeat2,
  Search,
  Sparkles,
  TrendingUp,
  Utensils,
} from "lucide-react";
import { Eyebrow, Reveal } from "./shared";
import styles from "@/app/landing.module.css";

function MealLogger() {
  return (
    <div className={styles.productPanel}>
      <PanelHead
        label="TODAY · NUTRITION"
        title="Meal log"
        badge="1,684 kcal"
      />
      <div className={styles.searchBar}>
        <Search size={16} />
        <span>Describe a meal or search foods…</span>
      </div>
      <div className={styles.quickRow}>
        <button>
          <Repeat2 size={14} /> Yesterday&apos;s breakfast
        </button>
        <button>
          <Sparkles size={14} /> Log with AI
        </button>
      </div>
      <div className={styles.adviceMock}>
        <div>
          <Sparkles size={14} />
          <span>
            <strong>Ask Calibra</strong>
            <small>Advice for eating or lifting</small>
          </span>
        </div>
        <b>Plus</b>
      </div>
      <div className={styles.tableLabel}>
        <span>BREAKFAST</span>
        <span>612 kcal</span>
      </div>
      {[
        ["Greek yogurt bowl", "32g", "68g", "12g", "508"],
        ["Flat white", "6g", "10g", "4g", "104"],
      ].map((m) => (
        <div className={styles.foodRow} key={m[0]}>
          <div className={styles.foodIcon}>
            <Utensils size={15} />
          </div>
          <div>
            <strong>{m[0]}</strong>
            <small>
              Protein {m[1]} · Carbs {m[2]} · Fat {m[3]}
            </small>
          </div>
          <b>{m[4]}</b>
        </div>
      ))}
      <div className={styles.macroFooter}>
        {[
          ["Protein", "118", "150g"],
          ["Carbs", "176", "220g"],
          ["Fat", "52", "70g"],
        ].map((m) => (
          <div key={m[0]}>
            <span>{m[0]}</span>
            <strong>
              {m[1]} <small>/ {m[2]}</small>
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
}
function PanelHead({
  label,
  title,
  badge,
}: {
  label: string;
  title: string;
  badge: string;
}) {
  return (
    <div className={styles.panelTop}>
      <div>
        <span className={styles.panelLabel}>{label}</span>
        <h3>{title}</h3>
      </div>
      <span className={styles.panelBadge}>{badge}</span>
    </div>
  );
}
function TrendChart() {
  return (
    <div className={styles.productPanel}>
      <div className={styles.panelTop}>
        <div>
          <span className={styles.panelLabel}>PROGRESS · 28 DAYS</span>
          <h3>Energy & weight trend</h3>
        </div>
        <span className={styles.adaptiveBadge}>
          <TrendingUp size={13} /> Target adapted
        </span>
      </div>
      <div className={styles.metricRow}>
        {[
          ["Current target", "2,340", "kcal"],
          ["Estimated TDEE", "2,610", "kcal"],
          ["Weight trend", "–0.38", "kg/wk"],
        ].map((m) => (
          <div key={m[0]}>
            <span>{m[0]}</span>
            <strong>
              {m[1]} <small>{m[2]}</small>
            </strong>
          </div>
        ))}
      </div>
      <div className={styles.chartWrap}>
        <div className={styles.chartAxis}>
          <span>2,800</span>
          <span>2,400</span>
          <span>2,000</span>
        </div>
        <svg
          viewBox="0 0 640 230"
          role="img"
          aria-label="Calorie intake and adaptive TDEE trend">
          <g className={styles.grid}>
            <path d="M0 25H640M0 100H640M0 175H640" />
          </g>
          <path
            className={styles.area}
            d="M0 77C60 70 82 84 130 72S220 56 275 66S360 79 420 58S530 43 640 47L640 230L0 230Z"
          />
          <path
            className={styles.tdeeLine}
            d="M0 77C60 70 82 84 130 72S220 56 275 66S360 79 420 58S530 43 640 47"
          />
          <path
            className={styles.intakeLine}
            d="M0 150L48 117L96 145L144 98L192 132L240 108L288 141L336 119L384 158L432 126L480 108L528 137L576 101L640 116"
          />
          <circle cx="640" cy="47" r="5" className={styles.chartPoint} />
        </svg>
        <div className={styles.chartLegend}>
          <span>
            <i className={styles.orangeKey} />
            Estimated TDEE
          </span>
          <span>
            <i />
            Daily intake
          </span>
          <b>Target +50 kcal</b>
        </div>
      </div>
    </div>
  );
}
function WorkoutLogger() {
  return (
    <div className={styles.productPanel}>
      <PanelHead
        label="WORKOUT · PUSH A"
        title="Today’s training"
        badge="42:18"
      />
      <div className={styles.workoutSummary}>
        <div>
          <Dumbbell size={18} />
          <span>
            <strong>6 exercises</strong>
            <small>18 working sets</small>
          </span>
        </div>
        <button>
          <Repeat2 size={14} /> Reuse template
        </button>
      </div>
      <div className={styles.setHead}>
        <span>EXERCISE</span>
        <span>PREVIOUS</span>
        <span>SET</span>
        <span>REPS</span>
      </div>
      {[
        ["Bench press", "Barbell · Chest", "80 × 6", "82.5 kg", "6"],
        ["Incline dumbbell press", "Dumbbell · Chest", "30 × 9", "30 kg", "10"],
        [
          "Cable lateral raise",
          "Cable · Shoulders",
          "7.5 × 12",
          "7.5 kg",
          "13",
        ],
      ].map((e) => (
        <div className={styles.exercise} key={e[0]}>
          <div className={styles.exerciseTitle}>
            <strong>{e[0]}</strong>
            <small>{e[1]}</small>
          </div>
          <span>{e[2]}</span>
          <b>{e[3]}</b>
          <b>{e[4]}</b>
        </div>
      ))}
      <div className={styles.personalBest}>
        <TrendingUp size={15} />
        <span>
          <strong>Volume is up 6%</strong>
          <small>compared with your last Push A</small>
        </span>
      </div>
    </div>
  );
}
function Story({
  eyebrow,
  title,
  copy,
  bullets,
  children,
  reverse = false,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  bullets: string[];
  children: React.ReactNode;
  reverse?: boolean;
}) {
  return (
    <section className={`${styles.story} ${reverse ? styles.reverse : ""}`}>
      <Reveal className={styles.storyCopy}>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2>{title}</h2>
        <p>{copy}</p>
        <ul>
          {bullets.map((b) => (
            <li key={b}>
              <Check size={15} />
              {b}
            </li>
          ))}
        </ul>
      </Reveal>
      <Reveal className={styles.storyVisual} delay={0.08}>
        {children}
      </Reveal>
    </section>
  );
}
export function ProductStories() {
  return (
    <div id="features" className={styles.stories}>
      <Story
        eyebrow="LOG IN SECONDS"
        title="Tracking shouldn’t become another chore."
        copy="Save meals, reuse templates, and log what you eat without slowing down your day."
        bullets={[
          "Reuse a recent meal in one tap",
          "Review macros before anything is saved",
        ]}>
        <MealLogger />
      </Story>
      <Story
        reverse
        eyebrow="ADAPTIVE TARGETS"
        title="Your calorie target should change when your body does."
        copy="CalStory adjusts your target from your actual weight trend instead of freezing you to one number."
        bullets={[
          "See calories and TDEE on the same chart",
          "Small adjustments with a clear reason",
        ]}>
        <TrendChart />
      </Story>
      <Story
        eyebrow="TRAINING INCLUDED"
        title="Your food and your lifts belong in the same system."
        copy="Track sets, reps, weight, templates, cardio, and nutrition without jumping between apps."
        bullets={[
          "Reuse last week’s workout in one tap",
          "Compare volume and performance over time",
        ]}>
        <WorkoutLogger />
      </Story>
    </div>
  );
}
