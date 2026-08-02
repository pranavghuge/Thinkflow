"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Check, X } from "lucide-react";
import { Button, Card, Field, SectionTitle, Status, inputClass } from "@/components/ui";
import { loadSession, patterns, problems, saveSession, type PracticeSession } from "@/features/data";
import { cn } from "@/lib/utils";

const hintTitles = ["Technique family", "Key observation", "Data structure", "Algorithm skeleton", "Implementation guidance"];
const hintCopy = [
  "Look for a bounded region that changes as you move forward.",
  "Track what must remain true while the region expands.",
  "A set can represent membership inside the active region.",
  "Move the right edge, then shrink the left edge until the invariant holds.",
  "Write down the invariant before tracing edge cases."
];

export function PracticeSession({ sessionId }: { sessionId: string }) {
  const router = useRouter(); 
  const [session, setSession] = useState<PracticeSession | null>(null); 
  const [seconds, setSeconds] = useState(0); 
  const [confirmStuck, setConfirmStuck] = useState(false);

  useEffect(() => { 
    setSession(loadSession(sessionId)); 
  }, [sessionId]);

  // Compute problem unconditionally before any early returns to maintain hook order
  const prob = session ? problems.find((p) => p.id === session.problemId) : null;

  useEffect(() => { 
    if (!session || session.phase !== "recognition") return; 
    const timer = window.setInterval(() => setSeconds(Math.floor((Date.now() - session.startedAt) / 1000)), 1000); 
    return () => window.clearInterval(timer); 
  }, [session]);

  const update = (patch: Partial<PracticeSession>) => { 
    if (!session) return; 
    const next = { ...session, ...patch }; 
    setSession(next); 
    saveSession(next); 
  };

  // Safe early returns *after* all hooks have been declared
  if (!session) {
    return <div className="grid min-h-80 place-items-center"><p className="text-muted">Loading your session…</p></div>;
  }

  if (!prob) {
    return <div className="grid min-h-80 place-items-center"><p className="text-muted">Problem details not found.</p></div>;
  }

  const phase = session.phase;
  const duration = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="mx-auto max-w-3xl">
      <SectionTitle 
        eyebrow={`Session · ${prob.difficulty} · ${prob.pattern}`} 
        title={
          phase === "recognition" ? "Recognize before you solve" : 
          phase === "confirmation" ? "Compare the pattern" : 
          phase === "approach" ? "Describe your approach" : 
          phase === "rubric" ? "Review the reasoning" : 
          phase === "hints" ? "Use help deliberately" : "Session complete"
        } 
        copy={phase === "recognition" ? "The timer measures pattern recognition, not coding speed." : undefined}
      />
      
      {phase === "recognition" && (
        <Recognition 
          session={session} 
          duration={duration} 
          onRecognize={(claimed) => update({ claimedPattern: claimed, duration: seconds, phase: "confirmation" })} 
          onStuck={() => setConfirmStuck(true)} 
        />
      )}
      
      {phase === "confirmation" && <Confirmation session={session} onContinue={() => update({ phase: "approach" })}/>} 
      {phase === "approach" && <Approach session={session} onSubmit={(verdict) => update({ verdict, attempt: session.attempt + 1, phase: "rubric" })}/>} 
      {phase === "rubric" && <Rubric session={session} onRevise={() => update({ phase: "approach" })} onHints={() => update({ phase: "hints" })} onSummary={() => update({ phase: "summary" })}/>} 
      {phase === "hints" && <Hints session={session} onUpdate={update}/>} 
      {phase === "summary" && <Summary session={session} onNext={() => router.push("/problems")} onEnd={() => router.push("/dashboard")}/>} 
      
      {confirmStuck && (
        <ConfirmStuck 
          onCancel={() => setConfirmStuck(false)} 
          onConfirm={() => { update({ stuck: true, duration: seconds, phase: "confirmation" }); setConfirmStuck(false); }}
        />
      )}
    </div>
  );
}

