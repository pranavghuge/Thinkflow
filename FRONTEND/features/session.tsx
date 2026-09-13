"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Check, X } from "lucide-react";
import { Button, Card, Field, SectionTitle, Status, inputClass } from "@/components/ui";
import { patterns } from "@/features/data";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

const MAX_APPROACH_ATTEMPTS = 2;

function verdictTone(verdict: "strong" | "needs_improvement" | "incorrect"): "success" | "warning" | "error" {
  if (verdict === "strong") return "success";
  if (verdict === "needs_improvement") return "warning";
  return "error";
}

// ---- Types matching backend schemas exactly ----

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

type ApproachFeedback = {
  strength: string;
  gap: string;
  improve: string;
};

type ApproachEvaluation = {
  pattern_score: number;
  correctness_score: number;
  complexity_score: number;
  edge_case_score: number;
  overall_verdict: "strong" | "needs_improvement" | "incorrect";
  feedback: ApproachFeedback;
};

type ApproachSubmissionResponse = {
  attempt_number: number;
  approach: string;
  evaluation: ApproachEvaluation;
};

type ProblemDetail = {
  id: string;
  title: string;
  category: string;
  pattern: string;
  difficulty: string;
  statement: string;
  examples: Array<{ input: string; output: string; explanation?: string }>;
  constraints: string[];
  time_complexity: string | null;
  space_complexity: string | null;
};

type HintDetail = {
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
  hint_text: string;
};

type SessionSummary = {
  recognition_time: number | null;
  pattern_match: boolean | null;
  claimed_pattern: string | null;
  detected_pattern: string | null;
  attempt_count: number;
  status: string;
  overall_verdict: "strong" | "needs_improvement" | "incorrect" | null;
  feedback: {
    strength: string;
    gap: string;
    improve: string;
  } | null;
  hints_used: number;
};

// UI-only phase, not a backend field — derived from status + local flow
type UiPhase = "recognition" | "confirmation" | "approach" | "rubric" | "hints" | "summary";

