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

export type SessionPhase =
  | "recognition"
  | "confirmation"
  | "approach"
  | "rubric"
  | "hints"
  | "summary";

export type Example = {
  input: string;
  output: string;
  explanation?: string;
};

export type Category =
  | "Arrays & Strings"
  | "Linked Lists & Stacks"
  | "Trees & Graphs"
  | "Heap & Sorting";

export type Problem = {
  id: string;
  title: string;
  category: Category;
  pattern: Pattern;
  difficulty: "Easy" | "Medium" | "Hard";
  recognitionMinutes: number;
  description: string;
  examples: Array<{ input: string; output: string; explanation?: string }>;
  constraints: string[];
  expectedTimeComplexity: string;
  expectedSpaceComplexity: string;
};

export type PracticeSession = {
  id: string;
  problemId: string; // <-- CHANGED: Store only the ID, not the whole object
  phase: SessionPhase;
  claimedPattern?: Pattern;
  stuck?: boolean;
  startedAt: number;
  duration?: number;
  attempt: number;
  hintLevel: number;
  verdict?: "Solid" | "Needs Work";
  recognitionSeconds?: number;
};

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

export const problems: Problem[] = [
  {
    id: "ah-Two-Sum",
    title: "Two Sum",
    category: "Arrays & Strings",
    pattern: "Array & Hashing",
    difficulty: "Easy",
    recognitionMinutes: 2,
    description:
      "You are given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.",
    examples: [
      {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0,1]",
        explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
      },
    ],
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
    ],
    expectedTimeComplexity: "O(n)",
    expectedSpaceComplexity: "O(n)",
  },
  {
    id: "ah1",
    title: "Contains Duplicate",
    category: "Arrays & Strings",
    pattern: "Array & Hashing",
    difficulty: "Easy",
    recognitionMinutes: 2,
    description:
      "Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.",
    examples: [
      {
        input: "nums = [1,2,3,1]",
        output: "true",
        explanation: "The element 1 occurs at the indices 0 and 3",
      },
    ],
    constraints: [
      "1 <= nums.length <= 10^5",
      "-10^9 <= nums[i] <= 10^9",
    ],
    expectedTimeComplexity: "O(n)",
    expectedSpaceComplexity: "O(n)",
  },
  {
    id: "ah2",
    title: "Group Anagrams",
    category: "Arrays & Strings",
    pattern: "Array & Hashing",
    difficulty: "Medium",
    recognitionMinutes: 3,
    description:
      "Given an array of strings strs, group the anagrams together. You can return the answer in any order.",
    examples: [
      {
        input: 'strs = ["eat","tea","tan","ate","nat","bat"]',
        output: "[['bat'],['nat','tan'],['ate','eat','tea']]",
        explanation:
          "There is no string in strs that can be rearranged to form bat.,The strings nat and tan are anagrams as they can be rearranged to form each other.,The strings ate, eat, and tea are anagrams as they can be rearranged to form each other.",
      },
    ],
    constraints: [
      "1 <= strs.length <= 10^4",
      "0 <= strs[i].length <= 100",
      "strs[i] consists of lowercase English letters.",
    ],
    expectedTimeComplexity: "O(n.klogk)",
    expectedSpaceComplexity: "O(n.k)",
  },
  {
    id: "ah3",
    title: "Longest Consecutive Sequence",
    category: "Arrays & Strings",
    pattern: "Array & Hashing",
    difficulty: "Medium",
    recognitionMinutes: 3,
    description:
      "Given an unsorted array of integers nums, return the length of the longest consecutive elements sequence. You must write an algorithm that runs in O(n) time.",
    examples: [
      {
        input: "nums = [100,4,200,1,3,2]",
        output: "4",
        explanation:
          "The longest consecutive elements sequence is [1, 2, 3, 4]. Therefore its length is 4.",
      },
    ],
    constraints: ["0 <= nums.length <= 10^5", "-10^9 <= nums[i] <= 10^9"],
    expectedTimeComplexity: "O(n)",
    expectedSpaceComplexity: "O(n)",
  },
  {
    id: "ah4",
    title: "Top K Frequent Elements",
    category: "Arrays & Strings",
    pattern: "Array & Hashing",
    difficulty: "Medium",
    recognitionMinutes: 3,
    description:
      "Given an integer array nums and an integer k, return the k most frequent elements. You may return the answer in any order.",
    examples: [
      {
        input: "nums = [1,1,1,2,2,3], k = 2",
        output: "[1,2]",
      },
    ],
    constraints: [
      "1 <= nums.length <= 10^5",
      "-10^4 <= nums[i] <= 10^4",
      "k is in the range [1, the number of unique elements in the array].",
      "It is guaranteed that the answer is unique",
    ],
    expectedTimeComplexity: "O(N)",
    expectedSpaceComplexity: "O(N)",
  },
  {
    id: "tp1",
    title: "Valid Palindrome",
    category: "Arrays & Strings",
    pattern: "Two Pointers",
    difficulty: "Easy",
    recognitionMinutes: 2,
    description:
      "A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers. Given a string s, return true if it is a palindrome, or false otherwise.",
    examples: [
      {
        input: 's = "A man, a plan, a canal: Panama"',
        output: "true",
        explanation: '"amanaplanacanalpanama" is a palindrome.',
      },
    ],
    constraints: [
      "1 <= s.length <= 2 * 10^5",
      "s consists only of printable ASCII characters.",
    ],
    expectedTimeComplexity: "O(n)",
    expectedSpaceComplexity: "O(1)",
  },
];

