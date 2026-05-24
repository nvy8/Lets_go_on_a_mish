# Scientific & pedagogical foundations for Sleuth

A distilled, Sleuth-specific synthesis of the research base from an external sister document on critical-thinking edtech for ages 9-14. Project-specific names, rank systems, and surface metaphors from that document have been deliberately excluded — only the underlying research findings are kept, mapped onto Sleuth's actual 5-stage architecture (`Query Design → Investigate → Triangulate → Explain → Spot Hallucinations`).

> **How to use this document.** Before changing any kid-facing copy, microinteraction, or stage flow, check whether one of the findings below already constrains the choice. Where a study or framework directly applies to a stage, the §-link to a Sleuth surface is called out.
>
> This is *evidence to argue from*, not a checklist. Where two findings conflict (e.g. competence cues vs. anti-leaderboard), the conflict itself is noted.

---

## Table of contents

1. [Pedagogical frameworks that shape gated stages](#1-pedagogical-frameworks-that-shape-gated-stages)
2. [Critical-thinking frameworks for the open web](#2-critical-thinking-frameworks-for-the-open-web)
3. [What "gamification" actually means here](#3-what-gamification-actually-means-here)
4. [Intrinsic motivation design](#4-intrinsic-motivation-design)
5. [Cognition & visual design for ages 9-14](#5-cognition--visual-design-for-ages-9-14)
6. [Responsible AI as an "unreliable witness"](#6-responsible-ai-as-an-unreliable-witness)
7. [Anti-patterns to refuse (with citation)](#7-anti-patterns-to-refuse-with-citation)
8. [Accessibility & inclusion](#8-accessibility--inclusion)
9. [Ethics, GDPR-K & child safety](#9-ethics-gdpr-k--child-safety)
10. [Sleuth-specific application map](#10-sleuth-specific-application-map)

---

## 1. Pedagogical frameworks that shape gated stages

### 1.1 Zone of Proximal Development (ZPD) + scaffolding — Vygotsky

**Finding.** Learning happens at the edge of what a learner can do unaided — neither too easy (boredom) nor too hard (frustration). Adult/peer/system support is gradually withdrawn as competence grows.

**Where this lives in Sleuth.**
- The 5-stage gating *is* scaffolding: each stage is a discrete sub-task the kid couldn't do solo, with a structured support around it.
- The Stage 1 "pick the strongest of 3 examples → then write your own" sequence is textbook scaffolding (worked-example → fading → independent practice).
- The AI coach in Stage 1 critiques but does not write the question for the kid — the help is a *hint*, not the answer.

**Anti-pattern.** "Help" buttons that produce the answer in one click. Removes the productive struggle that drives encoding.

**Sources.** Vygotsky (1978), *Mind in Society*. Wood, Bruner & Ross (1976), "The Role of Tutoring in Problem Solving."

---

### 1.2 Mastery learning — Bloom

**Finding.** Advancement based on demonstrated competence (≥80%, repeatable), not on time spent. Bloom's "2 sigma" effect: mastery learning + 1:1 tutoring yields outcomes ~2 standard deviations above traditional classroom mean.

**Where this lives in Sleuth.**
- Stage 4's `ai_grade` field (`approaching | meeting | exceeding`, plus the un-typed `far_from` — see [reviews/CODE_REVIEW.md](../reviews/CODE_REVIEW.md) #9) is a mastery rubric.
- The "Wordsmith" badge is awarded when *every* fact reaches meeting+ — a competence threshold, not a time threshold.

**Anti-pattern.** "X minutes per day" as a primary progress metric — time ≠ learning.

**Gap to close in Sleuth.** There is no real re-take loop today; Stage 4 / Stage 5 fail-states should ideally let the kid try again on the same content rather than progress with a low grade. Worth a future spec.

**Sources.** Bloom (1984), "The 2 Sigma Problem" — *Educational Researcher*.

---

### 1.3 Retrieval practice & spaced repetition

**Finding.** Active recall consolidates better than re-reading. Karpicke & Roediger (2008): students who took repeated quizzes retained ~50% more at 1 week than those who re-read the same material.

**Where this lives in Sleuth.** Not currently — Sleuth is a single-pass artifact. A kid completes the mission, gets the PDF, leaves.

**Future direction.** A retrieval check after N days ("a source you used in Mission X — is it still credible today?") would compound learning. Scope-creep for the hackathon prototype, worth a v2 spec.

**Sources.** Karpicke & Roediger (2008), *Science*. Cepeda et al. (2008), *Psychological Science*.

---

### 1.4 Growth mindset — Dweck

**Finding.** Process praise ("you used a good strategy") beats trait praise ("you're smart") in producing persistence on hard tasks. Trait praise after failure causes children to disengage faster (Mueller & Dweck, 1998).

**Where this lives in Sleuth.**
- Stage 1 critique copy: "Coach says: almost there" — process, not trait.
- Stage 4 verify-click reject toast (post-iconography pass) uses a thinking face 🤔 and an inviting "look again", not a punitive "wrong".
- Badge names should be **process** ("Triangulator", "Hallucination Hunter") — about *what the kid did*, not *what the kid is* ("Detective Genius").

**Anti-pattern in current copy.** "Nice eye!" — borderline trait. "Awesome!" — too generic to teach anything. See [§10 application map](#10-sleuth-specific-application-map) for the exact strings worth re-writing.

**Sources.** Dweck (2006), *Mindset*. Mueller & Dweck (1998), *JPSP*.

---

## 2. Critical-thinking frameworks for the open web

### 2.1 SIFT — Caulfield (University of Washington, Center for an Informed Public)

The contemporary replacement for the older CRAAP test, which over-emphasizes on-page evaluation.

> **S**top → **I**nvestigate the source → **F**ind better coverage → **T**race claims to the original

**This is the spine of Sleuth.** The 5 stages map almost 1:1 onto SIFT:

| SIFT move | Sleuth stage | What the kid actually does |
|---|---|---|
| **S — Stop** | Stage 1: Query Design | Pause before searching. Frame a sharper question. |
| **I — Investigate the source** | Stage 2: Investigate | Judge each candidate source Legit / Sus. |
| **F — Find better coverage** | Stage 3: Triangulate | Look for the same fact in multiple independent sources. |
| **T — Trace claims** | Stage 4: Explain | Articulate where each fact came from and what it means. |
| (meta) | Stage 5: Spot Hallucinations | Apply the whole stack to an AI-generated artifact. |

**Anti-pattern.** Teaching kids to evaluate by *site design* or *`.org` in URL* — Wineburg & McGrew (2017) showed propaganda sites that mimic institutional design fool even history teachers.

**Sources.** Caulfield (2017+), "SIFT: The Four Moves" — UW / Hapgood. Endorsed by News Literacy Project and Poynter MediaWise.

---

### 2.2 Lateral reading — Stanford History Education Group

**Finding.** Professional fact-checkers open 5-10 tabs **about** a source before reading 2 paragraphs **from** it. Students do the opposite and get systematically fooled.

**Where this lives in Sleuth.** Stage 2 ("Investigate") asks kids to judge each candidate Legit/Sus — but the kid's signal today is primarily the URL preview text shown next to it. To honor lateral reading properly, Stage 2 would need a "who is this publisher?" hint that's *not* from the article itself.

**Gap to close.** A small "About this site" affordance on each candidate that links to a Wikipedia-style publisher summary, not the article's "About" page (which is self-reported).

**Anti-pattern.** Telling kids "look at the site design" or "check the URL ending" as credibility heuristics — Wineburg's research shows these fail catastrophically.

**Sources.** Wineburg & McGrew (2017), Stanford HEG. Wineburg et al. (2022), *J. Educational Psych.*

---

### 2.3 Triangulation — the "rule of three"

**Finding.** Journalistic standard: a claim verified by ≥3 *independent* sources is far less likely to be a hallucination, circular citation, or echo-chamber artifact.

**Where this lives in Sleuth.** Stage 3 ("Triangulate") *is* this. The split-screen "click ✓ when you see the fact in this source" is the operationalization.

**Risk in current implementation.** "Independent" is hard. Three articles that all republish the same wire story are not independent. The hardcoded fortified-churches dataset is curated to avoid this; in the open-LLM-generated path, the kid could end up triangulating on circular sources without realizing.

**Future hardening.** A lightweight check that warns: "These three sources all cite the same original — find one more."

**Sources.** Society of Professional Journalists, *Code of Ethics*. Reuters Handbook of Journalism.

---

## 3. What "gamification" actually means here

### 3.1 Hamari, Koivisto & Sarsa (2014) meta-analysis

**Finding.** Gamification works **inconsistently**. It works when points/badges are *semantically tied to the content*. It fails when they're cosmetic or competitive in abusive ways.

**Where this lives in Sleuth.**
- Badges are semantically tied: `Query Designer` ↔ Stage 1 mastery, `URL Detective` ↔ Stage 2, `Triangulator` ↔ Stage 3, `Wordsmith` ↔ Stage 4, `Hallucination Hunter` ↔ Stage 5. Each is the name of the *skill demonstrated*. ✅
- No XP currency, no level-up bar, no cosmetic upgrades. ✅
- Progress visualization = a stage progress bar + earned badges, not a points score. ✅

**Sources.** Hamari, Koivisto, Sarsa (2014), HICSS. Sailer & Homner (2020), *Educational Psychology Review*.

---

### 3.2 Leaderboards — refused by default

**Finding.** Public leaderboards in educational contexts produce:
- Chronic demotivation for kids in the bottom half (Hanus & Fox, 2015, *Computers & Education*).
- Overjustification effect at the top — kids learn for the rank, not the subject (Lepper, Greene, Nisbett, 1973).
- Social comparison anxiety amplified in adolescents (Twenge, 2017; Haidt, 2024 — caveated by Orben & Przybylski, 2019, who show aggregate effects are small).

**Where this lives in Sleuth.** No leaderboards exist. The closest thing is the teacher's mission dashboard, which is private to the teacher.

**Sources.** Hanus & Fox (2015). Lepper et al. (1973).

---

### 3.3 Narrative as a memory scaffold

**Finding.** Narrative activates episodic memory and improves retention compared to exercise lists. The detective metaphor is a natural carrier for critical-thinking work.

**Where this lives in Sleuth.** The detective theme runs through copy ("coach", "spot the fake", magnifying-glass mark, badge names). Worth preserving — it does pedagogical work, not just decorative.

**Caveat.** Keep the metaphor adjacent to the work, not in place of it (no mascot commenting on every action — see §7 and design-improvements §6.2).

**Sources.** Bower (1976), Bruner (1991).

---

## 4. Intrinsic motivation design

### 4.1 Self-Determination Theory — Deci & Ryan

**Finding.** Durable intrinsic motivation requires three nutrients: **autonomy**, **competence**, **relatedness**. External rewards can corrode intrinsic motivation if they become the goal (overjustification).

**Where this lives in Sleuth.**
- **Autonomy:** the kid writes their own research question in Stage 1, judges sources in Stage 2, writes their own explanations in Stage 4. The mission topic is teacher-chosen, but the *path through it* is the kid's.
- **Competence:** the badges + the final PDF brief are concrete competence cues.
- **Relatedness:** weaker today — the "coach" is the AI, and there is no peer or teacher visibility *to the kid*. This is a deliberate child-safety trade-off (no chat, no comments), but it's worth knowing the relatedness budget is intentionally thin.

**Anti-pattern.** Virtual coins spent on cosmetic upgrades. "You haven't earned XP today!" pings.

**Sources.** Deci & Ryan (1985), (2000).

---

### 4.2 Flow — Csikszentmihalyi

**Finding.** Optimal engagement state when *challenge = ability*, with clear goals + immediate feedback.

**Where this lives in Sleuth.** Each stage states its goal upfront, gives immediate feedback (Stage 1 critique, Stage 3 verify-click toast, Stage 4 grade, Stage 5 reveal). Difficulty is *not* dynamically calibrated today — every kid sees the same number of sources, the same number of facts to find. Worth a future variation pass for differentiation.

**Sources.** Csikszentmihalyi (1990), *Flow*.

---

## 5. Cognition & visual design for ages 9-14

### 5.1 Cognitive Load Theory — Sweller; "magic number 4" — Cowan

**Finding.** Working memory holds ~4 chunks simultaneously. A cluttered UI destroys learning regardless of aesthetic merit.

**Where this lives in Sleuth.**
- One main task per screen, enforced by the gated 5-stage flow. ✅
- Stage 3 surfaces N facts in a sidebar (typically 4-6), under the limit. ✅
- Animation budget is intentionally tiny (4 microinteractions per [DESIGN_IMPROVEMENTS_FOR_KIDS.md §7](DESIGN_IMPROVEMENTS_FOR_KIDS.md)). ✅

**Anti-pattern.** Edtech dashboards with 20 widgets. Decorative motion on reading surfaces.

**Sources.** Sweller (1988), *Cognitive Science*. Cowan (2001), *Behavioral and Brain Sciences*.

---

### 5.2 Mayer's principles of multimedia learning

Most directly relevant to Sleuth's copy and microinteractions:

| Principle | Implication for Sleuth |
|---|---|
| **Coherence** | Strip anything that does not serve the task — no background music, no decorative GIFs. |
| **Signaling** | Cue what each stage will require *before* the kid starts. The Stage 1 loading copy is the highest-leverage signaling moment — see [§10](#10-sleuth-specific-application-map). |
| **Modality** | Voice-over + image beats text + image for younger kids who still read with effort. Sleuth is text-only today (deliberately, for classroom use); if a v2 adds audio, it should *replace* text on key instructions, not duplicate it. |
| **Personalization** | Second-person conversational tone ("Take a breath — researchers always pause") beats third-person formal. |

**Anti-pattern.** Autoplay videos longer than ~6 minutes (Guo et al. 2014, edX drop-off data).

**Sources.** Mayer (2009), *Multimedia Learning* (2nd ed.).

---

### 5.3 Age-appropriate design at 9-14

| Aspect | What 9-14 needs |
|---|---|
| Touch target | 48-64 px (lower band of the under-9 80px guideline, upper band of the adult 36-44 px floor). Sleuth's current kid CTA is ~64 px ✅. |
| Tone | Conversational, second person. Avoid "we" if it sounds patronizing ("let's all sit on the rug"); use it when it genuinely conveys partnership ("we'll look at three together"). |
| Mascots | Avoid. The 9-14 band is past mascot-tolerant; a cartoon detective commenting on actions reads as cringe. Detective *theme* is fine; detective *avatar* is not. |
| Density | 1 task per kid screen. 3-5 dashboard items for the teacher screen. |
| Error tone | Specific + actionable + non-blaming. "Look again at source 2 — it might be circular" beats "Wrong" or "Oops!" |

**Sources.** Nielsen Norman Group, "Children's UX" (2019 update). Material Design accessibility.

---

## 6. Responsible AI as an "unreliable witness"

### 6.1 The hallucination problem is the curriculum

**Finding.** LLMs hallucinate 3-27% of factual claims (Ji et al., 2023). For a critical-thinking platform, this is *not a bug — it is the subject*.

**Where this lives in Sleuth.**
- **Stage 5 ("Spot Hallucinations")** is the literal embodiment: a clean version + 3 fakes, kid picks the accurate one.
- **Stage 2** mixes 5 real web results with 5 LLM-generated results — kids learn to judge without being told which is which.
- **Stage 4** uses AI to grade explanations, but the kid's *own words* are graded against the *source material*, not against AI knowledge.

**Anti-pattern.** A chatbot that answers "with everything it knows" "with confidence" — collapses the cross-examination loop. ❌ Sleuth's `runClaude()` invocations are scoped via stage-specific prompts in [lib/prompts/](../../lib/prompts/) precisely to avoid this.

**Sources.** Ji et al. (2023), *ACM Computing Surveys*. UNESCO (2023), "Guidance for Generative AI in Education and Research." Mollick & Mollick (2024), *Co-Intelligence*.

---

## 7. Anti-patterns to refuse (with citation)

Each of these is a thing many edtechs *do* and Sleuth deliberately *does not*. The citation matters because it lets a future product decision be argued from evidence, not taste.

| Anti-pattern | Effect on minors | Source | Sleuth status |
|---|---|---|---|
| **Variable-ratio rewards / loot box** | Cultivates compulsive behavior; banned in age-appropriate codes | Schüll (2012); ICO UK Age-Appropriate Design Code (2021); 5Rights Foundation | ✅ Not present. Badges are deterministic and tied to demonstrated skill. |
| **Streaks / "don't break the chain"** | Loss-aversion-driven anxiety; "30-second engagement" pattern that produces zero learning | Kahneman & Tversky (1979) on loss aversion; press coverage of streak-mechanic harms (2024) | ✅ Not present. No daily counter, no flame icon. |
| **Infinite scroll / autoplay-next** | Destroys metacognitive control over time | Tristan Harris / CHT | ✅ Not present. Mission ends on the Complete page; no "next mission" autoload. |
| **Manipulative push notifications** | Attention fragmentation, ~23 min recovery time per interruption | Mark, *UC Irvine* (2018) | ✅ Not present. Sleuth has no notification surface at all. |
| **Confirmshaming / fake countdowns / fake "N kids online now"** | Manipulates minors emotionally; banned in ICO code | Brignull, *deceptive.design*; Gray et al. (2018), CHI | ✅ Not present. |
| **Public leaderboards** | Chronic demotivation + adolescent social-comparison harm | Hanus & Fox (2015); Haidt (2024), caveat Orben & Przybylski (2019) | ✅ Not present. |

These are *active* design refusals, not accidents. When evaluating a future feature, "but $POPULAR_APP does this" is not an argument — the citations above are.

---

## 8. Accessibility & inclusion

- **WCAG 2.2 AA as the floor.** Text contrast 4.5:1 minimum, 3:1 for large text. (Tracked in [reviews/DESIGN_REVIEW.md](../reviews/DESIGN_REVIEW.md) §3.)
- **Keyboard navigation throughout.** Sleuth is mouse + touch friendly today; keyboard focus rings are partially addressed in the 2026-05-23 design pass but Stage 4 + Stage 5 specifically need a focus audit.
- **Screen readers.** Phosphor icons use `aria-hidden="true"` for decorative use (per the [2026-05-24 iconography pass](../changelog/2026-05-24-iconography-pass.md)). Live regions for stage transitions are not implemented yet — a future improvement.
- **Dyslexia-friendly font option.** Not implemented; worth a settings panel post-hackathon (Atkinson Hyperlegible is OFL-licensed and ships well via `next/font`).

**Sources.** W3C WCAG 2.2.

---

## 9. Ethics, GDPR-K & child safety

### 9.1 Legal frame

- **GDPR + GDPR-K (EU).** Parental consent required under 16 (RO: under 16 per Legea 190/2018).
- **UK Age-Appropriate Design Code (ICO, 2021).** Best practice even for non-UK products targeting minors.
- **OECD Recommendation on Children in the Digital Environment (2021).**
- **EU AI Act** (rolling in 2024-2026). Educational AI is classified *high-risk* — implications for any future automatic grading.

### 9.2 What Sleuth already does right

- No PII collected from kids (display name only). ✅
- No third-party trackers, no advertising, no public sharing of kid activity. ✅
- Strictest privacy defaults — explicit privacy notice on join. ✅
- Auth model documented separately in [AUTHENTICATION.md](../AUTHENTICATION.md).

### 9.3 What still needs attention

- Teacher consent / parent consent flow for under-13 is not modeled. The hackathon-scope assumption is "the teacher has consent". For real deployment, an explicit parental-consent screen is required.
- Data retention policy is not documented (Mongo TTL drops idle sessions after 30 days — implicit, not stated).
- The "auto-grading is illegal under EU AI Act" line in README is correct as a caveat — Sleuth's grades today are *formative feedback*, not graded assessments. That distinction must remain explicit.

**Sources.** UNESCO (2023). ICO UK (2021). OECD (2021). Legea 190/2018 (RO).

---

## 10. Sleuth-specific application map

Where each research finding *should* show up in the current codebase. Use as a checklist for future copy/design work.

| Sleuth surface | Research lever | Status today | Highest-leverage next change |
|---|---|---|---|
| **Stage 1 title** ("Query Design") | Growth mindset §1.4 (process verb, not noun), Mayer Personalization §5.2 | Jargon noun phrase | Verb-led: "Sharpen your question" |
| **Stage 1 loading copy** ("Your coach is writing some examples… / takes about 5 seconds") | Mayer Signaling §5.2, SIFT-Stop §2.1, anti-pattern §7 (no fake urgency) | Apologetic, no priming | Tell the kid what's coming + reframe the wait: "Drafting 3 questions for you to compare. / Take a breath — researchers always pause before they search." |
| **Stage 1 pick-phase H2** ("🤔 Which question is best?") | SIFT-Stop §2.1, growth mindset §1.4 | Good; minor polish possible | Keep |
| **Stage 1 critique copy** ("Coach says: awesome!") | Growth mindset §1.4 (avoid trait praise) | Borderline — "awesome" is generic | Make process-specific: "Coach says: that question will find a real answer" |
| **Stage 2 source cards** | Lateral reading §2.2 | Preview is from the article itself | Add an "About this publisher" link to a *third-party* summary |
| **Stage 3 triangulation toast** ("Hmm — that fact isn't in this source") | Growth mindset §1.4 (non-blaming), SDT competence §4.1 | Already supportive ✅ | Keep |
| **Stage 4 grade band ("approaching/meeting/exceeding")** | Mastery learning §1.2 | Good rubric, no re-take loop | Allow re-attempt at the same fact when grade < meeting |
| **Stage 5 reveal** | AI as unreliable witness §6.1 | Strong — but a teaching note on *why* the fakes are wrong would deepen the lesson | Add a 1-line "why this was fake" tag per option, not just `kind` chip |
| **Badge names** | Hamari §3.1 (semantic), growth mindset §1.4 (process) | All process-based ✅ | Keep |
| **Final PDF brief** | SDT competence §4.1, narrative §3.3 | Real artifact, kid-named | Embed Geist (brand consistency) per design §3.4 |
| **No leaderboards** | §3.2 | ✅ Refused | Maintain when adding teacher-dashboard features |
| **No streaks / notifications** | §7 | ✅ Refused | Maintain |
| **No mascot** | §5.3 | ✅ Refused (theme without avatar) | Maintain |

---

## Consolidated bibliography (Sleuth-relevant subset)

**Pedagogy & cognition**
- Vygotsky, L. (1978). *Mind in Society.*
- Wood, Bruner & Ross (1976). "The Role of Tutoring in Problem Solving."
- Bloom, B. (1984). "The 2 Sigma Problem." *Educational Researcher.*
- Mayer, R. (2009). *Multimedia Learning* (2nd ed.).
- Karpicke & Roediger (2008). "The Critical Importance of Retrieval for Learning." *Science.*
- Dweck, C. (2006). *Mindset.*
- Mueller & Dweck (1998). "Praise for Intelligence Can Undermine Children's Motivation." *JPSP.*
- Csikszentmihalyi, M. (1990). *Flow.*
- Sweller, J. (1988). "Cognitive Load During Problem Solving." *Cognitive Science.*
- Cowan, N. (2001). "The magical number 4 in short-term memory." *BBS.*

**Critical thinking & information literacy**
- Caulfield, M. (2017+). *SIFT: The Four Moves.* UW / Hapgood.
- Wineburg & McGrew (2017). "Lateral Reading." Stanford HEG.
- Wineburg et al. (2022). *J. Educational Psychology.*
- Reuters Handbook of Journalism (sourcing chapter).

**Motivation & gamification**
- Deci & Ryan (1985); (2000). Self-Determination Theory.
- Hamari, Koivisto, Sarsa (2014). "Does Gamification Work?" HICSS.
- Sailer & Homner (2020). *Educational Psychology Review.*
- Hanus & Fox (2015). *Computers & Education.*
- Lepper, Greene, Nisbett (1973). Overjustification.

**Social media / attention / anti-patterns**
- Haidt (2024). *The Anxious Generation.* (with the caveat of Orben & Przybylski, 2019, *Nature Human Behaviour*).
- Twenge (2017). *iGen.*
- Schüll (2012). *Addiction by Design.*
- Mark (2018). UC Irvine. Interruption recovery.
- Brignull, *deceptive.design.* Gray et al. (2018), CHI.

**AI in education**
- Ji et al. (2023). "Survey of Hallucination in NLG." *ACM CSUR.*
- Mollick, E. (2024). *Co-Intelligence.*
- UNESCO (2023). "Guidance for Generative AI in Education and Research."

**Child-safety regulation**
- ICO UK (2021). "Age-Appropriate Design Code."
- OECD (2021). "Recommendation on Children in the Digital Environment."
- Legea 190/2018 (RO), GDPR-K (EU).
- EU AI Act (in force progressively 2024-2026).

---

*Last reviewed: 2026-05-24. The application-map table in §10 is the working document — keep it current as copy/design changes land.*
