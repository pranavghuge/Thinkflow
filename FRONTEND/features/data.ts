export type Pattern =
  | "Array & Hashing"
  | "Two Pointers"
  | "Graph Traversal"
  | "Sliding Window"
  | "Stack"
  | "Binary Search"
  | "Linked List"
  | "Trees"
  | "Heaps / Priority Queue"
  | "Graphs";

export const patterns: Pattern[] = [
  "Array & Hashing",
  "Two Pointers",
  "Graph Traversal",
  "Sliding Window",
  "Stack",
  "Binary Search",
  "Linked List",
  "Trees",
  "Heaps / Priority Queue",
  "Graphs",
];

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}