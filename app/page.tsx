import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-20">
      <div className="max-w-2xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-1 text-sm text-zinc-600">
          <span className="text-amber-500">🔍</span> For teachers of 9-14 year olds
        </div>
        <h1 className="text-5xl font-semibold tracking-tight text-zinc-900 sm:text-6xl">
          Sleuth
        </h1>
        <p className="mt-4 text-2xl font-medium text-zinc-700">
          Research with <span className="text-amber-600">friction</span>.
        </p>
        <p className="mt-6 text-lg leading-7 text-zinc-600">
          Kids walk through 6 gated stages — query design, source judgment,
          triangulation, explanation, and spotting AI hallucinations. The AI
          coaches; the kid does the thinking.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/teacher/login"
            className="rounded-full bg-zinc-900 px-6 py-3 text-white shadow-sm hover:bg-zinc-800"
          >
            Teacher login
          </Link>
          <a
            href="#how"
            className="rounded-full border border-zinc-300 bg-white px-6 py-3 text-zinc-700 hover:bg-zinc-50"
          >
            How it works
          </a>
        </div>
      </div>

      <section id="how" className="mt-32 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
        {[
          { n: "1", t: "Query Design", d: "AI helps narrow the question. Refuses to answer it." },
          { n: "2", t: "Search & Select", d: "Side-by-side web + AI results. Kid picks 3 most legit." },
          { n: "3", t: "Investigate", d: "Source preview cards. Judge each by URL + content." },
          { n: "4", t: "Triangulate", d: "Split-screen reading. Verify each fact in 3 sources." },
          { n: "5", t: "Explain", d: "Own words only. AI grades for paraphrase + comprehension." },
          { n: "6", t: "Spot Hallucinations", d: "4 versions per fact. Pick the clean one." },
        ].map((s) => (
          <div
            key={s.n}
            className="rounded-2xl border border-zinc-200 bg-white p-6 text-left"
          >
            <div className="text-sm font-mono text-amber-600">Stage {s.n}</div>
            <div className="mt-1 text-lg font-semibold text-zinc-900">{s.t}</div>
            <div className="mt-2 text-sm text-zinc-600">{s.d}</div>
          </div>
        ))}
      </section>
    </main>
  );
}
