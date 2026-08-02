"use client";
import { useParams } from "next/navigation";
import { PracticeSession } from "@/features/session";
export default function Page() { const params = useParams<{ id: string }>(); return <PracticeSession sessionId={params.id}/>; }
