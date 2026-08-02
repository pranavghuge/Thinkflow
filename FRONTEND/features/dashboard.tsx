"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Clock3, Play, Sparkles, TrendingDown, TrendingUp, Activity } from "lucide-react";
import { Button, Card, SectionTitle } from "@/components/ui";
import { formatTime, getSessions, problems, type PracticeSession } from "@/features/data";

export function Dashboard() {
  const router = useRouter();
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [activeSession, setActiveSession] = useState<PracticeSession | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showAbandonDialog, setShowAbandonDialog] = useState(false);

  useEffect(() => {
    const syncDashboardData = () => {
      // 1. Load historical sessions
      const saved = getSessions();
      setSessions(saved);

      // 2. Derive active session safely from saved sessions (Bug #1 Fix)
      const currentActive = saved.slice().reverse().find((s) => s.phase !== "summary") || null;
      setActiveSession(currentActive);

      setIsLoaded(true);
    };

    // Initial load
    syncDashboardData();

    // Loophole Fix: Re-sync whenever user returns to this tab or localStorage mutates
    window.addEventListener("focus", syncDashboardData);
    window.addEventListener("storage", syncDashboardData);

    return () => {
      window.removeEventListener("focus", syncDashboardData);
      window.removeEventListener("storage", syncDashboardData);
    };
  }, []);

  const completedSessions = sessions.filter(
    (s) => s.recognitionSeconds && s.recognitionSeconds > 0
  );

  const latestCompleted = completedSessions[completedSessions.length - 1];
  const previousCompleted = completedSessions[completedSessions.length - 2];

  let speedChangeText = "2+ sessions required for comparison";
  let isFaster = false;

  if (latestCompleted && previousCompleted) {
    const diff = previousCompleted.recognitionSeconds! - latestCompleted.recognitionSeconds!;
    const pct = Math.round((diff / previousCompleted.recognitionSeconds!) * 100);

    if (pct > 0) {
      speedChangeText = `${pct}% faster than previous attempt`;
      isFaster = true;
    } else if (pct < 0) {
      speedChangeText = `${Math.abs(pct)}% slower than previous attempt`;
      isFaster = false;
    } else {
      speedChangeText = "Matched previous speed";
    }
  }

  const recentList = [...completedSessions].reverse().slice(0, 4);

  // Bug #4 Fix: Replace native window.confirm with custom modal dialog flow
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

  // Lookup active problem for the banner
  const activeProblem = activeSession 
    ? problems.find((p) => p.id === activeSession.problemId) 
    : null;

  if (!isLoaded) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 animate-pulse">
        <div className="h-16 w-1/3 bg-panel-raised/50 rounded-lg" />
        <div className="h-32 w-full bg-panel-raised/30 rounded-xl" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-28 bg-panel-raised/30 rounded-xl" />
          <div className="h-28 md:col-span-2 bg-panel-raised/30 rounded-xl" />
        </div>
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

      {/* Active Session Highlight Banner */}
      {activeSession && (
        <Card className="relative overflow-hidden border-accent/40 bg-gradient-to-r from-accent/10 via-panel-raised/50 to-panel-raised/30 p-5 shadow-xl backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-accent font-semibold">
                <Sparkles size={13} /> Unfinished Session in Progress
              </div>
              {/* Bug #2 Fix: Gate title/category display if phase is recognition to prevent thesis leaks */}
              {activeSession.phase !== "recognition" ? (
                <>
                  <p className="text-sm font-semibold text-ink">
                    {activeProblem?.title || "Active Diagnostic"}
                  </p>
                  <p className="text-xs text-muted font-mono">
                    Category: {activeProblem?.category || "General"} • Difficulty: {activeProblem?.difficulty || "N/A"}
                  </p>
                </>
              ) : (
                <p className="text-xs text-muted font-mono">
                  Blind diagnostic in progress. Resume session to continue.
                </p>
              )}
            </div>
            <Link href={`/session/${activeSession.id}`}>
              <Button className="gap-2 shadow-md shadow-accent/10">
                Resume Session <ArrowRight size={15} />
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Metrics Section */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Metric 1 */}
        <Card className="p-5 bg-panel-raised/40 border-border/70 flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase tracking-widest text-muted">
            Latest Speed
          </span>
          <div className="my-3">
            <div className="text-3xl font-bold font-mono text-ink tracking-tight">
              {latestCompleted?.recognitionSeconds
                ? formatTime(latestCompleted.recognitionSeconds)
                : "--"}
            </div>
            <p className={`mt-1.5 text-xs flex items-center gap-1 font-medium ${isFaster ? "text-accent" : "text-muted"}`}>
              {previousCompleted && (
                isFaster ? <TrendingDown size={14} /> : <TrendingUp size={14} />
              )}
              {speedChangeText}
            </p>
          </div>
          <span className="text-[10px] text-muted/70 font-mono">Target benchmark: &lt; 2m 00s</span>
        </Card>

        {/* Metric 2: Trend Graph */}
        <Card className="p-5 md:col-span-2 bg-panel-raised/40 border-border/70 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-widest text-muted">
              Recognition Trend
            </span>
            <Activity size={14} className="text-muted/60" />
          </div>

          {completedSessions.length < 2 ? (
            <div className="my-4 flex items-center justify-between rounded-lg bg-canvas/40 px-4 py-3 border border-border/40 text-xs text-muted">
              <span>Complete 2 sessions to unlock real-time pace graphs.</span>
              <span className="font-mono text-[10px] text-accent uppercase">0/2 Completed</span>
            </div>
          ) : (
            <div className="my-3">
              <div className="flex h-16 items-end gap-3 pt-2">
                {(() => {
                  const recentSlice = completedSessions.slice(-6);
                  const times = recentSlice.map((s) => s.recognitionSeconds || 0);
                  const maxTime = Math.max(...times, 1);
                  const minTime = Math.min(...times);
                  const range = maxTime - minTime;

                  return recentSlice.map((session, idx) => {
                    const sec = session.recognitionSeconds || 0;
                    // Bug #3 Fix: Inverted height calculation so faster times render taller bars
                    const barHeight = range === 0 
                      ? 40 
                      : Math.max(18, Math.round(((maxTime - sec) / range) * 42 + 18));
                    const isLatest = idx === recentSlice.length - 1;

                    return (
                      <div key={session.id} className="flex-1 flex flex-col items-center gap-1 group">
                        <div
                          style={{ height: `${barHeight}px` }}
                          className={`w-full rounded-t transition-all ${
                            isLatest ? "bg-accent shadow-sm shadow-accent/20" : "bg-border/80 group-hover:bg-muted"
                          }`}
                        />
                        <span className="text-[9px] font-mono text-muted/80">{sec}s</span>
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

      {/* History & Action Panel */}
      <div className="grid gap-6 md:grid-cols-3 items-stretch">
        <Card className="p-5 md:col-span-2 bg-panel-raised/40 border-border/70">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <span className="text-[11px] font-mono uppercase tracking-widest text-muted flex items-center gap-1.5">
              <Clock3 size={14} /> Completed Runs ({completedSessions.length})
            </span>
          </div>

          {recentList.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted/80">
              No completed sessions recorded yet. Launch blind mode to set your first benchmark.
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {recentList.map((item) => {
                const itemProblem = problems.find((p) => p.id === item.problemId);

                return (
                  <div className="flex items-center justify-between py-3 text-sm" key={item.id}>
                    <div className="space-y-0.5">
                      <p className="text-ink font-medium text-xs sm:text-sm">
                        {itemProblem?.title || "Unknown Problem"}
                      </p>
                      <p className="text-[11px] text-muted font-mono">
                        {itemProblem?.category || "Unknown"} • {itemProblem?.difficulty || "N/A"}
                      </p>
                    </div>
                    <span className="font-mono text-xs font-semibold text-accent bg-accent/10 px-2 py-1 rounded border border-accent/20">
                      {item.recognitionSeconds ? formatTime(item.recognitionSeconds) : "Incomplete"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Quick Launch Card with h-full for layout stretching */}
        <Card className="h-full p-5 flex flex-col justify-between bg-panel-raised/60 border-accent/20 shadow-lg">
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-accent font-bold">
              Practice Engine
            </span>
            <h3 className="text-base font-bold text-ink">Blind Diagnostic</h3>
            <p className="text-xs leading-relaxed text-muted">
              Start a timed problem without titles or tags to force pure intuition.
            </p>
          </div>
          <Link href="/problems" className="mt-4 inline-block w-full" onClick={handleStartNewPractice}>
            <Button className="w-full gap-2 text-xs py-3">
              <Play size={14} className="fill-current" /> Start Practice
            </Button>
          </Link>
        </Card>
      </div>

      {/* Abandon Session Confirmation Modal (Bug #4 Fix) */}
      {showAbandonDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="space-y-4 p-6 bg-panel-raised border border-border rounded-xl shadow-2xl max-w-md w-full">
            <h3 className="text-lg font-bold text-ink">Unfinished Session in Progress</h3>
            <p className="text-xs text-muted leading-relaxed">
              You currently have an unfinished session in progress. Starting a new one will abandon your current progress. Continue?
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