// End-to-end test runner — Stages 1-5 + complete with parameterised choices.
// Run: node test-e2e.mjs

const BASE = process.env.SLEUTH_BASE || "http://localhost:3000";
const SHARE = process.env.SHARE_TOKEN || "yUtB160NlxBG3tSF";

function logHeader(s) {
  console.log("\n" + "=".repeat(70) + "\n" + s + "\n" + "=".repeat(70));
}
function logStep(s) {
  console.log("\n--- " + s + " ---");
}

class CookieJar {
  constructor() { this.cookies = {}; }
  ingest(setCookieHeader) {
    if (!setCookieHeader) return;
    for (const c of setCookieHeader.split(/,(?=[^,]+?=)/)) {
      const [pair] = c.split(";");
      const [k, v] = pair.split("=");
      if (k && v) this.cookies[k.trim()] = v.trim();
    }
  }
  header() {
    return Object.entries(this.cookies).map(([k, v]) => `${k}=${v}`).join("; ");
  }
}

async function call(jar, method, path, body) {
  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(jar.header() ? { Cookie: jar.header() } : {}),
    },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(BASE + path, opts);
  jar.ingest(res.headers.get("set-cookie"));
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
}

async function runScenario(label, choosing) {
  logHeader(`SCENARIO: ${label}`);
  const jar = new CookieJar();
  const obs = { label, steps: [], badges: [], errors: [], blockers: [] };

  logStep("0. Join");
  const join = await call(jar, "POST", `/api/m/${SHARE}/join`, {
    display_name: `${choosing === "best" ? "Best" : "Worst"}Kid-${Date.now()}`,
  });
  console.log(`  join → ${join.status}`);
  if (join.status !== 200) { obs.blockers.push("join failed"); return obs; }

  logStep("1a. Stage 1 init");
  const s1init = await call(jar, "POST", "/api/stage/1/init");
  if (!s1init.data?.examples) { obs.blockers.push("stage1 init no examples"); return obs; }
  for (const ex of s1init.data.examples) console.log(`    [${ex.quality}] ${ex.text.slice(0,80)}`);

  logStep("1b. Stage 1 critique");
  const draft = choosing === "best"
    ? "Why exactly did Transylvanian Saxon villages build fortified walls around their churches in the 14th century, and what specific threats were they defending against?"
    : "What are the continents";
  const s1crit = await call(jar, "POST", "/api/stage/1/critique", { draft });
  console.log(`  critique verdict=${s1crit.data?.verdict}`);

  logStep("1c. Stage 1 accept");
  const s1acc = await call(jar, "POST", "/api/stage/1/accept", { refined_query: draft });
  console.log(`  accept → ${s1acc.status}`);
  if (s1acc.status === 200) obs.badges.push("Query Designer (always)");

  logStep("2a. Stage 2 previews");
  const s2prev = await call(jar, "POST", "/api/stage/2/previews");
  console.log(`  status ${s2prev.status}, ${Object.keys(s2prev.data?.previews || {}).length} previews`);

  logStep("2b. Stage 2 judge");
  const state2 = await call(jar, "GET", "/api/session/state");
  const candidates = state2.data?.session?.notepad?.candidate_sources || [];
  const kid_verdicts = {};
  for (const c of candidates) {
    kid_verdicts[c.id] = choosing === "best"
      ? (c.origin === "web" ? "legit" : "sus")
      : (c.origin === "web" ? "sus" : "legit");
  }
  const s2judge = await call(jar, "POST", "/api/stage/2/judge", { kid_verdicts });
  console.log(`  judge → ${s2judge.status} agree=${s2judge.data?.agree_count}/${s2judge.data?.total} badge=${s2judge.data?.earned_badge}`);
  if (s2judge.data?.earned_badge) obs.badges.push("URL Detective");

  // DIAGNOSTIC: dump verified_source_ids to investigate Stage 3 happy-path failure
  const state2b = await call(jar, "GET", "/api/session/state");
  const verifiedIds = state2b.data?.session?.notepad?.verified_source_ids || [];
  const candIds = (state2b.data?.session?.notepad?.candidate_sources || []).map((c) => c.id);
  const overlap = verifiedIds.filter((id) => candIds.includes(id));
  console.log(`  DIAG: verified_source_ids=${JSON.stringify(verifiedIds)}`);
  console.log(`  DIAG: candidate_ids count=${candIds.length}, verified∩candidates=${overlap.length}/3`);
  if (overlap.length < 3) {
    obs.blockers.push(`Stage 2 judge returned hallucinated top_3_ids: ${verifiedIds.join(",")} — only ${overlap.length} matched real candidates. This will block Stage 3.`);
  }

  await call(jar, "POST", "/api/stage/2/advance");

  logStep("3a. Stage 3 extract");
  const s3ext = await call(jar, "POST", "/api/stage/3/extract");
  console.log(`  status ${s3ext.status}, facts=${s3ext.data?.facts?.length || 0}`);
  if (s3ext.status !== 200) {
    obs.blockers.push(`Stage 3 extract HTTP ${s3ext.status}: ${JSON.stringify(s3ext.data)}`);
    return obs;
  }

  logStep("3b. Stage 3 verify-clicks");
  const state3 = await call(jar, "GET", "/api/session/state");
  const groundEv = state3.data?.session?.notepad?.fact_ground_truth_evidence || {};
  let triCount = 0;
  for (const f of s3ext.data.facts) {
    const truthMap = groundEv[f.id] || {};
    const evidenceList = (f.evidence || []).filter((e) => s3ext.data.sources.find((s) => s.id === e.source_id));
    let verifiedForFact = 0;
    for (const e of evidenceList) {
      const sourceSupports = truthMap[e.source_id] === true;
      const kidAns = choosing === "best"
        ? (sourceSupports ? "yes" : "no")
        : (sourceSupports ? "no" : "yes");
      const vc = await call(jar, "POST", "/api/stage/3/verify-click", {
        fact_id: f.id, source_id: e.source_id, kid_answer: kidAns,
      });
      if (vc.data?.verified) verifiedForFact++;
    }
    if (verifiedForFact >= 2) triCount++;
  }
  console.log(`  triangulated: ${triCount}/${s3ext.data.facts.length}`);
  const s3adv = await call(jar, "POST", "/api/stage/3/advance");
  console.log(`  advance → triangulated_count=${s3adv.data?.triangulated_count} badge=${s3adv.data?.earned_badge}`);
  if (s3adv.data?.earned_badge) obs.badges.push("Triangulator");

  logStep("4a. Stage 4 init (GET)");
  const s4init = await call(jar, "GET", "/api/stage/4/init");
  console.log(`  status ${s4init.status}, ${s4init.data?.facts?.length || 0} triangulated facts`);
  if (s4init.data?.facts?.length) {
    logStep("4b. Stage 4 grade each fact");
    for (const f of s4init.data.facts) {
      const explanation = choosing === "best"
        ? `In simple words, ${f.plain_text.toLowerCase()}. This matters because understanding it helps us see why this aspect of the world works the way it does and changes how we think about it.`
        : f.plain_text; // copy-paste
      const g = await call(jar, "POST", "/api/stage/4/grade", { fact_id: f.id, explanation });
      console.log(`    fact=${f.id.slice(0,6)} grade=${g.data?.grade}`);
    }
    const s4adv = await call(jar, "POST", "/api/stage/4/advance");
    console.log(`  advance → ${s4adv.status} badge=${s4adv.data?.earned_badge}`);
    if (s4adv.data?.earned_badge) obs.badges.push("Wordsmith");
  } else {
    obs.blockers.push("Stage 4: no triangulated facts");
  }

  logStep("5a. Stage 5 init");
  const s5init = await call(jar, "POST", "/api/stage/5/init");
  console.log(`  status ${s5init.status}, ${s5init.data?.items?.length || 0} items`);
  if (s5init.data?.items?.length) {
    logStep("5b. Stage 5 submit");
    const picks = {};
    for (const item of s5init.data.items) {
      picks[item.fact_id] = choosing === "best"
        ? item.correct_index
        : (item.correct_index + 1) % item.options.length;
    }
    const s5sub = await call(jar, "POST", "/api/stage/5/submit", { picks });
    console.log(`  submit → ${s5sub.status} correct=${s5sub.data?.correct}/${s5sub.data?.total} badge=${s5sub.data?.earned_badge}`);
    if (s5sub.data?.earned_badge) obs.badges.push("Hallucination Hunter");
  } else {
    obs.blockers.push("Stage 5: no items");
  }

  logStep("6. Export");
  const exp = await call(jar, "GET", "/api/export");
  obs.export = { status: exp.status, badges: exp.data?.badges, facts: exp.data?.facts?.length, sources: exp.data?.sources?.length };
  console.log(`  badges=[${exp.data?.badges?.join(", ")}] facts=${exp.data?.facts?.length} sources=${exp.data?.sources?.length}`);
  return obs;
}

