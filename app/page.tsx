import Link from "next/link";
import { Search, ArrowRight } from "lucide-react";
import { HDCard } from "@/components/handdrawn/HDCard";
import { COLOR, RADIUS, SHADOW, KALAM, pencilAlpha, PAPER_BG } from "@/lib/design-tokens";

const STAGES = [
  { n: "1", t: "Sharpen your question", d: "AI helps narrow the question. Refuses to answer it." },
  { n: "2", t: "Investigate", d: "Source preview cards. Judge each by URL + content." },
  { n: "3", t: "Triangulate", d: "Read across sites. Verify each fact in at least 2." },
  { n: "4", t: "Explain", d: "Own words only. AI grades for paraphrase + comprehension." },
  { n: "5", t: "Spot Hallucinations", d: "4 versions per fact. Pick the real one." },
];

const STAGE_BG = [
  "#fff9c4", // post-it yellow
  "#d8f5c4", // light green
  "#ffd4d4", // pink
  "#eaf1fb", // ballpoint wash
  "#f3e6ff", // lavender
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center px-6 py-20" style={PAPER_BG}>
      <div className="max-w-3xl text-center">
        <div
          className="mb-6 inline-flex items-center gap-2 px-4 py-1 text-sm border-2 -rotate-1"
          style={{
            ...KALAM,
            backgroundColor: COLOR.red,
            color: "white",
            borderColor: COLOR.pencil,
            borderRadius: RADIUS.tag,
            boxShadow: SHADOW.sm,
          }}
        >
          <Search size={16} strokeWidth={2.5} />
          For teachers of 9-14 year olds
        </div>
        <h1
          className="text-7xl sm:text-8xl leading-none"
          style={{ ...KALAM, color: COLOR.pencil }}
        >
          Mish
          <span
            className="inline-block ml-2"
            style={{ color: COLOR.red, transform: "rotate(8deg)", display: "inline-block" }}
          >
            !
          </span>
        </h1>
        <p
          className="mt-4 text-3xl"
          style={{ ...KALAM, color: COLOR.pencil }}
        >
          Research with{" "}
          <span
            className="relative inline-block"
            style={{ color: COLOR.red }}
          >
            friction
            <span
              aria-hidden="true"
              className="absolute left-0 right-0 -bottom-1 h-1"
              style={{
                backgroundColor: COLOR.red,
                borderRadius: "100% 0 100% 0 / 100% 0 100% 0",
              }}
            />
          </span>
          .
        </p>
        <p
          className="mt-6 text-lg leading-7"
          style={{ color: pencilAlpha("cc") }}
        >
          Kids walk through 5 gated stages — sharpen a question, judge sources,
          triangulate facts, explain in their own words, and spot AI hallucinations.
          The AI coaches; the kid does the thinking.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center items-center">
          <Link
            href="/teacher/login"
            className="inline-flex items-center gap-2 px-6 py-3 text-lg border-[3px] hover:bg-[#ff4d4d] hover:text-white transition-colors"
            style={{
              ...KALAM,
              backgroundColor: "white",
              color: COLOR.pencil,
              borderColor: COLOR.pencil,
              borderRadius: RADIUS.button,
              boxShadow: SHADOW.md,
            }}
          >
            Teacher login
            <ArrowRight size={20} strokeWidth={2.5} />
          </Link>
          <a
            href="#how"
            className="inline-flex items-center px-6 py-3 text-lg border-[3px] border-dashed hover:opacity-70"
            style={{
              ...KALAM,
              color: pencilAlpha("cc"),
              borderColor: pencilAlpha("66"),
              borderRadius: RADIUS.button,
            }}
          >
            How it works
          </a>
        </div>
      </div>

      <section id="how" className="mt-32 max-w-5xl">
        <h2
          className="text-center text-4xl mb-10"
          style={{ ...KALAM, color: COLOR.pencil }}
        >
          5 stages, no shortcuts
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {STAGES.map((s, i) => {
            const bg = STAGE_BG[i % STAGE_BG.length];
            const tilt = i % 2 === 0 ? "rotate-1" : "-rotate-1";
            return (
              <div
                key={s.n}
                className={`relative p-6 text-left border-[3px] transition-transform duration-100 hover:-translate-y-[3px] ${tilt}`}
                style={{
                  backgroundColor: bg,
                  borderColor: COLOR.pencil,
                  borderRadius: RADIUS.card,
                  boxShadow: SHADOW.md,
                }}
              >
                {/* Thumbtack */}
                <div
                  aria-hidden="true"
                  className="absolute left-1/2 -translate-x-1/2 -top-3 h-5 w-5 rounded-full"
                  style={{
                    backgroundColor: COLOR.red,
                    border: `2px solid ${COLOR.pencil}`,
                    boxShadow: `1px 1px 0 0 ${COLOR.pencil}`,
                  }}
                />
                <div
                  className="text-sm"
                  style={{ ...KALAM, color: COLOR.red, fontSize: "1rem" }}
                >
                  Stage {s.n}
                </div>
                <div
                  className="mt-1 text-xl"
                  style={{ ...KALAM, color: COLOR.pencil }}
                >
                  {s.t}
                </div>
                <div
                  className="mt-2 text-sm leading-6"
                  style={{ color: pencilAlpha("cc") }}
                >
                  {s.d}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-24 max-w-3xl text-center">
        <HDCard className="p-8" decoration="tape">
          <p className="text-xl" style={{ ...KALAM, color: COLOR.pencil }}>
            One Mish. Five gates. A real PDF brief at the end.
          </p>
          <p
            className="mt-3 text-base"
            style={{ color: pencilAlpha("cc") }}
          >
            No accounts for kids. No data leaves the classroom. Drop a link in Google Classroom and
            you&apos;re done.
          </p>
        </HDCard>
      </section>
    </main>
  );
}
