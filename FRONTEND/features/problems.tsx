"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Sparkles, ShieldCheck, Zap, Layers, Target } from "lucide-react";
import { Button, Card, SectionTitle } from "@/components/ui";
import { createSession, problems, type Category, type Problem } from "@/features/data";
import { cn } from "@/lib/utils";

const categories: Category[] = [
  "Arrays & Strings",
  "Linked Lists & Stacks",
  "Trees & Graphs",
  "Heap & Sorting",
];

const difficulties: Array<Problem["difficulty"] | "All"> = ["All", "Easy", "Medium", "Hard"];

export function Problems() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<Category | "All">("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState<Problem["difficulty"] | "All">("All");

  // Filter valid problems
  const validProblems = problems.filter((p) => p.id && p.title);

  const filteredPool = validProblems.filter((p) => {
    const matchesDifficulty = selectedDifficulty === "All" || p.difficulty === selectedDifficulty;
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    return matchesDifficulty && matchesCategory;
  });

  const handleStartPracticing = () => {
    if (filteredPool.length === 0) {
      alert(`No ${selectedDifficulty} problems found for ${selectedCategory}. Try adjusting filters!`);
      return;
    }

    const randomProblem = filteredPool[Math.floor(Math.random() * filteredPool.length)];
    const session = createSession(randomProblem);

    // ==========================================
    // CRITICAL FIX: Ensure session is explicitly saved to localStorage 
    // so loadSession([id]) can immediately read it on mount.
    // ==========================================
    try {
      localStorage.setItem(`session_${session.id}`, JSON.stringify(session));
    } catch (e) {
      console.error("Failed to save session to localStorage", e);
    }

    router.push(`/session/${session.id}`);
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-5xl flex-col justify-center px-4 py-8">
      <div className="space-y-8 text-center md:text-left">
        <SectionTitle
          eyebrow="Diagnostic Assessment"
          title="Blind Practice Mode"
          copy="Zero spoilers before the clock starts. Train real pattern recognition under interview constraints."
        />

        {/* Main Centered Box */}
        <Card className="relative w-full overflow-hidden border-accent/25 bg-panel-raised/60 p-8 shadow-2xl backdrop-blur-md md:p-10">
          <div className="flex items-center justify-between pb-6 border-b border-border/60">
            <div className="flex items-center gap-2.5 text-sm font-bold uppercase tracking-wider text-accent">
              <Sparkles size={18} /> Session Parameters
            </div>
            <span className="text-xs font-mono font-medium text-muted bg-canvas px-3 py-1.5 rounded-full border border-border/80">
              {filteredPool.length} {filteredPool.length === 1 ? "Problem" : "Problems"} Available
            </span>
          </div>

          <div className="mt-8 space-y-8">
            {/* Difficulty Selector as Pills */}
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

            {/* Category Dropdown */}
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-2">
                <Layers size={16} className="text-accent" /> Topic Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as Category | "All")}
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

            {/* Main Action Button */}
            <div className="pt-2">
              <Button
                onClick={handleStartPracticing}
                disabled={filteredPool.length === 0}
                className="w-full gap-3 py-4 text-base font-semibold shadow-xl shadow-accent/10 transition-transform active:scale-[0.99] rounded-lg"
              >
                <Play size={20} className="fill-current" />
                {filteredPool.length === 0 ? "No Problems Match Filters" : "Start Practice Session"}
              </Button>
            </div>
          </div>
        </Card>

        {/* Supporting Details Below the Main Card */}
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
      </div>
    </div>
  );
}