function Recognition({ session, duration, onRecognize, onStuck }: { session: PracticeSession; duration: string; onRecognize: (pattern: typeof patterns[number]) => void; onStuck: () => void }) { 
  const prob = problems.find((p) => p.id === session.problemId);

  if (!prob) return null;

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border p-6 space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-muted">Problem statement</p>
          <h2 className="mt-2 text-2xl font-bold text-ink">{prob.title}</h2>
          <p className="mt-3 leading-relaxed text-muted text-sm">
            {prob.description}
          </p>
        </div>

        {prob.examples && prob.examples.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-muted">Examples</p>
            {prob.examples.map((ex, idx) => (
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
          {prob.constraints && prob.constraints.length > 0 && (
            <div>
              <p className="font-semibold text-muted uppercase tracking-[.14em] mb-1">Constraints</p>
              <ul className="list-disc list-inside text-muted space-y-0.5 font-mono">
                {prob.constraints.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {(prob.expectedTimeComplexity || prob.expectedSpaceComplexity) && (
            <div>
              <p className="font-semibold text-muted uppercase tracking-[.14em] mb-1">Expected Complexity</p>
              <div className="text-muted space-y-1 font-mono">
                {prob.expectedTimeComplexity && <div>Time: <span className="text-warning">{prob.expectedTimeComplexity}</span></div>}
                {prob.expectedSpaceComplexity && <div>Space: <span className="text-warning">{prob.expectedSpaceComplexity}</span></div>}
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
            value={session.claimedPattern || ""} 
            onChange={event => onRecognize(event.target.value as typeof patterns[number])} 
            className={inputClass}
          >
            <option value="">Choose a pattern</option>
            {patterns.map(pattern => (
              <option key={pattern}>{pattern}</option>
            ))}
          </select>
        </Field>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Button disabled={!session.claimedPattern} onClick={() => onRecognize(session.claimedPattern as typeof patterns[number])}>
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

function Confirmation({ session, onContinue }: { session: PracticeSession; onContinue: () => void }) { 
  const prob = problems.find((p) => p.id === session.problemId);
  
  if (!prob) return null;

  const match = session.claimedPattern === prob.pattern; 
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <span className="text-muted">Your claim</span>
          <span className="font-medium text-ink">{session.stuck ? "I’m stuck" : session.claimedPattern}</span>
        </div>
        <div className="flex items-center justify-between border-b border-border pb-3">
          <span className="text-muted">Detected pattern</span>
          <span className="flex items-center gap-2 font-medium text-accent">
            {prob.pattern}{match ? <Check size={17}/> : <X size={17}/>}
          </span>
        </div>
        <Status tone={match ? "success" : "warning"}>{match ? "High confidence · 92%" : "Likely · 82%"}</Status>
        <p className="text-sm leading-6 text-muted">
          {match ? "The structure of the problem supports your chosen pattern." : `The problem needs ${prob.pattern.toLowerCase()}, not ${session.claimedPattern?.toLowerCase() ?? "a pattern claim"}. Focus on the constraints in the prompt.`}
        </p>
      </div>
      <Button onClick={onContinue} className="mt-6 w-full">Write your approach</Button>
    </Card>
  ); 
}

function Approach({ session, onSubmit }: { session: PracticeSession; onSubmit: (verdict: "Solid" | "Needs Work") => void }) { 
  const [value, setValue] = useState(""); 
  const remaining = 2 - session.attempt; 
  const submit = () => { 
    if (value.trim().length >= 24) onSubmit(value.toLowerCase().includes("window") ? "Solid" : "Needs Work"); 
  }; 
  return (
    <Card className="p-6">
      <Field label="Your approach" hint="Describe your algorithm, not code.">
        <textarea 
          value={value} 
          onChange={event => setValue(event.target.value)} 
          className={cn(inputClass, "min-h-44 resize-y")} 
          placeholder="Describe the data you would track, the invariant, and how you would move through the input."
        />
      </Field>
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-muted">{value.length} characters</span>
        <span className="rounded-full border border-warning/60 px-2.5 py-1 text-warning">Attempt {session.attempt + 1} / 2</span>
      </div>
      {value.length > 0 && value.trim().length < 24 && (
        <p className="mt-3 text-sm text-danger">Write at least 24 characters so the rubric has enough reasoning to evaluate.</p>
      )}
      <Button disabled={value.trim().length < 24} onClick={submit} className="mt-5 w-full">Submit for feedback</Button>
      {remaining === 0 && <Status tone="warning">Your next step is a hint. Further approach attempts are not available in V1.</Status>}
    </Card>
  ); 
}

function Rubric({ session, onRevise, onHints, onSummary }: { session: PracticeSession; onRevise: () => void; onHints: () => void; onSummary: () => void }) { 
  const solid = session.verdict === "Solid"; 
  const finalAttempt = session.attempt >= 2; 
  const scores = [
    { label: "Pattern fit", score: solid ? 5 : 3 }, 
    { label: "Complexity", score: solid ? 4 : 3 }, 
    { label: "Correctness", score: solid ? 4 : 2 }, 
    { label: "Edge cases", score: solid ? 4 : 2 }
  ]; 
  return (
    <Card className="p-6">
      <div className="grid gap-3 sm:grid-cols-2">
        {scores.map(item => (
          <div key={item.label} className="flex items-center justify-between rounded-sm border border-border bg-panel-raised px-4 py-3">
            <span className="text-sm text-ink">{item.label}</span>
            <span className={cn("rounded-full px-2.5 py-1 text-xs", item.score >= 4 ? "bg-accent-muted text-accent" : "bg-[#4b3e2b] text-warning")}>
              {item.score} / 5
            </span>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <Status tone={solid ? "success" : "warning"}>{solid ? "Solid" : "Needs Work"} · Backend-computed verdict</Status>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <h2 className="font-medium text-ink">Strengths</h2>
            <p className="mt-2 text-sm leading-6 text-muted">You identified a useful constraint and connected it to a practical traversal.</p>
          </div>
          <div>
            <h2 className="font-medium text-ink">Improve</h2>
            <p className="mt-2 text-sm leading-6 text-muted">State the invariant and the edge condition before describing the steps.</p>
          </div>
        </div>
      </div>
      {solid ? (
        <Button onClick={onSummary} className="mt-6 w-full">View session summary</Button>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {!finalAttempt && <Button variant="secondary" onClick={onRevise}>Revise approach</Button>}
          <Button onClick={onHints}>{finalAttempt ? "Continue to hints" : "Get a hint"}</Button>
        </div>
      )}
    </Card>
  ); 
}

function Hints({ session, onUpdate }: { session: PracticeSession; onUpdate: (patch: Partial<PracticeSession>) => void }) { 
  const current = Math.max(1, session.hintLevel || 1); 
  const last = current === 5; 
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-ink">Hint ladder</h2>
        <span className="text-sm text-accent">Level {current} / 5</span>
      </div>
      <ol className="mt-5 space-y-3">
        {hintTitles.map((title, index) => { 
          const position = index + 1; 
          return (
            <li className={cn("flex items-center gap-3 text-sm", position < current ? "text-muted" : position === current ? "text-ink" : "text-muted/50")} key={title}>
              <span className={cn("size-2 rounded-full", position <= current ? "bg-accent" : "bg-border")}/>
              {title}
            </li>
          ); 
        })}
      </ol>
      <div className="mt-6 rounded-sm border border-border bg-panel-raised p-4">
        <p className="text-xs font-semibold uppercase tracking-[.14em] text-muted">Current hint</p>
        <p className="mt-2 text-sm leading-6 text-ink">{hintCopy[current - 1]}</p>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Button variant="secondary" disabled={last} onClick={() => onUpdate({ hintLevel: current + 1 })}>Next hint</Button>
        <Button onClick={() => onUpdate({ hintLevel: current, phase: "summary" })}>{last ? "View session summary" : "Finish with summary"}</Button>
      </div>
    </Card>
  ); 
}

function Summary({ session, onNext, onEnd }: { session: PracticeSession; onNext: () => void; onEnd: () => void }) { 
  const prob = problems.find((p) => p.id === session.problemId);
  const matched = prob && session.claimedPattern === prob.pattern; 
  return (
    <Card className="p-6">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[.14em] text-muted">Recognition time</p>
        <p className="mt-3 text-4xl font-semibold text-ink">
          {Math.max(1, Math.round((session.duration ?? 134) / 60))}m {String((session.duration ?? 134) % 60).padStart(2, "0")}s
        </p>
        <p className="mt-2 text-sm text-accent">A focused signal for your next practice.</p>
      </div>
      <div className="mt-7 divide-y divide-border border-y border-border">
        {[
          ["Pattern", matched ? "Confirmed" : "Mismatched"], 
          ["Approach", `${session.verdict ?? "Needs Work"}, ${session.attempt} attempt${session.attempt === 1 ? "" : "s"}`], 
          ["Hints used", String(session.hintLevel)]
        ].map(([label, value]) => (
          <div className="flex justify-between py-3 text-sm" key={label}>
            <span className="text-muted">{label}</span>
            <span className="text-ink">{value}</span>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-sm border border-border bg-panel-raised p-4">
        <p className="text-xs font-semibold uppercase tracking-[.14em] text-muted">Next curated problem</p>
        <p className="mt-2 text-sm text-ink">Continue with a related pattern at a comparable difficulty.</p>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Button variant="secondary" onClick={onEnd}>End session</Button>
        <Button onClick={onNext} className="gap-2">Next problem <ArrowRight size={16}/></Button>
      </div>
    </Card>
  ); 
}

function ConfirmStuck({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) { 
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="stuck-title" className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-5">
      <Card className="w-full max-w-md p-6">
        <AlertCircle className="text-warning"/>
        <h2 id="stuck-title" className="mt-4 text-xl font-semibold text-ink">Reveal the pattern?</h2>
        <p className="mt-2 text-sm leading-6 text-muted">This logs an “I&apos;m stuck” outcome and stops recognition timing. You can still review the detected pattern and complete the reasoning loop.</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={onCancel}>Keep thinking</Button>
          <Button onClick={onConfirm}>Reveal pattern</Button>
        </div>
      </Card>
    </div>
  ); 
}