export function PracticeSession({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [uiPhase, setUiPhase] = useState<UiPhase>("recognition");
  const [seconds, setSeconds] = useState(0);
  const [confirmStuck, setConfirmStuck] = useState(false);
  const [lastEvaluation, setLastEvaluation] = useState<ApproachSubmissionResponse | null>(null);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [problem, setProblem] = useState<ProblemDetail | null>(null);
  const [currentHintText, setCurrentHintText] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);

  // Load the real session on mount
  useEffect(() => {
    const fetchSession = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiFetch<SessionDetail>(`/sessions/${sessionId}`);
        setSession(data);
        const problemData = await apiFetch<ProblemDetail>(`/problems/${data.problem_id}`);
        setProblem(problemData);
        // Derive starting UI phase from backend status.
        // Note: "confirmation" and "rubric" are transient screens shown
        // right after a live action — on reload we skip straight to the
        // next actionable step since that ephemeral data isn't persisted.
        if (data.status === "recognition_in_progress") {
          setUiPhase("recognition");
        } else if (data.status === "recognition_complete") {
          setUiPhase("approach");
        } else if (data.status === "approach_submitted") {
          // Evaluation detail from the original submission is not
          // persisted server-side, so on reload we can't show Rubric.
          setUiPhase("hints");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load session.");
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId]);

  // Recognition timer, based on the real started_at from the backend
  useEffect(() => {
    if (!session || uiPhase !== "recognition") return;
    const start = new Date(session.started_at).getTime();
    const timer = window.setInterval(() => {
      setSeconds(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [session, uiPhase]);

  const submitRecognition = async (outcome: "recognized" | "stuck", claimedPattern: string | null) => {
    if (!session) return;
    setError("");
    try {
      const updated = await apiFetch<SessionDetail>(`/sessions/${session.id}/recognition`, {
        method: "PATCH",
        body: JSON.stringify({ outcome, claimed_pattern: claimedPattern }),
      });
      setSession(updated);
      setUiPhase("confirmation");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit recognition.");
    }
  };

  const submitApproach = async (content: string) => {
  if (!session) return;
  setError("");
  try {
    const result = await apiFetch<ApproachSubmissionResponse>(`/sessions/${session.id}/approach`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
    setLastEvaluation(result);
    setAttemptCount(result.attempt_number);
    setUiPhase("rubric");
  } catch (err) {
    setError(err instanceof Error ? err.message : "Failed to submit approach.");
  }
};

  const requestHint = async () => {
  if (!session) return;

  setError("");

  try {
    const updated = await apiFetch<HintDetail>(
      `/sessions/${session.id}/hints`,
      {
        method: "POST",
      }
    );

    setSession((prev) =>
      prev
        ? {
            ...prev,
            current_hint_level: updated.current_hint_level,
          }
        : prev
    );

    setCurrentHintText(updated.hint_text);
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "No further hints available."
    );
  }
};

  const goToSummary = async () => {
    if (!session) return;
    setError("");
    try {
      const data = await apiFetch<SessionSummary>(`/sessions/${session.id}/summary`);
      setSummary(data);
      setUiPhase("summary");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load summary.");
    }
  };

  if (loading) {
    return <div className="grid min-h-80 place-items-center"><p className="text-muted">Loading your session…</p></div>;
  }

  if (!session) {
    return (
      <div className="grid min-h-80 place-items-center text-center px-4">
        <p className="text-danger">{error || "Session not found."}</p>
      </div>
    );
  }

  const duration = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="mx-auto max-w-3xl">
      <SectionTitle
        eyebrow={`Session · ${session.status.replace(/_/g, " ")}`}
        title={
          uiPhase === "recognition" ? "Recognize before you solve" :
          uiPhase === "confirmation" ? "Compare the pattern" :
          uiPhase === "approach" ? "Describe your approach" :
          uiPhase === "rubric" ? "Review the reasoning" :
          uiPhase === "hints" ? "Use help deliberately" : "Session complete"
        }
        copy={uiPhase === "recognition" ? "The timer measures pattern recognition, not coding speed." : undefined}
      />

      {error && <p role="alert" className="mb-4 text-sm text-danger">{error}</p>}

      {uiPhase === "recognition" && problem && (
  <Recognition
    problem={problem}
    duration={duration}
    onRecognize={(claimed) => submitRecognition("recognized", claimed)}
    onStuck={() => setConfirmStuck(true)}
  />
)}

      {uiPhase === "confirmation" && (
        <Confirmation session={session} onContinue={() => setUiPhase("approach")} />
      )}

      {uiPhase === "approach" && problem && (
  <Approach problem={problem} source={session.source} attemptCount={attemptCount} onSubmit={submitApproach} />
)}

      {uiPhase === "rubric" && lastEvaluation && (
  <Rubric
    evaluation={lastEvaluation.evaluation}
    attemptCount={attemptCount}
    onRevise={() => setUiPhase("approach")}
    onHints={() => setUiPhase("hints")}
    onSummary={goToSummary}
  />
)}

    {uiPhase === "hints" && (
  <Hints
    currentLevel={session.current_hint_level}
    hintText={currentHintText}
    attemptCount={attemptCount}
    onNextHint={requestHint}
    onRevise={() => setUiPhase("approach")}
    onSummary={goToSummary}
  />
)}

      {uiPhase === "summary" && summary && (
  <Summary
    summary={summary}
    onNext={() => router.push("/problems")}
    onEnd={() => router.push("/dashboard")}
  />
)}

      {confirmStuck && (
        <ConfirmStuck
          onCancel={() => setConfirmStuck(false)}
          onConfirm={() => {
            submitRecognition("stuck", null);
            setConfirmStuck(false);
          }}
        />
      )}
    </div>
  );
}

function Recognition({
  problem,
  duration,
  onRecognize,
  onStuck,
}: {
  problem: ProblemDetail;
  duration: string;
  onRecognize: (pattern: string) => void;
  onStuck: () => void;
}) {
  const [claimed, setClaimed] = useState("");

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border p-6 space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-muted">Problem statement</p>
          <h2 className="mt-2 text-2xl font-bold text-ink">{problem.title}</h2>
          <p className="mt-3 leading-relaxed text-muted text-sm">{problem.statement}</p>
        </div>

        {problem.examples.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-muted">Examples</p>
            {problem.examples.map((ex, idx) => (
              <div key={idx} className="rounded-md border border-border bg-panel-raised p-3 text-xs font-mono space-y-1">
                <div><span className="text-accent font-semibold">Input:</span> <span className="text-ink">{ex.input}</span></div>
                <div><span className="text-accent font-semibold">Output:</span> <span className="text-ink">{ex.output}</span></div>
                {ex.explanation && (
                  <div className="mt-2 pt-2 border-t border-border/60 text-muted font-sans italic">
                    {ex.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2 border-t border-border/80">
          {problem.constraints.length > 0 && (
            <div>
              <p className="font-semibold text-muted uppercase tracking-[.14em] mb-1">Constraints</p>
              <ul className="list-disc list-inside text-muted space-y-0.5 font-mono">
                {problem.constraints.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {(problem.time_complexity || problem.space_complexity) && (
            <div>
              <p className="font-semibold text-muted uppercase tracking-[.14em] mb-1">Expected Complexity</p>
              <div className="text-muted space-y-1 font-mono">
                {problem.time_complexity && <div>Time: <span className="text-warning">{problem.time_complexity}</span></div>}
                {problem.space_complexity && <div>Space: <span className="text-warning">{problem.space_complexity}</span></div>}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-b border-border p-6 text-center bg-panel-raised/30">
        <p className="text-xs font-semibold uppercase tracking-[.14em] text-muted">Recognition timer</p>
        <div className="mx-auto mt-4 grid size-32 place-items-center rounded-full border-2 border-accent text-3xl font-semibold text-ink">
          {duration}
        </div>
      </div>

      <div className="p-6">
        <Field label="Which pattern do you recognize?" hint="Choose the pattern you would pursue before writing code.">
          <select
            value={claimed}
            onChange={(event) => setClaimed(event.target.value)}
            className={inputClass}
          >
            <option value="">Choose a pattern</option>
            {patterns.map((pattern) => (
              <option key={pattern}>{pattern}</option>
            ))}
          </select>
        </Field>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Button disabled={!claimed} onClick={() => onRecognize(claimed)}>
            I recognize the pattern
          </Button>
          <Button variant="secondary" onClick={onStuck}>
            I&apos;m stuck
          </Button>
        </div>
      </div>
    </Card>
  );
}


function Confirmation({ session, onContinue }: { session: SessionDetail; onContinue: () => void }) {
  const match = session.pattern_match;

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <span className="text-muted">Your claim</span>
          <span className="font-medium text-ink">{session.claimed_pattern ?? "I'm stuck"}</span>
        </div>
        <div className="flex items-center justify-between border-b border-border pb-3">
          <span className="text-muted">Detected pattern</span>
          <span className="flex items-center gap-2 font-medium text-accent">
            {session.detected_pattern}
            {match ? <Check size={17} /> : <X size={17} />}
          </span>
        </div>
        <Status tone={match ? "success" : "warning"}>
          {match ? "Pattern confirmed" : "Pattern mismatch"}
        </Status>
      </div>
      <Button onClick={onContinue} className="mt-6 w-full">Write your approach</Button>
    </Card>
  );
}

function Approach({
  problem,
  source,
  attemptCount,
  onSubmit,
}: {
  problem: ProblemDetail;
  source: "curated" | "custom";
  attemptCount: number;
  onSubmit: (content: string) => void;
}) {
  const [value, setValue] = useState("");

  const submit = () => {
    if (value.trim().length >= 24) onSubmit(value.trim());
  };

  return (
    <Card className="p-6">
      {source === "custom" && (
        <div className="mb-6 space-y-4 border-b border-border pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-muted">Problem statement</p>
            <h2 className="mt-2 text-2xl font-bold text-ink">{problem.title}</h2>
            <p className="mt-3 leading-relaxed text-muted text-sm">{problem.statement}</p>
          </div>

          {problem.examples.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[.14em] text-muted">Examples</p>
              {problem.examples.map((ex, idx) => (
                <div key={idx} className="rounded-md border border-border bg-panel-raised p-3 text-xs font-mono space-y-1">
                  <div><span className="text-accent font-semibold">Input:</span> <span className="text-ink">{ex.input}</span></div>
                  <div><span className="text-accent font-semibold">Output:</span> <span className="text-ink">{ex.output}</span></div>
                  {ex.explanation && (
                    <div className="mt-2 pt-2 border-t border-border/60 text-muted font-sans italic">
                      {ex.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {problem.constraints.length > 0 && (
            <div>
              <p className="font-semibold text-muted uppercase tracking-[.14em] mb-1 text-xs">Constraints</p>
              <ul className="list-disc list-inside text-muted space-y-0.5 font-mono text-xs">
                {problem.constraints.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      {(problem.time_complexity || problem.space_complexity) && (
  <div>
    <p className="font-semibold text-muted uppercase tracking-[.14em] mb-1 text-xs">
      Expected Complexity
    </p>

    <div className="text-muted space-y-1 font-mono text-xs">
      {problem.time_complexity && (
        <div>
          Time: <span className="text-warning">{problem.time_complexity}</span>
        </div>
      )}

      {problem.space_complexity && (
        <div>
          Space: <span className="text-warning">{problem.space_complexity}</span>
        </div>
      )}
    </div>
  </div>
)}

      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-mono uppercase tracking-[.14em] text-muted">
          Attempt {attemptCount + 1} of {MAX_APPROACH_ATTEMPTS}
        </span>
      </div>
      <Field label="Your approach" hint="Describe your algorithm, not code.">
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className={cn(inputClass, "min-h-44 resize-y")}
          placeholder="Describe the data you would track, the invariant, and how you would move through the input."
        />
      </Field>
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-muted">{value.length} characters</span>
      </div>
      {value.length > 0 && value.trim().length < 24 && (
        <p className="mt-3 text-sm text-danger">Write at least 24 characters so the rubric has enough reasoning to evaluate.</p>
      )}
      <Button disabled={value.trim().length < 24} onClick={submit} className="mt-5 w-full">
        Submit for feedback
      </Button>
    </Card>
  );
}

function Rubric({
  evaluation,
  attemptCount,
  onRevise,
  onHints,
  onSummary,
}: {
  evaluation: ApproachEvaluation;
  attemptCount: number;
  onRevise: () => void;
  onHints: () => void;
  onSummary: () => void;
}) {
  const solid = evaluation.overall_verdict === "strong";
  const attemptsExhausted = attemptCount >= MAX_APPROACH_ATTEMPTS;
  const scores = [
    { label: "Pattern fit", score: evaluation.pattern_score },
    { label: "Complexity", score: evaluation.complexity_score },
    { label: "Correctness", score: evaluation.correctness_score },
    { label: "Edge cases", score: evaluation.edge_case_score },
  ];

  return (
    <Card className="p-6">
      <div className="grid gap-3 sm:grid-cols-2">
        {scores.map((item) => (
          <div key={item.label} className="flex items-center justify-between rounded-sm border border-border bg-panel-raised px-4 py-3">
            <span className="text-sm text-ink">{item.label}</span>
            <span className={cn("rounded-full px-2.5 py-1 text-xs", item.score >= 70 ? "bg-accent-muted text-accent" : "bg-[#4b3e2b] text-warning")}>
              {item.score} / 100
            </span>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <Status tone={verdictTone(evaluation.overall_verdict)}>
          {evaluation.overall_verdict.replace(/_/g, " ")}
        </Status>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <h2 className="font-medium text-ink">Strength</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{evaluation.feedback.strength}</p>
          </div>
          <div>
            <h2 className="font-medium text-ink">Gap</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{evaluation.feedback.gap}</p>
          </div>
          <div>
            <h2 className="font-medium text-ink">Improve</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{evaluation.feedback.improve}</p>
          </div>
        </div>
      </div>
      {solid ? (
        <Button onClick={onSummary} className="mt-6 w-full">View session summary</Button>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button
            variant="secondary"
            onClick={onRevise}
            disabled={attemptsExhausted}
            className={cn(attemptsExhausted && "bg-panel-raised text-muted border-border opacity-60 cursor-not-allowed hover:bg-panel-raised")}
          >
            {attemptsExhausted ? "No attempts remaining" : "Revise approach"}
          </Button>
          <Button onClick={onHints}>Get a hint</Button>
        </div>
      )}
    </Card>
  );
}

function Hints({
  currentLevel,
  hintText,
  attemptCount,
  onNextHint,
  onRevise,
  onSummary,
}: {
  currentLevel: number;
  hintText: string | null;
  attemptCount: number;
  onNextHint: () => void;
  onRevise: () => void;
  onSummary: () => void;
}) {
  const last = currentLevel >= 5;
  const attemptsExhausted = attemptCount >= MAX_APPROACH_ATTEMPTS;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-ink">Hint ladder</h2>
        <span className="text-sm text-accent">Level {currentLevel} / 5</span>
      </div>

      <div className="mt-6 rounded-sm border border-border bg-panel-raised p-4">
        <p className="text-xs font-semibold uppercase tracking-[.14em] text-muted">Current hint</p>
        <p className="mt-2 text-sm leading-6 text-ink">
          {hintText ?? "Request a hint to see it here."}
        </p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Button variant="secondary" disabled={last} onClick={onNextHint}>
          {currentLevel === 0 ? "Get first hint" : "Next hint"}
        </Button>
        <Button
          variant="secondary"
          onClick={onRevise}
          disabled={attemptsExhausted}
          className={cn(attemptsExhausted && "bg-panel-raised text-muted border-border opacity-60 cursor-not-allowed hover:bg-panel-raised")}
        >
          {attemptsExhausted ? "No attempts remaining" : "Revise approach"}
        </Button>
        <Button onClick={onSummary}>View session summary</Button>
      </div>
    </Card>
  );
}

function Summary({
  summary,
  onNext,
  onEnd,
}: {
  summary: SessionSummary;
  onNext: () => void;
  onEnd: () => void;
}) {
  const outcomeLabel = (() => {
    if (summary.overall_verdict === "strong") {
      if (summary.hints_used === 0) {
        return "Solved cold";
      }

      const hintWord = summary.hints_used === 1 ? "hint" : "hints";
      return `Solved after ${summary.hints_used} ${hintWord}`;
    }

    if (summary.overall_verdict === "needs_improvement") {
      if (summary.hints_used === 0) {
        return "Needs improvement";
      }

      const hintWord = summary.hints_used === 1 ? "hint" : "hints";
      return `Needs improvement — used ${summary.hints_used} ${hintWord}`;
    }

    if (summary.overall_verdict === "incorrect") {
      if (summary.hints_used === 0) {
        return "Incorrect";
      }

      const hintWord = summary.hints_used === 1 ? "hint" : "hints";
      return `Incorrect — used ${summary.hints_used} ${hintWord}`;
    }

    return "No approach submitted";
  })();

  const finalVerdictLabel = (() => {
    if (summary.overall_verdict === "strong") {
      return "Solved";
    }

    if (summary.overall_verdict === "needs_improvement") {
      return "Needs improvement";
    }

    if (summary.overall_verdict === "incorrect") {
      return "Incorrect";
    }

    return "No verdict available";
  })();

  return (
    <Card className="p-6">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[.14em] text-muted">
          Recognition time
        </p>

        <p className="mt-3 text-4xl font-semibold text-ink">
          {summary.recognition_time !== null
            ? `${Math.floor(summary.recognition_time / 60)}m ${
                summary.recognition_time % 60
              }s`
            : "—"}
        </p>
      </div>

      <div className="mt-7 divide-y divide-border border-y border-border">
        {[
          ["Pattern", summary.pattern_match ? "Confirmed" : "Mismatched"],
          ["Outcome", outcomeLabel],
          ["Attempts", String(summary.attempt_count)],
          ["Status", summary.status.replace(/_/g, " ")],
        ].map(([label, value]) => (
          <div
            className="flex justify-between py-3 text-sm"
            key={label}
          >
            <span className="text-muted">{label}</span>
            <span className="text-ink">{value}</span>
          </div>
        ))}
      </div>

      {summary.overall_verdict && summary.feedback ? (
        <div className="mt-6 space-y-4">
          <div
            className={cn(
              "rounded-sm border p-4",
              summary.overall_verdict === "strong" &&
                "border-accent/40 bg-accent-muted/30",
              summary.overall_verdict === "needs_improvement" &&
                "border-warning/40 bg-warning/10",
              summary.overall_verdict === "incorrect" &&
                "border-danger/40 bg-danger/10"
            )}
          >
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-muted">
              Final verdict
            </p>

            <p className="mt-2 text-sm font-medium text-ink">
              {finalVerdictLabel}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[.14em] text-muted">
                Strength
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted">
                {summary.feedback.strength}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[.14em] text-muted">
                Gap
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted">
                {summary.feedback.gap}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[.14em] text-muted">
                Improve
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted">
                {summary.feedback.improve}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-sm border border-warning/40 bg-warning/10 p-4 text-sm text-muted">
          No approach was submitted for this session, so no verdict is
          available.
        </div>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Button variant="secondary" onClick={onEnd}>
          End session
        </Button>

        <Button onClick={onNext} className="gap-2">
          Next problem
          <ArrowRight size={16} />
        </Button>
      </div>
    </Card>
  );
}

function ConfirmStuck({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="stuck-title" className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-5">
      <Card className="w-full max-w-md p-6">
        <AlertCircle className="text-warning" />
        <h2 id="stuck-title" className="mt-4 text-xl font-semibold text-ink">Reveal the pattern?</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          This logs an &quot;I&apos;m stuck&quot; outcome and stops recognition timing.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={onCancel}>Keep thinking</Button>
          <Button onClick={onConfirm}>Reveal pattern</Button>
        </div>
      </Card>
    </div>
  );
}