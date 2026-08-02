"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BookOpen, Gauge, LogOut, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [{ href: "/dashboard", label: "Dashboard", icon: Gauge }, { href: "/problems", label: "Practice", icon: BookOpen }, { href: "/settings", label: "Settings", icon: Settings }];
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(); const router = useRouter(); const [allowed, setAllowed] = useState(false);
  useEffect(() => { if (!localStorage.getItem("thinkflow-user")) { router.replace("/login"); return; } if (!localStorage.getItem("thinkflow-onboarding") && pathname !== "/onboarding") { router.replace("/onboarding"); return; } setAllowed(true); }, [pathname, router]);
  const logout = () => { localStorage.removeItem("thinkflow-user"); router.push("/login"); };
  if (!allowed) return <div className="grid min-h-screen place-items-center bg-canvas text-sm text-muted">Loading ThinkFlow…</div>;
  return <div className="min-h-screen bg-canvas md:grid md:grid-cols-[15rem_1fr]"><aside className="border-b border-border bg-panel p-4 md:min-h-screen md:border-b-0 md:border-r"><Link href="/dashboard" className="mb-7 flex items-center gap-2 text-base font-semibold text-ink"><span className="grid size-7 place-items-center rounded-sm bg-accent-muted text-accent">T</span>ThinkFlow</Link><nav aria-label="Application" className="flex gap-2 overflow-x-auto md:flex-col">{items.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={cn("flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm", pathname.startsWith(href) ? "bg-panel-raised text-ink" : "text-muted hover:bg-panel-raised hover:text-ink")}><Icon size={17}/>{label}</Link>)}</nav><button onClick={logout} className="mt-6 flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm text-muted hover:bg-panel-raised hover:text-ink"><LogOut size={17}/>Log out</button></aside><main className="mx-auto w-full max-w-6xl p-5 sm:p-8">{children}</main></div>;
}
