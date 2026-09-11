"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Clock3, Play, Sparkles, TrendingDown, TrendingUp, Activity } from "lucide-react";
import { Button, Card, SectionTitle } from "@/components/ui";
import { formatTime } from "@/features/data";
import { apiFetch } from "@/lib/api";

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
};

export function Dashboard() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionDetail[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState("");
  const [showAbandonDialog, setShowAbandonDialog] = useState(false);

  useEffect(() => {
    const fetchSessions = async () => {
      setError("");
      try {
        const data = await apiFetch<SessionDetail[]>("/sessions");
        const sorted = [...data].sort(
          (a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime()
        );
        setSessions(sorted);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load sessions.");
      } finally {
        setIsLoaded(true);
      }
    };

    fetchSessions();
  }, []);

  const completedSessions = sessions.filter((s) => s.recognition_time !== null);

  const latestCompleted = completedSessions[completedSessions.length - 1];
  const previousCompleted = completedSessions[completedSessions.length - 2];

  let speedChangeText = "2+ sessions required for comparison";
  let isFaster = false;

  if (latestCompleted && previousCompleted) {
    const diff = previousCompleted.recognition_time! - latestCompleted.recognition_time!;
    const pct = Math.round((diff / previousCompleted.recognition_time!) * 100);

    if (pct > 0) {
      speedChangeText = `${pct}% faster than previous attempt`;
      isFaster = true;
    } else if (pct < 0) {
      speedChangeText = `${Math.abs(pct)}% slower than previous attempt`;
    } else {
      speedChangeText = "Matched previous speed";
    }
  }

  const recentList = [...completedSessions].reverse().slice(0, 4);

  // Heuristic only — the backend never sets a true "finished" status.
  // A session sitting at "approach_submitted" may be abandoned or may
  // simply have been left after the user viewed hints/summary.
  const activeSession =
    sessions
      .slice()
      .reverse()
      .find((s) => s.status === "recognition_in_progress" || s.status === "recognition_complete") || null;

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
        <div className="grid gap-4 md:grid-cols-3">
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
              <p className="text-xs text-muted font-mono">
                Problem: {activeSession.problem_id}
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

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5 bg-panel-raised/40 border-border/70 flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase tracking-widest text-muted">
            Latest Speed
          </span>
          <div className="my-3">
            <div className="text-3xl font-bold font-mono text-ink tracking-tight">
              {latestCompleted?.recognition_time !== null && latestCompleted?.recognition_time !== undefined
                ? formatTime(latestCompleted.recognition_time)
                : "--"}
            </div>
            <p className={`mt-1.5 text-xs flex items-center gap-1 font-medium ${isFaster ? "text-accent" : "text-muted"}`}>
              {previousCompleted && (isFaster ? <TrendingDown size={14} /> : <TrendingUp size={14} />)}
              {speedChangeText}
            </p>
          </div>
          <span className="text-[10px] text-muted/70 font-mono">Target benchmark: &lt; 2m 00s</span>
        </Card>

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
              <span className="font-mono text-[10px] text-accent uppercase">
                {completedSessions.length}/2 Completed
              </span>
            </div>
          ) : (
            <div className="my-3">
              <div className="flex h-16 items-end gap-3 pt-2">
                {(() => {
                  const recentSlice = completedSessions.slice(-6);
                  const times = recentSlice.map((s) => s.recognition_time || 0);
                  const maxTime = Math.max(...times, 1);
                  const minTime = Math.min(...times);
                  const range = maxTime - minTime;

                  return recentSlice.map((session, idx) => {
                    const sec = session.recognition_time || 0;
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
              {recentList.map((item) => (
                <div className="flex items-center justify-between py-3 text-sm" key={item.id}>
                  <div className="space-y-0.5">
                    <p className="text-ink font-medium text-xs sm:text-sm">
                      Problem: {item.problem_id}
                    </p>
                    <p className="text-[11px] text-muted font-mono">
                      {item.detected_pattern || "Pattern pending"}
                    </p>
                  </div>
                  <span className="font-mono text-xs font-semibold text-accent bg-accent/10 px-2 py-1 rounded border border-accent/20">
                    {item.recognition_time !== null ? formatTime(item.recognition_time) : "Incomplete"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

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
              <Button className="text-xs px-3 py-2 h-auto" onClick={handleConfirmAbandon}>
                Continue & Abandon
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}