async function runEdgeCases() {
  logHeader("EDGE CASES");
  const jar = new CookieJar();
  const results = [];

  await call(jar, "POST", `/api/m/${SHARE}/join`, { display_name: `EdgeKid-${Date.now()}` });

  logStep("E1. /api/stage/1/critique with empty draft");
  const e1 = await call(jar, "POST", "/api/stage/1/critique", { draft: "" });
  console.log(`  ${e1.status} ${JSON.stringify(e1.data)}`);
  results.push({ case: "stage1 critique empty", status: e1.status, expected: 400, pass: e1.status === 400 });

  logStep("E2. /api/stage/1/critique with 3-char draft");
  const e2 = await call(jar, "POST", "/api/stage/1/critique", { draft: "hi" });
  console.log(`  ${e2.status} ${JSON.stringify(e2.data)}`);
  results.push({ case: "stage1 critique short", status: e2.status, expected: 400, pass: e2.status === 400 });

  logStep("E3. /api/stage/1/accept without refined_query");
  const e3 = await call(jar, "POST", "/api/stage/1/accept", {});
  console.log(`  ${e3.status} ${JSON.stringify(e3.data)}`);
  results.push({ case: "stage1 accept missing field", status: e3.status, expected: 400, pass: e3.status === 400 });

  logStep("E4. /api/stage/3/verify-click with garbage kid_answer");
  const e4 = await call(jar, "POST", "/api/stage/3/verify-click", {
    fact_id: "x", source_id: "y", kid_answer: "maybe",
  });
  console.log(`  ${e4.status} ${JSON.stringify(e4.data)}`);
  results.push({ case: "stage3 verify-click garbage answer", status: e4.status, expected: 400, pass: e4.status === 400 });

  logStep("E5. /api/stage/3/extract before Stage 2 done");
  const e5 = await call(jar, "POST", "/api/stage/3/extract");
  console.log(`  ${e5.status} ${JSON.stringify(e5.data)}`);
  results.push({ case: "stage3 extract pre-stage2", status: e5.status, expected: 400, pass: e5.status === 400 });

  logStep("E6. /api/stage/4/grade with fact_id that doesn't exist");
  const e6 = await call(jar, "POST", "/api/stage/4/grade", {
    fact_id: "ghost-fact", explanation: "anything",
  });
  console.log(`  ${e6.status} ${JSON.stringify(e6.data)}`);
  results.push({ case: "stage4 grade unknown fact", status: e6.status, expected: 404, pass: e6.status === 404 });

  logStep("E7. /api/stage/5/submit with picks={} (empty)");
  const e7 = await call(jar, "POST", "/api/stage/5/submit", { picks: {} });
  console.log(`  ${e7.status} ${JSON.stringify(e7.data)}`);
  results.push({ case: "stage5 submit empty picks", status: e7.status, expected: 200, observed: e7.status });

  logStep("E8. ALL endpoints without cookie (auth check)");
  const noJar = new CookieJar();
  const endpoints = [
    ["POST", "/api/stage/1/init"],
    ["POST", "/api/stage/1/critique", { draft: "x".repeat(20) }],
    ["GET", "/api/session/state"],
    ["GET", "/api/stage/4/init"],
    ["POST", "/api/stage/5/init"],
    ["GET", "/api/export"],
  ];
  for (const [method, path, body] of endpoints) {
    const r = await call(noJar, method, path, body);
    const ok = r.status === 401;
    console.log(`  ${method} ${path} → ${r.status} ${ok ? "✓ 401 enforced" : "✗ leak"}`);
    results.push({ case: `auth on ${method} ${path}`, status: r.status, expected: 401, pass: ok });
  }

  return results;
}

