"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Clock3,
  Play,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Activity,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button, Card, SectionTitle } from "@/components/ui";
import { formatTime } from "@/features/data";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

type SessionDetail = {
  id: string;
  problem_id: string;
  status: string;
  recognition_time: number | null;
  claimed_pattern: string | null;
  detected_pattern: string | null;
  pattern_match: boolean | null;
  current_hint_level: number;
  started_at: string;
  ended_at: string | null;
  overall_verdict: "strong" | "needs_improvement" | "incorrect" | null;
  source: "curated" | "custom";
};

type ProblemInfo = {
  title: string;
  pattern: string;
  difficulty: string;
};

type ProblemSummary = {
  id: string;
  difficulty: string;
  category: string;
};

function outcomeBadge(
  session: SessionDetail
): {
  label: string;
  tone: "success" | "warning" | "error" | "muted";
} {
  if (session.recognition_time === null && session.source === "curated") {
    return { label: "In progress", tone: "muted" };
  }

  if (session.overall_verdict === null) {
    return { label: "No approach submitted", tone: "muted" };
  }

  const hints = session.current_hint_level;
  const hintWord = hints === 1 ? "hint" : "hints";

  if (session.overall_verdict === "strong") {
    return hints === 0
      ? { label: "Solved · cold", tone: "success" }
      : { label: `Solved · ${hints} ${hintWord}`, tone: "success" };
  }

  if (session.overall_verdict === "needs_improvement") {
    return hints === 0
      ? { label: "Needs improvement", tone: "warning" }
      : {
          label: `Needs improvement · ${hints} ${hintWord}`,
          tone: "warning",
        };
  }

  return hints === 0
    ? { label: "Incorrect", tone: "error" }
    : { label: `Incorrect · ${hints} ${hintWord}`, tone: "error" };
}

function recognitionTargetForDifficulty(
  difficulty: string | undefined
): string {
  switch (difficulty?.toLowerCase()) {
    case "easy":
      return "< 1m 00s";
    case "medium":
      return "< 2m 00s";
    case "hard":
      return "< 3m 00s";
    default:
      return "< 2m 00s";
  }
}

const DIFFICULTY_ORDER = ["Easy", "Medium", "Hard"] as const;

// --- Gauge geometry ---
// Angle convention used everywhere below: 0° = 12 o'clock, increasing clockwise.
const GAUGE_R = 70;
const GAUGE_CX = 90;
const GAUGE_CY = 90;
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_R;
const GAUGE_GAP_DEG = 100; // gap centered at the bottom (180°)

function polarPoint(angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: GAUGE_CX + GAUGE_R * Math.cos(rad),
    y: GAUGE_CY + GAUGE_R * Math.sin(rad),
  };
}

// Converts our 0=12oclock convention into the rotation needed for an SVG
// <circle>, whose native dash-start sits at 3 o'clock (90° in our system).
function toSvgRotation(angleDeg: number) {
  return angleDeg - 90;
}

const DIFFICULTY_TRACK_COLORS: Record<string, string> = {
  Easy: "#1e5c48",
  Medium: "#92640a",
  Hard: "#7f1d2e",
};

const DIFFICULTY_FILL_COLORS: Record<string, string> = {
  Easy: "#34d399",
  Medium: "#f59e0b",
  Hard: "#f43f5e",
};

