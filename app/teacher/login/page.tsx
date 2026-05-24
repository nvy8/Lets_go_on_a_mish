// TEMP HACKATHON DESIGN — uses ClassDojo IP — TODO: REPLACE BEFORE LAUNCH
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { HDCard } from "@/components/handdrawn/HDCard";
import { HDButton } from "@/components/handdrawn/HDButton";
import { HDInput } from "@/components/handdrawn/HDInput";
import { COLOR, RADIUS, KALAM, pencilAlpha, PAPER_BG } from "@/lib/design-tokens";

export default function TeacherLogin() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/teacher/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      router.push("/teacher/dashboard");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="relative flex flex-1 items-center justify-center px-6 py-16 overflow-hidden"
      style={PAPER_BG}
    >
      {/* Faded sketch background — matches the rest of the app */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/scraped/page_homepage_sketch-lines.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.07]"
      />

      <HDCard className="relative w-full max-w-md p-8" decoration="tape">
        {/* Friendly teacher mascot sitting on top of the login card */}
        <motion.div
          aria-hidden="true"
          initial={{ opacity: 0, y: -10, rotate: 8 }}
          animate={{ opacity: 1, y: 0, rotate: 4 }}
          transition={{ duration: 0.55, ease: "backOut", delay: 0.15 }}
          className="pointer-events-none absolute -top-16 -right-4"
        >
          <motion.div
            animate={{ rotate: [4, 8, 4], y: [0, -4, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Image
              src="/scraped/grid_mojojojo_optimized.webp"
              alt=""
              width={110}
              height={110}
              style={{ filter: "drop-shadow(3px 4px 0 rgba(0,0,0,0.15))" }}
            />
          </motion.div>
        </motion.div>

        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm hover:opacity-70"
          style={{ color: pencilAlpha("99") }}
        >
          <ArrowLeft size={16} strokeWidth={2.5} />
          back
        </Link>
        <h1
          className="mt-4 text-3xl"
          style={{ ...KALAM, color: COLOR.pencil }}
        >
          {mode === "login" ? "Teacher login" : "Create teacher account"}
        </h1>
        <p
          className="mt-1 text-sm"
          style={{ color: pencilAlpha("cc") }}
        >
          {mode === "login" ? "Welcome back." : "No school email required."}
        </p>

        <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
          <HDInput
            type="email"
            required
            placeholder="you@school.org"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="text-base"
          />
          <HDInput
            type="password"
            required
            minLength={8}
            placeholder="Password (min 8 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="text-base"
          />
          {error && (
            <div
              className="px-3 py-2 text-sm border-[3px]"
              style={{
                borderColor: COLOR.red,
                backgroundColor: "white",
                borderRadius: RADIUS.notice,
                color: COLOR.red,
              }}
            >
              {error}
            </div>
          )}
          <div className="mt-2">
            <HDButton type="submit" variant="primary" size="md" disabled={loading}>
              {loading ? "..." : mode === "login" ? "Log in" : "Create account"}
            </HDButton>
          </div>
        </form>

        <button
          onClick={() => setMode(mode === "login" ? "register" : "login")}
          className="mt-4 w-full text-center text-sm underline"
          style={{ color: pencilAlpha("99") }}
        >
          {mode === "login" ? "No account? Register" : "Have an account? Log in"}
        </button>
      </HDCard>
    </main>
  );
}
