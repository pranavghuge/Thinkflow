"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Sparkles, ShieldCheck, Zap, Layers, Target } from "lucide-react";
import { Button, Card, SectionTitle } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

// Matches backend ProblemSummary exactly: id, difficulty, category
type ProblemSummary = {
  id: string;
  difficulty: "Easy" | "Medium" | "Hard";
  category: string;
};

type SessionDetail = {
  id: string;
  problem_id: string;
  status: string;
};

type CustomProblem = {
  id: string;
};

const categories = [
  "Arrays & Strings",
  "Linked Lists & Stacks",
  "Trees & Graphs",
  "Heap & Sorting",
];

const difficulties: Array<ProblemSummary["difficulty"] | "All"> = ["All", "Easy", "Medium", "Hard"];

export function Problems() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState<ProblemSummary["difficulty"] | "All">("All");
  const [pool, setPool] = useState<ProblemSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);

  const [deepDiveName, setDeepDiveName] = useState("");
  const [deepDiveLoading, setDeepDiveLoading] = useState(false);
  const [deepDiveError, setDeepDiveError] = useState("");

  useEffect(() => {
    const fetchProblems = async () => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        if (selectedDifficulty !== "All") params.set("difficulty", selectedDifficulty);
        if (selectedCategory !== "All") params.set("category", selectedCategory);

        const query = params.toString();
        const data = await apiFetch<ProblemSummary[]>(`/problems${query ? `?${query}` : ""}`);
        setPool(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load problems.");
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
  }, [selectedDifficulty, selectedCategory]);

  const handleStartPracticing = async () => {
    if (pool.length === 0) {
      alert(`No ${selectedDifficulty} problems found for ${selectedCategory}. Try adjusting filters!`);
      return;
    }

    const randomProblem = pool[Math.floor(Math.random() * pool.length)];
    setStarting(true);
    setError("");

    try {
      const session = await apiFetch<SessionDetail>("/sessions", {
        method: "POST",
        body: JSON.stringify({ problem_id: randomProblem.id }),
      });

      router.push(`/session/${session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start session.");
      setStarting(false);
    }
  };

  const handleStartDeepDive = async () => {
    if (deepDiveName.trim().length < 2) return;

    setDeepDiveLoading(true);
    setDeepDiveError("");

    try {
      // Uses the user's own configured Gemini key — same BYOK path as
      // approach evaluation. The backend returns a clear 400 if no
      // key is configured yet.
      const problem = await apiFetch<CustomProblem>("/problems/custom", {
        method: "POST",
        body: JSON.stringify({ name: deepDiveName.trim() }),
      });

      const session = await apiFetch<SessionDetail>("/sessions", {
        method: "POST",
        body: JSON.stringify({ problem_id: problem.id }),
      });

      router.push(`/session/${session.id}`);
    } catch (err) {
      setDeepDiveError(
        err instanceof Error ? err.message : "Failed to generate this problem."
      );
      setDeepDiveLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-5xl flex-col justify-center px-4 py-8">
      <div className="space-y-8 text-center md:text-left">
        <SectionTitle
          eyebrow="Diagnostic Assessment"
          title="Blind Practice Mode"
          copy="Zero spoilers before the clock starts. Train real pattern recognition under interview constraints."
        />

        <Card className="relative w-full overflow-hidden border-accent/25 bg-panel-raised/60 p-8 shadow-2xl backdrop-blur-md md:p-10">
          <div className="flex items-center justify-between pb-6 border-b border-border/60">
            <div className="flex items-center gap-2.5 text-sm font-bold uppercase tracking-wider text-accent">
              <Sparkles size={18} /> Session Parameters
            </div>
            <span className="text-xs font-mono font-medium text-muted bg-canvas px-3 py-1.5 rounded-full border border-border/80">
              {loading ? "Loading…" : `${pool.length} ${pool.length === 1 ? "Problem" : "Problems"} Available`}
            </span>
          </div>

          {error && (
            <p role="alert" className="mt-4 text-sm text-danger">
              {error}
            </p>
          )}

          <div className="mt-8 space-y-8">
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-2">
                <Target size={16} className="text-accent" /> Select Difficulty
              </label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {difficulties.map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setSelectedDifficulty(diff)}
                    className={cn(
                      "py-3 px-4 text-sm font-medium rounded-lg border transition-all duration-150 text-center cursor-pointer",
                      selectedDifficulty === diff
                        ? "border-accent bg-accent/20 text-accent font-semibold shadow-md shadow-accent/5"
                        : "border-border/80 bg-canvas/40 text-muted hover:border-border hover:bg-canvas/80 hover:text-ink"
                    )}
                  >
                    {diff === "All" ? "Any" : diff}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-2">
                <Layers size={16} className="text-accent" /> Topic Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-lg border border-border/80 bg-canvas px-4 py-3 text-sm text-ink transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="All">Any Category (Random Mix)</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2">
              <Button
                onClick={handleStartPracticing}
                disabled={loading || starting || pool.length === 0}
                className="w-full gap-3 py-4 text-base font-semibold shadow-xl shadow-accent/10 transition-transform active:scale-[0.99] rounded-lg"
              >
                <Play size={20} className="fill-current" />
                {starting
                  ? "Starting…"
                  : pool.length === 0
                  ? "No Problems Match Filters"
                  : "Start Practice Session"}
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="p-5 flex items-start gap-3 bg-panel-raised/30 border-border/60">
            <ShieldCheck size={20} className="text-accent shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-ink">Anti-Spoiler Protocol</h4>
              <p className="text-xs leading-relaxed text-muted">
                Problem title, tags, and expected approach are entirely hidden until you start.
              </p>
            </div>
          </Card>

          <Card className="p-5 flex items-start gap-3 bg-panel-raised/30 border-border/60">
            <Zap size={20} className="text-warning shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-ink">What Gets Tested</h4>
              <p className="text-xs leading-relaxed text-muted">
                First-sight intuition speed, pattern recognition under time, and algorithmic reasoning.
              </p>
            </div>
          </Card>
        </div>

        <Card className="relative w-full overflow-hidden border-accent/20 bg-panel-raised/40 p-8 shadow-lg">
          <div className="flex items-center gap-2.5 text-sm font-bold uppercase tracking-wider text-accent">
            <Sparkles size={18} /> Deep Dive Mode
          </div>
          <p className="mt-2 text-sm text-muted">
            Bring your own problem. Full statement shown immediately, no timer, no blind
            guessing — straight to writing your approach with real AI feedback and hints
            if you get stuck.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input
              value={deepDiveName}
              onChange={(e) => setDeepDiveName(e.target.value)}
              placeholder="e.g. Two Sum, or describe a problem you're working on"
              className="flex-1 rounded-lg border border-border/80 bg-canvas px-4 py-3 text-sm text-ink placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <Button
              onClick={handleStartDeepDive}
              disabled={deepDiveLoading || deepDiveName.trim().length < 2}
              className="gap-2 whitespace-nowrap px-6"
            >
              {deepDiveLoading ? "Generating…" : "Start Deep Dive"}
            </Button>
          </div>

          {deepDiveError && (
            <p role="alert" className="mt-3 text-sm text-danger">
              {deepDiveError}
            </p>
          )}

          <p className="mt-3 text-[11px] text-muted/70 font-mono">
            Uses your configured Gemini API key — the same one used for approach evaluation.
          </p>
        </Card>
      </div>
    </div>
  );
}