"use client";

import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger"; loading?: boolean };
export function Button({ className, variant = "primary", loading, children, disabled, ...props }: ButtonProps) {
  const variants = {
    primary: "border-accent bg-accent-muted text-white hover:bg-[#5c7461]",
    secondary: "border-border bg-panel-raised text-ink hover:border-muted",
    ghost: "border-transparent text-muted hover:bg-panel-raised hover:text-ink",
    danger: "border-danger/60 text-danger hover:bg-danger/10"
  };
  return <button className={cn("inline-flex min-h-10 items-center justify-center rounded-sm border px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50", variants[variant], className)} disabled={disabled || loading} {...props}>{loading ? "Working…" : children}</button>;
}

export function Card({ children, className }: PropsWithChildren<{ className?: string }>) { return <section className={cn("rounded-md border border-border bg-panel shadow-panel", className)}>{children}</section>; }
export function SectionTitle({ eyebrow, title, copy }: { eyebrow?: string; title: string; copy?: string }) { return <div className="mb-6"><p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">{eyebrow}</p><h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h1>{copy && <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{copy}</p>}</div>; }
export function Field({ label, children, hint, error }: PropsWithChildren<{ label: string; hint?: string; error?: string }>) { return <label className="block text-sm font-medium text-ink"><span>{label}</span><div className="mt-2">{children}</div>{error ? <p className="mt-1.5 text-sm text-danger">{error}</p> : hint ? <p className="mt-1.5 text-xs text-muted">{hint}</p> : null}</label>; }
export const inputClass = "w-full rounded-sm border border-border bg-canvas px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-accent";
export function Status({ children, tone = "info" }: PropsWithChildren<{ tone?: "info" | "success" | "warning" | "error" }>) { const tones = { info: "border-border text-muted", success: "border-accent-muted text-accent", warning: "border-warning/60 text-warning", error: "border-danger/60 text-danger" }; return <div role="status" className={cn("rounded-sm border px-3 py-2 text-sm", tones[tone])}>{children}</div>; }
export function EmptyState({ title, action }: { title: string; action?: React.ReactNode }) { return <Card className="p-7 text-center"><p className="font-medium text-ink">{title}</p><p className="mt-2 text-sm text-muted">Start a focused practice session when you are ready.</p>{action && <div className="mt-4">{action}</div>}</Card>; }
export function Skeleton({ className }: { className?: string }) { return <div className={cn("animate-pulse rounded-sm bg-panel-raised", className)} />; }