const storageKeyActive = "thinkflow-active-session";
const storageKeyHistory = "thinkflow_sessions_history";

// --- DASHBOARD HELPERS ---
export function getSessions(): PracticeSession[] {
  if (typeof window === "undefined") return [];
  
  const sessions: PracticeSession[] = [];
  const now = Date.now();
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

  try {
    const indexRaw = localStorage.getItem("thinkflow_sessions_index");
    if (!indexRaw) return [];
    
    const ids: string[] = JSON.parse(indexRaw);
    const validIds: string[] = [];

    for (const id of ids) {
      const raw = localStorage.getItem(`session_${id}`);
      if (raw) {
        try {
          const item = JSON.parse(raw);
          if (item && item.id) {
            // Check if session is abandoned (unfinished and older than 24h)
            const isFinished = item.recognitionSeconds && item.recognitionSeconds > 0;
            const sessionAge = now - (item.startedAt || now);

            if (!isFinished && sessionAge > TWENTY_FOUR_HOURS) {
              localStorage.removeItem(`session_${id}`);
              continue;
            }

            sessions.push(item);
            validIds.push(id);
          }
        } catch (e) {
          // Skip corrupted entries safely
        }
      }
    }

    // Keep the index clean of any pruned stale sessions
    if (validIds.length !== ids.length) {
      localStorage.setItem("thinkflow_sessions_index", JSON.stringify(validIds));
    }
  } catch (e) {
    // Fallback safely if index is malformed
  }

  // Sort sessions by start time or order
  return sessions.sort((a, b) => (a.startedAt || 0) - (b.startedAt || 0));
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

// --- SESSION STORAGE MANAGEMENT ---

export function saveSession(session: PracticeSession) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`session_${session.id}`, JSON.stringify(session));
  
  // Bug #5 Fix: Maintain a namespaced session index registry instead of global localStorage scanning
  try {
    const indexRaw = localStorage.getItem("thinkflow_sessions_index");
    const ids: string[] = indexRaw ? JSON.parse(indexRaw) : [];
    if (!ids.includes(session.id)) {
      ids.push(session.id);
      localStorage.setItem("thinkflow_sessions_index", JSON.stringify(ids));
    }
  } catch (e) {
    // Fallback safely
  }

  // Dispatch a storage event so other components/tabs can listen for live updates
  window.dispatchEvent(new Event("storage"));
}

// Add this check inside your loadSession utility implementation
export function loadSession(sessionId: string): PracticeSession | null {
  if (typeof window === "undefined") return null;
  
  try {
    const raw = localStorage.getItem(`session_${sessionId}`);
    if (!raw) return null;
    
    const data = JSON.parse(raw);
    
    // Verify that the problem referenced by the session actually exists in our current problem set.
    const problemExists = problems.some((p) => p.id === data.problemId);
    if (!problemExists) {
      localStorage.removeItem(`session_${sessionId}`);
      return null;
    }

    // Merge with safe defaults to prevent runtime errors if fields are missing from older storage records
    const session: PracticeSession = {
      id: data.id || sessionId,
      problemId: data.problemId || "",
      phase: data.phase || "recognition",
      attempt: typeof data.attempt === "number" ? data.attempt : 0,
      startedAt: typeof data.startedAt === "number" ? data.startedAt : Date.now(),
      claimedPattern: data.claimedPattern || undefined,
      verdict: data.verdict || undefined,
      hintLevel: typeof data.hintLevel === "number" ? data.hintLevel : 0, // Bug #6 Fix: Aligned fallback to 0 to match createSession()[cite: 1]
      duration: typeof data.duration === "number" ? data.duration : undefined,
      recognitionSeconds: typeof data.recognitionSeconds === "number" ? data.recognitionSeconds : undefined,
      stuck: typeof data.stuck === "boolean" ? data.stuck : false,
    };

    return session;
  } catch (e) {
    console.error("Failed to load session from storage", e);
    return null;
  }
}

export function createSession(problem: Problem): PracticeSession {
  const session: PracticeSession = {
    id: `${problem.id}-${Date.now()}`,
    problemId: problem.id, // <-- CHANGED
    phase: "recognition",
    startedAt: Date.now(),
    attempt: 0,
    hintLevel: 0,
  };
  saveSession(session);
  return session;
}