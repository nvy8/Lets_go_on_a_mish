# Sleuth — Teacher Flow & Example Setups

A walkthrough of the teacher experience — **Project → Missions → Live class monitoring → Per-student drilldown** — with **three worked examples** that mirror the three kid-flow examples in [KID_FLOW_EXAMPLES.md](./KID_FLOW_EXAMPLES.md).

Audience: designers, copywriters, teachers, and anyone tuning project templates, mission copy, or analytics surfaces.

> Pairs with the kid-flow doc: each worked example here sets up the mission that the same-numbered kid example runs through. Read both side-by-side to see the full picture — what the teacher *plans* and what the kid then *does*.

---

## The flow at a glance

| Step | Surface | What the teacher does | What success looks like |
|------:|---------|-----------------------|--------------------------|
| 1 | **Dashboard** | New project *(or)* New standalone mission | A bundle exists, or a single mission is ready to share |
| 2 | **Project detail** | Add missions to weeks, edit week-count, archive when done | Missions appear under "Week N" headers, ordered |
| 3 | **Mission detail** | Copy the share link, drop into Google Classroom | Kids start joining; share-link card is the primary action |
| 4 | **Your class** (mission detail, lower section) | Watch joins / progress / active-now, filter by status, sort | Live picture of where the class is — bunched at a stage, spread out, or finishing |
| 5 | **Per-student drilldown** | Open a kid's row → see badges, refined query, per-stage scores | Decide who needs help, who's ready for the next mission |
| 6 | **End-of-unit** | CSV export → gradebook; archive the project | Records preserved, dashboard stays tidy |

Each step is **optional except the mission itself** — a teacher can ship one standalone mission without ever touching projects.

---

## Example 1 — Marine biology unit (Year 4, 3 weeks)

**Pairs with kid example 1: "Why do octopuses change color?"**

### Step 1 — Create the project

On **/teacher/dashboard**, the teacher clicks **New project**:

| Field | Value |
|---|---|
| Name | *"Year 4 — Ocean Investigators"* |
| Description | *"3-week unit on marine animals. Two missions per week. Kids pick one animal per week to research."* |
| Week count | `3` |

Saved → a yellow post-it card with a red thumbtack appears on the dashboard under **Your projects**. Stat row reads `0 missions · 0 kids joined · 0 active`.

### Step 2 — Add the missions

Teacher clicks the project card → lands on **/teacher/projects/[id]**. Inline **Add mission** form, week-number picker bounded to `1..3`:

| Week | Title | Topic | Knowledge base hint |
|:---:|---|---|---|
| 1 | *Color-changing octopuses* | Why and how do octopuses change color? | "Focus on chromatophores. Trusted: NatGeo Kids, Monterey Bay Aquarium." |
| 1 | *Why dolphins sleep with one eye open* | How do dolphins rest in the ocean? | "Look for the term 'unihemispheric sleep'. Trusted: NOAA, BBC Earth." |
| 2 | *Coral bleaching* | What makes corals turn white? | "Focus on temperature + zooxanthellae. Trusted: NOAA, Australian Institute of Marine Science." |
| 2 | *How sharks find prey* | What senses do sharks use to hunt? | "Look for 'ampullae of Lorenzini'. Trusted: Smithsonian Ocean, Florida Museum." |
| 3 | *Bioluminescent jellyfish* | Why do some jellyfish glow? | "Focus on aequorin / GFP. Trusted: MBARI, Smithsonian." |
| 3 | *Whale migration* | Why do humpback whales swim so far? | "Look at feeding vs. breeding grounds. Trusted: NOAA Fisheries, IWC." |

After saving all six, the page auto-groups:

```
Week 1
  ▸ Color-changing octopuses    [Open] [Remove from project]
  ▸ Why dolphins sleep with one eye open
Week 2
  ▸ Coral bleaching
  ▸ How sharks find prey
Week 3
  ▸ Bioluminescent jellyfish
  ▸ Whale migration
```

Each mission card auto-tilts (`rotate-2` / `-rotate-2` alternating) for the hand-drawn feel.

### Step 3 — Share the first mission

Teacher clicks **Open** on *Color-changing octopuses* → lands on **/teacher/missions/[id]**.

Top of page shows a "**Part of: Year 4 — Ocean Investigators · Week 1 · #1**" chip (clickable, returns to the project). Below the H1, the **Share with your class** card holds:

- Big copyable link `https://sleuth.app/m/oc7-x3p2-z9q`
- *"Drop this into your Google Classroom assignment. Kids tap → pick a nickname → start Stage 1."*
- QR code option for on-screen projection