async function runCritiqueLoop() {
  logHeader("CRITIQUE LOOP (weak → revise → strong)");
  const jar = new CookieJar();
  await call(jar, "POST", `/api/m/${SHARE}/join`, { display_name: `LoopKid-${Date.now()}` });
  await call(jar, "POST", "/api/stage/1/init");

  const results = [];

  logStep("Attempt 1: weak draft");
  const a1 = await call(jar, "POST", "/api/stage/1/critique", { draft: "Tell me about Earth" });
  console.log(`  verdict=${a1.data?.verdict} feedback="${a1.data?.feedback?.slice(0,80)}…"`);
  results.push({ attempt: 1, verdict: a1.data?.verdict });

  logStep("Attempt 2: medium draft");
  const a2 = await call(jar, "POST", "/api/stage/1/critique", { draft: "What are the seven continents and where are they located on Earth?" });
  console.log(`  verdict=${a2.data?.verdict} feedback="${a2.data?.feedback?.slice(0,80)}…"`);
  results.push({ attempt: 2, verdict: a2.data?.verdict });

  logStep("Attempt 3: strong draft");
  const a3 = await call(jar, "POST", "/api/stage/1/critique", { draft: "Why is Africa the only continent to span all four hemispheres, and how does that geography shape its climate diversity?" });
  console.log(`  verdict=${a3.data?.verdict} feedback="${a3.data?.feedback?.slice(0,80)}…"`);
  results.push({ attempt: 3, verdict: a3.data?.verdict });

  return results;
}

(async () => {
  const t0 = Date.now();
  const happy = await runScenario("HAPPY PATH (all best choices)", "best");
  const worst = await runScenario("WORST PATH (all wrong choices)", "worst");
  const edge = await runEdgeCases();
  const loop = await runCritiqueLoop();
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

  logHeader(`SUMMARY (${elapsed}s)`);
  console.log("\nHAPPY:", JSON.stringify({ badges: happy.badges, blockers: happy.blockers, export: happy.export }, null, 2));
  console.log("\nWORST:", JSON.stringify({ badges: worst.badges, blockers: worst.blockers, export: worst.export }, null, 2));
  console.log("\nEDGE CASES:");
  for (const r of edge) console.log(`  ${r.pass !== undefined ? (r.pass ? "✓" : "✗") : "·"} ${r.case} → status=${r.status}${r.expected !== undefined ? ` (expected ${r.expected})` : ""}`);
  console.log("\nCRITIQUE LOOP:");
  for (const r of loop) console.log(`  attempt ${r.attempt}: verdict=${r.verdict}`);
})().catch((e) => { console.error("\nFATAL:", e); process.exit(1); });