export function Dashboard() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionDetail[]>([]);
  const [problemInfo, setProblemInfo] = useState<Record<string, ProblemInfo>>(
    {}
  );
  const [allProblems, setAllProblems] = useState<ProblemSummary[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState("");
  const [showAbandonDialog, setShowAbandonDialog] = useState(false);
  const [trendPage, setTrendPage] = useState(0);
  const [showAllRuns, setShowAllRuns] = useState(false);
  const [showAllDeepDive, setShowAllDeepDive] = useState(false);

  useEffect(() => {
    const fetchSessions = async () => {
      setError("");

      try {
        const data = await apiFetch<SessionDetail[]>("/sessions");

        const sorted = [...data].sort(
          (a, b) =>
            new Date(a.started_at).getTime() -
            new Date(b.started_at).getTime()
        );

        setSessions(sorted);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load sessions."
        );
      } finally {
        setIsLoaded(true);
      }
    };

    fetchSessions();
  }, []);

  useEffect(() => {
    const fetchAllProblems = async () => {
      try {
        const data = await apiFetch<ProblemSummary[]>("/problems");
        setAllProblems(data);
      } catch {
        setAllProblems([]);
      }
    };

    fetchAllProblems();
  }, []);

  const completedSessions = sessions.filter(
    (s) => s.recognition_time !== null
  );

  const recognitionSessions = completedSessions.filter(
    (s) => s.pattern_match !== null
  );

  const correctRecognitions = recognitionSessions.filter(
    (s) => s.pattern_match === true
  ).length;

  const recognitionAccuracy =
    recognitionSessions.length > 0
      ? Math.round(
          (correctRecognitions / recognitionSessions.length) * 100
        )
      : null;

  const trendPageCount = Math.ceil(recognitionSessions.length / 6);

  useEffect(() => {
    setTrendPage(0);
  }, [recognitionSessions.length]);

  const currentTrendPage = Math.min(
    trendPage,
    Math.max(trendPageCount - 1, 0)
  );

  const trendEndIndex =
    recognitionSessions.length - currentTrendPage * 6;

  const trendStartIndex = Math.max(0, trendEndIndex - 6);

  const trendSessions = recognitionSessions.slice(
    trendStartIndex,
    trendEndIndex
  );

  const recentList = [...completedSessions].reverse().slice(0, 4);

  const displayedRuns = showAllRuns
    ? [...completedSessions].reverse()
    : recentList;

  // Deep Dive sessions (custom, AI-generated problems) never enter
  // recognition_in_progress — they start at recognition_complete
  // directly. This list surfaces them separately from curated runs.
  const deepDiveSessions = sessions
    .filter(
      (s) =>
        s.source === "custom" && s.status !== "recognition_in_progress"
    )
    .slice()
    .reverse();

  const displayedDeepDive = showAllDeepDive
  ? deepDiveSessions
  : deepDiveSessions.slice(0, 4);  

  // Only curated sessions count as an "unfinished diagnostic" banner —
  // a fresh Deep Dive session (source: "custom") starts at
  // recognition_complete by design and should not trigger the same
  // abandon-confirmation flow as a genuinely mid-recognition curated run.
  const activeSession =
    sessions
      .slice()
      .reverse()
      .find(
        (s) =>
          s.source === "curated" &&
          (s.status === "recognition_in_progress" ||
            s.status === "recognition_complete")
      ) || null;

  useEffect(() => {
    const idsToFetch = new Set<string>();

    displayedRuns.forEach((s) => idsToFetch.add(s.problem_id));
    displayedDeepDive.forEach((s) => idsToFetch.add(s.problem_id));

    if (activeSession) idsToFetch.add(activeSession.problem_id);

    const missing = [...idsToFetch].filter((id) => !problemInfo[id]);

    if (missing.length === 0) return;

    Promise.all(
      missing.map(async (id) => {
        try {
          const detail = await apiFetch<{
            title: string;
            pattern: string;
            difficulty: string;
          }>(`/problems/${id}`);

          return [
            id,
            {
              title: detail.title,
              pattern: detail.pattern,
              difficulty: detail.difficulty,
            },
          ] as const;
        } catch {
          return [
            id,
            { title: id, pattern: "Unknown", difficulty: "Unknown" },
          ] as const;
        }
      })
    ).then((results) => {
      setProblemInfo((prev) => {
        const next = { ...prev };

        results.forEach(([id, info]) => {
          next[id] = info;
        });

        return next;
      });
    });
   
  }, [sessions, showAllRuns,showAllDeepDive]);

  const latestCompleted = completedSessions[completedSessions.length - 1];
  const previousCompleted = completedSessions[completedSessions.length - 2];

  const latestDifficulty = latestCompleted
    ? problemInfo[latestCompleted.problem_id]?.difficulty
    : undefined;

  const recognitionTarget =
    recognitionTargetForDifficulty(latestDifficulty);

  let speedChangeText = "2+ sessions required for comparison";
  let isFaster = false;

  if (latestCompleted && previousCompleted) {
    const diff =
      previousCompleted.recognition_time! -
      latestCompleted.recognition_time!;

    const pct = Math.round(
      (diff / previousCompleted.recognition_time!) * 100
    );

    if (pct > 0) {
      speedChangeText = `${pct}% faster than previous attempt`;
      isFaster = true;
    } else if (pct < 0) {
      speedChangeText = `${Math.abs(pct)}% slower than previous attempt`;
    } else {
      speedChangeText = "Matched previous speed";
    }
  }

  // --- Easy / Medium / Hard breakdown ---
  const difficultyById = new Map<string, string>(
    allProblems.map((p) => [p.id, p.difficulty])
  );

  const totalByDifficulty: Record<string, number> = {};
  allProblems.forEach((p) => {
    totalByDifficulty[p.difficulty] =
      (totalByDifficulty[p.difficulty] || 0) + 1;
  });

  const solvedProblemIds = new Set(
    sessions
      .filter((s) => s.overall_verdict === "strong")
      .map((s) => s.problem_id)
  );

  const solvedByDifficulty: Record<string, number> = {};
  solvedProblemIds.forEach((id) => {
    const difficulty = difficultyById.get(id);
    if (!difficulty) return;
    solvedByDifficulty[difficulty] =
      (solvedByDifficulty[difficulty] || 0) + 1;
  });

  const totalSolved = solvedProblemIds.size;
  const totalProblems = allProblems.length;

  // --- Gauge segment computation ---
  // Sweep starts right after the bottom gap, goes clockwise through
  // Easy -> Medium -> Hard, and ends right before the gap on the other side.
  const gaugeSegments = (() => {
    if (totalProblems === 0) return [];

    const usableSweep = 360 - GAUGE_GAP_DEG;
    const startOfSweep = 180 + GAUGE_GAP_DEG / 2;

    let cursorDeg = startOfSweep;

    return DIFFICULTY_ORDER.map((difficulty) => {
      const total = totalByDifficulty[difficulty] || 0;
      const solved = solvedByDifficulty[difficulty] || 0;
      const sweepDeg = (total / totalProblems) * usableSweep;
      const filledFraction = total > 0 ? solved / total : 0;

      const segment = {
        difficulty,
        trackColor: DIFFICULTY_TRACK_COLORS[difficulty],
        fillColor: DIFFICULTY_FILL_COLORS[difficulty],
        startDeg: cursorDeg,
        sweepDeg,
        filledSweepDeg: sweepDeg * filledFraction,
      };

      cursorDeg += sweepDeg;
      return segment;
    });
  })();

  const boundaryDots =
    gaugeSegments.length === 3
      ? [
          {
            angle: gaugeSegments[0].startDeg,
            color: gaugeSegments[0].fillColor,
          },
          {
            angle: gaugeSegments[1].startDeg,
            color: gaugeSegments[1].fillColor,
          },
        ]
      : [];

  const handleStartNewPractice = (e: React.MouseEvent) => {
    if (activeSession) {
      e.preventDefault();
      setShowAbandonDialog(true);
    }
  };

  const handleConfirmAbandon = () => {
    setShowAbandonDialog(false);
    router.push("/problems");
  };

  if (!isLoaded) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 animate-pulse">
        <div className="h-16 w-1/3 bg-panel-raised/50 rounded-lg" />
        <div className="h-32 w-full bg-panel-raised/30 rounded-xl" />

        <div className="grid gap-4 md:grid-cols-4">
          <div className="h-28 bg-panel-raised/30 rounded-xl" />
          <div className="h-28 bg-panel-raised/30 rounded-xl" />
          <div className="h-28 md:col-span-2 bg-panel-raised/30 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl">
        <p className="text-danger">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <SectionTitle
        eyebrow="Telemetry Dashboard"
        title="Practice with Intent"
        copy="High-signal feedback on pattern recognition speed and decision confidence."
      />

      {activeSession && (
        <Card className="relative overflow-hidden border-accent/40 bg-gradient-to-r from-accent/10 via-panel-raised/50 to-panel-raised/30 p-5 shadow-xl backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-accent font-semibold">
                <Sparkles size={13} /> Unfinished Session in Progress
              </div>

              <p className="text-sm font-semibold text-ink">
                {problemInfo[activeSession.problem_id]?.title ||
                  activeSession.problem_id}
              </p>

              <p className="text-xs text-muted font-mono">
                {problemInfo[activeSession.problem_id]?.pattern ||
                  "Loading pattern…"}{" "}
                •{" "}
                {problemInfo[activeSession.problem_id]?.difficulty || "N/A"}
              </p>
            </div>

            <Link href={`/session/${activeSession.id}`}>
              <Button className="gap-2 shadow-md shadow-accent/10">
                Resume Session <ArrowRight size={15} />
              </Button>
            </Link>
          </div>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-5 bg-panel-raised/40 border-border/70 flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase tracking-widest text-muted">
            Latest Speed
          </span>

          <div className="my-3">
            <div className="text-3xl font-bold font-mono text-ink tracking-tight">
              {latestCompleted?.recognition_time !== null &&
              latestCompleted?.recognition_time !== undefined
                ? formatTime(latestCompleted.recognition_time)
                : "--"}
            </div>

            <p
              className={`mt-1.5 text-xs flex items-center gap-1 font-medium ${
                isFaster ? "text-accent" : "text-muted"
              }`}
            >
              {previousCompleted &&
                (isFaster ? (
                  <TrendingDown size={14} />
                ) : (
                  <TrendingUp size={14} />
                ))}
              {speedChangeText}
            </p>
          </div>

          <span className="text-[10px] text-muted/70 font-mono">
            Target benchmark: {recognitionTarget}
          </span>
        </Card>

        <Card className="p-5 bg-panel-raised/40 border-border/70 flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase tracking-widest text-muted">
            Recognition Accuracy
          </span>

          <div className="my-3">
            <div className="text-3xl font-bold font-mono text-ink tracking-tight">
              {recognitionAccuracy !== null
                ? `${recognitionAccuracy}%`
                : "--"}
            </div>

            <p className="mt-1.5 text-xs text-muted">
              {recognitionSessions.length > 0
                ? `${correctRecognitions}/${recognitionSessions.length} correct`
                : "No recognition results yet"}
            </p>
          </div>

          <span className="text-[10px] text-muted/70 font-mono">
            Pattern identification accuracy
          </span>
        </Card>

        <Card className="p-5 md:col-span-2 bg-panel-raised/40 border-border/70 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono uppercase tracking-widest text-muted">
                Recognition Trend
              </span>

              {recognitionSessions.length > 0 && (
                <span className="text-[9px] font-mono text-muted/70">
                  {trendStartIndex + 1}–{trendEndIndex} of{" "}
                  {recognitionSessions.length}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[9px] font-mono text-muted">
                <span className="h-2 w-2 rounded-full bg-accent" />
                Correct
              </span>

              <span className="flex items-center gap-1 text-[9px] font-mono text-muted">
                <span className="h-2 w-2 rounded-full bg-danger" />
                Mismatch
              </span>

              <div className="flex items-center">
                <button
                  type="button"
                  aria-label="View previous recognition results"
                  disabled={currentTrendPage >= trendPageCount - 1}
                  onClick={() =>
                    setTrendPage((page) =>
                      Math.min(page + 1, trendPageCount - 1)
                    )
                  }
                  className="rounded p-1 text-muted transition-colors hover:bg-panel hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronLeft size={15} />
                </button>

                <button
                  type="button"
                  aria-label="View newer recognition results"
                  disabled={currentTrendPage === 0}
                  onClick={() =>
                    setTrendPage((page) => Math.max(page - 1, 0))
                  }
                  className="rounded p-1 text-muted transition-colors hover:bg-panel hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronRight size={15} />
                </button>
              </div>

              <Activity size={14} className="text-muted/60" />
            </div>
          </div>

          {recognitionSessions.length < 2 ? (
            <div className="my-4 flex items-center justify-between rounded-lg bg-canvas/40 px-4 py-3 border border-border/40 text-xs text-muted">
              <span>
                Complete 2 recognition results to unlock the trend.
              </span>

              <span className="font-mono text-[10px] text-accent uppercase">
                {recognitionSessions.length}/2 Recorded
              </span>
            </div>
          ) : (
            <div className="my-3">
              <div className="flex h-16 items-end gap-4 pt-2">
                {(() => {
                  const times = trendSessions.map(
                    (s) => s.recognition_time || 0
                  );

                  const maxTime = Math.max(...times, 1);
                  const minTime = Math.min(...times);
                  const range = maxTime - minTime;

                  return trendSessions.map((session) => {
                    const sec = session.recognition_time || 0;

                    const barHeight =
                      range === 0
                        ? 40
                        : Math.max(
                            18,
                            Math.round(
                              ((maxTime - sec) / range) * 42 + 18
                            )
                          );

                    const barClass =
                      session.pattern_match === true
                        ? "bg-accent shadow-sm shadow-accent/20"
                        : "bg-danger shadow-sm shadow-danger/20";

                    return (
                      <div
                        key={session.id}
                        className="flex-1 flex flex-col items-center gap-1 group"
                      >
                        <div
                          style={{ height: `${barHeight}px` }}
                          className={`w-full rounded-t transition-all ${barClass}`}
                        />

                        <span className="text-[9px] font-mono text-muted/80">
                          {sec}s
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          <p className="text-[10px] text-muted/70 font-mono">
            Lower time indicates faster pattern identification.
          </p>
        </Card>
      </div>

      <Card className="p-5 bg-panel-raised/40 border-border/70">
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <span className="text-[11px] font-mono uppercase tracking-widest text-muted flex items-center gap-1.5">
            <Clock3 size={14} /> Completed Runs ({completedSessions.length})
          </span>
        </div>

        {displayedRuns.length === 0 ? (
          <div className="py-10 text-center text-xs text-muted/80">
            No completed sessions recorded yet. Launch blind mode to set your first benchmark.
          </div>
        ) : (
          <>
            <div className="divide-y divide-border/40">
              {displayedRuns.map((item) => {
                const badge = outcomeBadge(item);
                const info = problemInfo[item.problem_id];

                const recognitionLabel =
                  item.pattern_match === true
                    ? "Recognition · Correct"
                    : item.pattern_match === false
                      ? "Recognition · Mismatch"
                      : null;

                return (
                  <div
                    className="flex items-center justify-between py-3 text-sm"
                    key={item.id}
                  >
                    <div className="space-y-0.5">
                      <p className="text-ink font-medium text-xs sm:text-sm">
                        {info?.title || item.problem_id}
                      </p>

                      <p className="text-[11px] text-muted font-mono">
                        {info?.pattern ||
                          item.detected_pattern ||
                          "Pattern pending"}{" "}
                        • {info?.difficulty || "Unknown"}
                      </p>

                      {recognitionLabel && (
                        <p
                          className={cn(
                            "text-[10px] font-mono mt-0.5",
                            item.pattern_match === true && "text-accent",
                            item.pattern_match === false && "text-danger"
                          )}
                        >
                          {recognitionLabel}
                        </p>
                      )}

                      <p
                        className={cn(
                          "text-[10px] font-mono mt-0.5",
                          badge.tone === "success" && "text-accent",
                          badge.tone === "error" && "text-danger",
                          badge.tone === "warning" && "text-warning",
                          badge.tone === "muted" && "text-muted"
                        )}
                      >
                        {badge.label}
                      </p>
                    </div>

                    <span className="font-mono text-xs font-semibold text-accent bg-accent/10 px-2 py-1 rounded border border-accent/20">
                      {item.recognition_time !== null
                        ? formatTime(item.recognition_time)
                        : "Incomplete"}
                    </span>
                  </div>
                );
              })}
            </div>

            {completedSessions.length > 4 && (
              <button
                type="button"
                onClick={() => setShowAllRuns((value) => !value)}
                className="mt-4 w-full border-t border-border/40 pt-4 text-center text-[10px] font-mono uppercase tracking-widest text-accent transition-colors hover:text-ink"
              >
                {showAllRuns ? "Show less ↑" : "View all →"}
              </button>
            )}
          </>
        )}
      </Card>

      <Card className="p-5 bg-panel-raised/40 border-border/70">
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <span className="text-[11px] font-mono uppercase tracking-widest text-muted flex items-center gap-1.5">
            <Sparkles size={14} /> Deep Dive History ({deepDiveSessions.length})
          </span>
        </div>

        {deepDiveSessions.length === 0 ? (
          <div className="py-10 text-center text-xs text-muted/80">
            Bring your own problem — paste a name and get full AI coaching, no timer, no blind guessing.
          </div>
        ) : (
          <>
            <div className="divide-y divide-border/40">
              {displayedDeepDive.map((item) => {
                const badge = outcomeBadge(item);
                const info = problemInfo[item.problem_id];

                return (
                  <div
                    className="flex items-center justify-between py-3 text-sm"
                    key={item.id}
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-ink font-medium text-xs sm:text-sm">
                          {info?.title || item.problem_id}
                        </p>

                        <span className="text-[9px] font-mono uppercase tracking-widest text-muted/70 bg-canvas/60 px-1.5 py-0.5 rounded border border-border/50">
                          AI-generated
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-mono text-muted bg-canvas/60 px-2 py-0.5 rounded border border-border/50">
                          Pattern: {info?.pattern || "Unknown"}
                        </span>

                        <span
                          className={cn(
                            "text-[10px] font-mono px-2 py-0.5 rounded border",
                            info?.difficulty?.toLowerCase() === "easy" &&
                              "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
                            info?.difficulty?.toLowerCase() === "medium" &&
                              "text-amber-400 bg-amber-400/10 border-amber-400/20",
                            info?.difficulty?.toLowerCase() === "hard" &&
                              "text-rose-400 bg-rose-400/10 border-rose-400/20",
                            !["easy", "medium", "hard"].includes(
                              info?.difficulty?.toLowerCase() || ""
                            ) &&
                              "text-muted bg-canvas/60 border-border/50"
                          )}
                        >
                          Difficulty: {info?.difficulty || "Unknown"}
                        </span>
                      </div>

                      <p
                        className={cn(
                          "text-[10px] font-mono mt-0.5",
                          badge.tone === "success" && "text-accent",
                          badge.tone === "error" && "text-danger",
                          badge.tone === "warning" && "text-warning",
                          badge.tone === "muted" && "text-muted"
                        )}
                      >
                        {badge.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {deepDiveSessions.length > 4 && (
              <button
                type="button"
                onClick={() => setShowAllDeepDive((value) => !value)}
                className="mt-4 w-full border-t border-border/40 pt-4 text-center text-[10px] font-mono uppercase tracking-widest text-accent transition-colors hover:text-ink"
              >
                {showAllDeepDive ? "Show less ↑" : "View all →"}
              </button>
            )}
          </>
        )}
      </Card>
      <Card className="p-5 bg-panel-raised/40 border-border/70">
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <span className="text-[11px] font-mono uppercase tracking-widest text-muted">
            Problems Solved
          </span>
          <span className="text-[11px] font-mono text-muted">
            {totalProblems > 0 ? `${totalSolved}/${totalProblems} total` : "—"}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4">
          {DIFFICULTY_ORDER.map((difficulty) => {
            const solved = solvedByDifficulty[difficulty] || 0;
            const total = totalByDifficulty[difficulty] || 0;
            const toneClass =
              difficulty === "Easy"
                ? "text-emerald-400"
                : difficulty === "Medium"
                  ? "text-amber-400"
                  : "text-rose-400";

            return (
              <div
                key={difficulty}
                className="flex flex-col items-center gap-1 rounded-lg border border-border/50 bg-canvas/30 py-4"
              >
                <span className={cn("text-sm font-semibold", toneClass)}>
                  {difficulty}
                </span>
                <span className="font-mono text-lg font-bold text-ink">
                  {solved}/{total}
                </span>
              </div>
            );
          })}
        </div>

        {totalProblems > 0 && (
          <div className="mt-6 flex justify-center">
            <svg width="200" height="200" viewBox="0 0 180 180">
              {gaugeSegments.map((segment) => {
                const sweepPx =
                  (segment.sweepDeg / 360) * GAUGE_CIRCUMFERENCE;

                return (
                  <circle
                    key={`${segment.difficulty}-track`}
                    cx={GAUGE_CX}
                    cy={GAUGE_CY}
                    r={GAUGE_R}
                    fill="none"
                    stroke={segment.trackColor}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${sweepPx} ${
                      GAUGE_CIRCUMFERENCE - sweepPx
                    }`}
                    transform={`rotate(${toSvgRotation(
                      segment.startDeg
                    )} ${GAUGE_CX} ${GAUGE_CY})`}
                    opacity="0.55"
                  />
                );
              })}

              {gaugeSegments.map((segment) => {
                const filledPx =
                  (segment.filledSweepDeg / 360) *
                  GAUGE_CIRCUMFERENCE;

                if (filledPx <= 0) return null;

                return (
                  <circle
                    key={`${segment.difficulty}-fill`}
                    cx={GAUGE_CX}
                    cy={GAUGE_CY}
                    r={GAUGE_R}
                    fill="none"
                    stroke={segment.fillColor}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${filledPx} ${
                      GAUGE_CIRCUMFERENCE - filledPx
                    }`}
                    transform={`rotate(${toSvgRotation(
                      segment.startDeg
                    )} ${GAUGE_CX} ${GAUGE_CY})`}
                  />
                );
              })}

              {boundaryDots.map((dot, idx) => {
                const point = polarPoint(dot.angle);

                return (
                  <circle
                    key={idx}
                    cx={point.x}
                    cy={point.y}
                    r="6"
                    fill={dot.color}
                  />
                );
              })}

              <text
                x={GAUGE_CX}
                y={GAUGE_CY - 6}
                textAnchor="middle"
                className="fill-ink font-mono font-bold"
                fontSize="30"
              >
                {totalSolved}
              </text>

              <text
                x={GAUGE_CX}
                y={GAUGE_CY + 16}
                textAnchor="middle"
                className="fill-muted font-mono"
                fontSize="13"
              >
                /{totalProblems}
              </text>

              <text
                x={GAUGE_CX}
                y={GAUGE_CY + 34}
                textAnchor="middle"
                className="fill-muted font-mono uppercase tracking-widest"
                fontSize="9"
              >
                Solved
              </text>
            </svg>
          </div>
        )}
      </Card>

      <Card className="p-5 flex flex-col justify-between bg-panel-raised/60 border-accent/20 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-accent font-bold">
              Practice Engine
            </span>
            <h3 className="text-base font-bold text-ink">
              Blind Diagnostic
            </h3>
            <p className="text-xs leading-relaxed text-muted">
              Start a timed problem without titles or tags to force pure
              intuition.
            </p>
          </div>

          <Link
            href="/problems"
            className="inline-block w-full sm:w-auto"
            onClick={handleStartNewPractice}
          >
            <Button className="w-full sm:w-auto gap-2 text-xs py-3 px-6">
              <Play size={14} className="fill-current" /> Start Practice
            </Button>
          </Link>
        </div>
      </Card>

      {showAbandonDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="space-y-4 p-6 bg-panel-raised border border-border rounded-xl shadow-2xl max-w-md w-full">
            <h3 className="text-lg font-bold text-ink">
              Unfinished Session in Progress
            </h3>

            <p className="text-xs text-muted leading-relaxed">
              You currently have an unfinished session in progress. Starting a
              new one will abandon your current progress. Continue?
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                className="bg-transparent border border-border text-ink hover:bg-panel text-xs px-3 py-2 h-auto"
                onClick={() => setShowAbandonDialog(false)}
              >
                Cancel
              </Button>

              <Button
                className="text-xs px-3 py-2 h-auto"
                onClick={handleConfirmAbandon}
              >
                Continue & Abandon
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}