Teacher copies the link, posts to Classroom.

### Step 4 — Watch the class come in

Within 5 minutes of posting, the **Your class** section under the share card starts populating. After 20 minutes:

**Summary cards (top row):**

| Joined | Completed | Active now | Avg / median time |
|:------:|:---------:|:----------:|:------------------:|
| 22 | 0 | 18 *(post-it green flip)* | 11m / 9m |

**Where the class is now** (stage distribution):

```
Done   Stage 1   Stage 2   Stage 3   Stage 4   Stage 5
  0      4        9         7         2         0
  (dim)  18%      41%       32%       9%        (dim)
```

→ Teacher's read: most kids made it past Stage 1 into source-judging and triangulation — the question-picking step is landing fine. Two kids are already at Stage 4 (Explain) — the strong starters.

**Controls row:** search by nickname, filter chips (`Everyone 22 · Active now 18 · In progress 22 · Done 0`), sort by *last active* (default).

**Table (top 5 rows):**

| ● | Nickname | Progress | Badges | Time | Last active |
|:---:|---|---|:---:|:---:|---|
| 🟢 | `MaxR` | Stage 4 ▰▰▰▰▱ | 2 | 18m | 12s ago |
| 🟢 | `DragonHunter` | Stage 3 ▰▰▰▱▱ | 1 | 14m | 31s ago |
| 🟢 | `OctopusFan99` | Stage 3 ▰▰▰▱▱ | 1 | 16m | 1m ago |
| 🟢 | `Mira` | Stage 2 ▰▰▱▱▱ | 0 | 9m | 45s ago |
| ⚫ | `Theo` | Stage 1 ▰▱▱▱▱ | 0 | 5m | 4m ago |

(Auto-refreshes every 20s; teacher's manual **Refresh** button is in the header bar.)

### Step 5 — Drill into a student

Teacher clicks the row for `MaxR` → drilldown modal opens:

```
┌─────────────────────────────────────────────────────┐
│  MaxR · Stage 4 · 18m on task                      │
│  ▰▰▰▰▱  80%                                        │
│                                                     │
│  Badges earned                                      │
│  [🏅 URL Detective]  [🏅 Triangulator]             │
│                                                     │
│  📌 Research question                               │
│  "Why do octopuses change the color of their skin   │
│   so fast?"                                         │
│                                                     │
│  Stage scores                                       │
│  Stage 2 — sources legit'd       3 / 4    75%      │
│  Stage 3 — facts triangulated    3 / 5    60%      │
│  Stage 4 — explanations Meeting+  — pending —      │
│  Stage 5 — fakes spotted          — locked —       │
│                                                     │
│                              [Close]                │
└─────────────────────────────────────────────────────┘
```

→ Teacher's read: MaxR sailed through source-judging (matches kid-example 1's 3/4) and triangulation, currently writing the Stage 4 explanation. No intervention needed — let him finish.

### Step 6 — End of the lesson

After 50 minutes:

- 14 / 22 kids completed
- 6 stuck at Stage 4 (the explain step — matches the kid-flow doc note: *"Stage 4 is the most important moment"*)
- 2 stuck at Stage 2 (need teacher help judging Reddit-quality sources)

Teacher clicks **CSV** → `mission-oc7x3p2-students.csv` downloads with nickname, progress, badges, time, refined query, per-stage scores. Pastes into the class gradebook.

End of unit (3 weeks later): teacher opens the project, clicks **Archive** → project disappears from the default dashboard list. Reachable via **Show archived** toggle.

---

## Example 2 — Standalone mission (no project)

**Pairs with kid example 2: "How do bees make honey?"**

Not every mission belongs to a unit. A substitute teacher running a single one-off lesson, or a homework warm-up before a topic kicks off, doesn't need the project hierarchy.

### Step 1 — Dashboard, skip project

Teacher clicks **New mission** directly. The form:

| Field | Value |
|---|---|
| Title | *"Bee research warm-up"* |
| Topic | *How do bees turn flower nectar into honey?* |
| Add to a project | *(dropdown — leaves blank)* |
| Knowledge base | "Trusted: USDA Honey Bee Basics PDF, BBC Earth — Inside the Hive, Highlights kid magazine. Untrusted: honey-secrets-revealed.online (clickbait domain)." |

Saved → mission appears under **Standalone missions** on the dashboard (separate section from **Your projects**).

### Step 2 — Share

Same `/teacher/missions/[id]` page, but the "Part of" chip is **absent** — the back-link points to the dashboard instead of a project.

### Step 3 — Watch a smaller, faster class

This is a homework warm-up — 8 kids over 2 days, not 22 kids in a classroom hour. Stats are sparser:

| Joined | Completed | Active now | Avg / median |
|:------:|:---------:|:----------:|:------------:|
| 8 | 5 | 1 | 22m / 19m |

**Where the class is now:**

```
Done   Stage 1   Stage 2   Stage 3   Stage 4   Stage 5
  5      0        0         1         0         2
  63%    (dim)    (dim)     12%       (dim)     25%
```

→ Teacher's read: this mission produced a cleanly bimodal class — five kids finished, three are still trickling through. The single Stage-3 kid has been idle 6 hours; might need a nudge tomorrow.

### Step 4 — Drill into a stuck kid

Teacher clicks the row for `BeeKeeper42` (stuck at Stage 3, 6 hours idle):

```
BeeKeeper42 · Stage 3 · 14m on task
▰▰▰▱▱  60%

Badges earned
[🏅 URL Detective]

📌 Research question
"How do bees make honey from flowers?"

Stage scores
Stage 2 — sources legit'd       3 / 4    75%
Stage 3 — facts triangulated    1 / 5    20%   ← stuck here
Stage 4 — explanations Meeting+  — locked —
Stage 5 — fakes spotted          — locked —

Last active 6h ago
```

→ Triangulation is the friction. Teacher decides to spend 5 minutes tomorrow morning showing the class *how* to skim a PDF for a target fact, then re-share the link.

### Step 5 — No archive needed

Standalone mission stays on the dashboard. If teacher decides "this is actually the first of a series", they can later create a project and **PATCH** the mission into it (`project_id: <new project>, week_number: 1`) — no data loss, sessions stay attached, share link unchanged.

---

## Example 3 — Multi-class project with a misconception focus (Year 6, 2 weeks)

**Pairs with kid example 3: "Why is the sky blue?"**

This example shows what to do when you **want** the kids to hit a famous misconception (sky-blue-because-of-ocean) and use Stage 4 to surface it.

### Step 1 — Create the project

| Field | Value |
|---|---|
| Name | *"Year 6 — Light & Color"* |
| Description | *"2-week unit on light, color, and common misconceptions. Goal: each kid corrects at least one wrong intuition with a real source."* |
| Week count | `2` |

### Step 2 — Add missions tuned for misconceptions

| Week | Title | Topic | Knowledge base hint |
|:---:|---|---|---|
| 1 | *Why is the sky blue?* | Why does the sky look blue during the day but orange at sunset? | "Trusted: NASA SpacePlace, Met Office. **Watch for**: 'reflects the ocean' is a popular wrong answer — the kid should catch it in Stage 4." |
| 1 | *Why do mirrors flip left-right but not up-down?* | The 'mirror paradox' explained | "Trusted: reputable physics-education channels. Misconception: mirrors don't actually flip anything." |
| 2 | *Why is grass green?* | Chlorophyll and what light plants reflect | "Trusted: established educational biology resources, NASA Earth Observatory. Misconception: 'plants like green' — actually they REJECT green." |
| 2 | *Why do rainbows have those specific colors?* | Spectrum, refraction, why 7 bands | "Trusted: NOAA SciJinks, Met Office. Misconception: rainbows have 7 distinct bands — actually a continuous spectrum." |

### Step 3 — Run the first mission

Teacher pushes the link for *Why is the sky blue?* to **two parallel classes (6A + 6B)** — same mission, same share link, ~50 kids total.

After 30 minutes, the **Your class** view:

| Joined | Completed | Active now | Avg / median |
|:------:|:---------:|:----------:|:------------:|
| 47 | 4 | 39 | 14m / 12m |

```
Done   Stage 1   Stage 2   Stage 3   Stage 4   Stage 5
  4      2        8         11        18        4
  9%     4%       17%       23%       38%       9%
```

→ **The class bulge is at Stage 4** — exactly where the misconception lives. This is the design payoff.

### Step 4 — Filter for the misconception in real time

Teacher sorts by **last active** descending, scans the table. Three rows stand out:

| ● | Nickname | Progress | Badges | Time |
|:---:|---|---|:---:|:---:|
| 🟢 | `Sky_Curious` | Stage 4 ▰▰▰▰▱ | 2 | 16m |
| 🟢 | `LightFan` | Stage 4 ▰▰▰▰▱ | 2 | 15m |
| 🟢 | `BlueIsBest` | Stage 4 ▰▰▰▰▱ | 1 | 12m |

Clicks `Sky_Curious`:

```
Sky_Curious · Stage 4 · 16m on task
▰▰▰▰▱  80%

📌 Research question
"Why is the sky blue and not green?"

Stage scores
Stage 2 — sources legit'd       3 / 4    75%   (passed Quora trap)
Stage 3 — facts triangulated    3 / 3    100%  (Triangulator badge)
Stage 4 — explanations Meeting+  — currently writing —
```

Teacher doesn't intervene — the whole point of the mission is for kids to discover, in Stage 4, that the ocean-reflection answer doesn't match their sources, and rewrite. Pre-empting that learning moment kills the lesson.

### Step 5 — End-of-lesson reflection

Teacher pulls the CSV. Imports to Sheets. Pivots **Stage-4 grade** column:

| Grade | Count |
|---|:---:|
| Exceeding | 14 |
| Meeting | 19 |
| Approaching | 8 |
| Far from | 6 |

→ 14 kids hit the "I caught my own misconception" outcome. Six kids didn't — those become the focus of Friday's debrief lesson.

Teacher leaves the project **unarchived** for the second week, then archives at end-of-unit.

---

## Design notes for project / mission authors

### What makes a strong **project**?
- A real-world unit boundary the teacher already plans around — half-term, a 6-week module, a homework series. Not "a folder for missions I haven't thrown away yet".
- 2-12 missions. Smaller is a one-off (skip the project); larger is two projects.
- A **theme** kids can see the thread of, not a random grab-bag.

### What makes a strong **mission**?
- One question. One topic. 5 stages × ~10 min = ~50 min total.
- A topic where the kid-flow design notes' **strong question criteria** can be met (specific thing, asks WHY/HOW, observable phenomenon).
- A knowledge-base hint that names 2-3 trusted source domains *and* 1 misleading domain — gives Stage 2 something to compare.

### When to use **week_number** vs. just append
- Use week_number if the project is calendar-bound and missions release on a schedule. Auto-groups the project page under "Week N" headers.
- Skip week_number if missions can be done in any order. Project page renders a flat list.

### When to **archive** vs. **delete** a project
- **Archive** = unit is done, but you want the record / want to clone for next term. Missions stay attached, share links stay live (kids can still finish in-flight).
- **Delete** = made by mistake, or fully obsolete. Missions detach to standalone — they don't die. Sessions also live on (sessions are bound to mission, never to project).

### Reading the **Your class** view
- **Bulge at one stage** = the class is bunched. If it's Stage 1-2, the question/source step is too hard or too easy. If it's Stage 4, you've hit a productive misconception (Stage 4 is where the deepest learning happens — by design).
- **Bimodal (Done + early stages)** = the strong kids zipped through, the rest need scaffolding. Time to pause class and debrief.
- **Active-now high vs. Completed low** = mission is engaging but slow. Lengthen the lesson or shorten the mission.
- **Active-now zero and Completed low** = kids stalled and walked away. Check for a Stage 3 or Stage 4 blocker via drilldown.

### Per-student drilldown — what to look for
- **Stage 2 sources legit'd < 50%** = kid is trusting bad sources. Worth a 1:1.
- **Stage 3 facts triangulated < 40%** with high Stage 2 score = kid can judge a source but can't cross-check. Skill gap — debrief class on "find the same fact on 2 different sites".
- **Stage 4 still pending after 20+ min on task** = the explanation step is hard (good!). Don't rush them.
- **Stage 5 fakes spotted < 50%** = the kid is over-trusting AI-flavored text. Worth a class debrief on "AI tells" patterns.

---

## Tuning a project template

For a teacher publishing a project template that others can clone, supply:

- Project name + description + week_count.
- For each mission:
  - Title + topic (single-sentence research question).
  - Knowledge-base hint naming **2-3 trusted** sources and **1 untrustworthy** domain to surface in Stage 2.
  - Optional: a "watch for" note flagging the misconception you expect kids to hit in Stage 4.
- For multi-class deployment: note expected `time per kid` (default 50 min for a fresh mission, 20-25 min for a homework warm-up) so other teachers can budget.

Keep mission topics concrete, observable, and kid-curiosity-bait — same rule as the kid-flow doc: animals, weather, food, space, dinosaurs, plants, the body. The teacher surfaces don't change that — they just bundle and observe.

---

## Cross-reference

- Kid-side walkthrough of the 5 stages: [KID_FLOW_EXAMPLES.md](./KID_FLOW_EXAMPLES.md)
- Why projects exist + schema details: [../changelog/2026-05-24-projects-grouping-missions.md](../changelog/2026-05-24-projects-grouping-missions.md)
- Why the "Your class" analytics view exists + what it shows: [../changelog/2026-05-24-teacher-students-analytics.md](../changelog/2026-05-24-teacher-students-analytics.md)
