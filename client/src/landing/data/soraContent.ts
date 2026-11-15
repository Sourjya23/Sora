export type NavSectionKey = 'features' | 'learn' | 'upcoming' | 'stories';

export interface NavItem {
  key: NavSectionKey;
  label: string;
}

export const SORA_SITE_METADATA = {
  brandName: 'Sora',
  siteUrl: 'https://sorabuild.netlify.app/',
  faviconUrl: 'https://sorabuild.netlify.app/Sora_Favicon.jpg',
  title: 'Sora: Practice Live Technical Interviews with Big Tech Software Engineers',
  description:
    'Practice real-time technical interviews with verified engineers from Google, Amazon, and Meta. Improve your DSA skills with our story-driven coding problems.',
  heroVideoUrl:
    'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4',
};

export const NAV_ITEMS: NavItem[] = [
  { key: 'features', label: 'Features' },
  { key: 'learn', label: 'Learn' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'stories', label: 'Stories' },
];

export const HERO_METRICS = [
  { value: '8,411+', label: 'Engineers Joined' },
  { value: '200+', label: 'Story Problems' },
  { value: '30+', label: 'Companies Covered' },
  { value: '94%', label: 'Offer Readiness' },
];

export const PARTNER_COMPANIES = [
  'Google',
  'Amazon',
  'Meta',
  'Microsoft',
  'Apple',
  'Netflix',
  'Stripe',
  'Uber',
  'Airbnb',
  'Coinbase',
  'Atlassian',
  'Spotify',
];

export interface FeatureCard {
  index: string;
  title: string;
  description: string;
  meta: string;
}

export const PLATFORM_FEATURES: FeatureCard[] = [
  {
    index: '01',
    title: 'Real-time interviews with Big Tech engineers',
    description:
      'Book 60-minute sessions with verified engineers from Google, Amazon, Meta, and Microsoft. They run the loop while you think aloud and code live.',
    meta: '60-min live loops · Verified mentors',
  },
  {
    index: '02',
    title: 'Regular scheduled sessions',
    description:
      'Stay consistent with weekly group mock interviews, themed rounds covering System Design, Behavioral, and Dynamic Programming, plus 1-on-1 bookings.',
    meta: 'Weekly cohorts · 1-on-1 scheduling',
  },
  {
    index: '03',
    title: 'Story-driven, topic-wise problem sets',
    description:
      'Every problem lives inside a living narrative world. Share your weak areas and traverse a custom story arc that builds intuition instead of rote memorization.',
    meta: 'Narrative arcs · Pattern mastery',
  },
  {
    index: '04',
    title: 'Code inside the interview, live',
    description:
      'A shared editor opens inside your session call. Your interviewer annotates, suggests edge cases, and reviews complexity in real time without tab switching.',
    meta: 'Shared editor · 5 languages',
  },
];

export interface CodeSnippetLanguage {
  id: 'python' | 'javascript' | 'java' | 'cpp' | 'go';
  label: string;
  annotation: string;
  code: string;
}

export const LIVE_EDITOR_SNIPPETS: CodeSnippetLanguage[] = [
  {
    id: 'python',
    label: 'Python',
    annotation: 'Interviewer note: Track window frequencies in O(1) amortized time.',
    code: `def min_window_subarray(nums: list[int], target: int) -> int:
    left, total, best = 0, 0, float("inf")
    for right, val in enumerate(nums):
        total += val
        while total >= target:  # Shrink window cleanly
            best = min(best, right - left + 1)
            total -= nums[left]
            left += 1
    return 0 if best == float("inf") else best`,
  },
  {
    id: 'javascript',
    label: 'JavaScript',
    annotation: 'Interviewer note: Clean invariant before shrinking the left pointer.',
    code: `function minWindowSubarray(nums, target) {
  let left = 0, total = 0, best = Infinity;
  for (let right = 0; right < nums.length; right++) {
    total += nums[right];
    while (total >= target) {
      best = Math.min(best, right - left + 1);
      total -= nums[left++];
    }
  }
  return best === Infinity ? 0 : best;
}`,
  },
  {
    id: 'java',
    label: 'Java',
    annotation: 'Interviewer note: Good handling of empty arrays and integer bounds.',
    code: `public int minWindowSubarray(int[] nums, int target) {
    int left = 0, total = 0, best = Integer.MAX_VALUE;
    for (int right = 0; right < nums.length; right++) {
        total += nums[right];
        while (total >= target) {
            best = Math.min(best, right - left + 1);
            total -= nums[left++];
        }
    }
    return best == Integer.MAX_VALUE ? 0 : best;
}`,
  },
  {
    id: 'cpp',
    label: 'C++',
    annotation: 'Interviewer note: Optimal O(n) single-pass space complexity.',
    code: `int minWindowSubarray(vector<int>& nums, int target) {
    int left = 0, total = 0, best = INT_MAX;
    for (int right = 0; right < (int)nums.size(); ++right) {
        total += nums[right];
        while (total >= target) {
            best = min(best, right - left + 1);
            total -= nums[left++];
        }
    }
    return best == INT_MAX ? 0 : best;
}`,
  },
  {
    id: 'go',
    label: 'Go',
    annotation: 'Interviewer note: Readable pointer movement and explicit edge guard.',
    code: `func minWindowSubarray(nums []int, target int) int {
    left, total, best := 0, 0, len(nums)+1
    for right, val := range nums {
        total += val
        for total >= target {
            if right-left+1 < best {
                best = right - left + 1
            }
            total -= nums[left]
            left++
        }
    }
    if best > len(nums) { return 0 }
    return best
}`,
  },
];

export const FRICTION_REMOVED = [
  {
    index: '01',
    title: 'Fake AI interviewers',
    detail:
      'Scripted bots cannot simulate genuine technical pressure, judgment, or unscripted follow-up probes. Every Sora session is human-led.',
  },
  {
    index: '02',
    title: 'Context-free grinding',
    detail:
      'Solving 500 disconnected problems leaves no mental model behind. Sora replaces blind volume with curated story journeys.',
  },
  {
    index: '03',
    title: 'Switching tabs to code',
    detail:
      'Juggling video calls, separate problem tabs, and scratchpads breaks focus. Your shared editor lives right inside the interview.',
  },
  {
    index: '04',
    title: 'Vague feedback loops',
    detail:
      'Hearing "good job" after a mock teaches nothing. Verified engineers deliver structured, FAANG-calibrated feedback every session.',
  },
];

export interface SimulatorProbeStep {
  id: 'approach' | 'edge-cases' | 'complexity';
  step: string;
  label: string;
  interviewerPrompt: string;
  candidateReply: string;
  rubricNotes: {
    label: string;
    score: string;
  }[];
  checkResult: string;
}

export const SIMULATOR_PROBES: SimulatorProbeStep[] = [
  {
    id: 'approach',
    step: '01',
    label: 'Approach & Invariant',
    interviewerPrompt:
      'Before coding, walk me through how you keep the sliding window invariant valid as the right pointer expands.',
    candidateReply:
      'Since all values are positive, expanding right monotonically increases the sum. Once total >= target, shrinking left finds the tightest valid window ending at right.',
    rubricNotes: [
      { label: 'Problem Decomposition', score: 'Strong · Clear invariant' },
      { label: 'Communication', score: 'Structured thinking aloud' },
    ],
    checkResult: 'Invariant verified · Monotonic two-pointer window confirmed',
  },
  {
    id: 'edge-cases',
    step: '02',
    label: 'Edge-Case Probe',
    interviewerPrompt:
      'What happens if no subarray reaches the target sum, or if a single element already equals target?',
    candidateReply:
      'When a single element meets target, the inner loop runs once and records length 1. If best never updates from infinity, I guard the return value to output 0.',
    rubricNotes: [
      { label: 'Edge-Case Rigor', score: 'Caught empty & unreachable cases' },
      { label: 'Code Fluency', score: 'Clean sentinel guard' },
    ],
    checkResult: '12 / 12 edge cases passed · Unreachable & single-item bounds safe',
  },
  {
    id: 'complexity',
    step: '03',
    label: 'Complexity Review',
    interviewerPrompt:
      'There is a nested while loop inside the for loop — justify why the runtime is not quadratic.',
    candidateReply:
      'Each pointer advances at most n times across the entire pass, so every element is added and subtracted at most once — amortized O(n) time and O(1) space.',
    rubricNotes: [
      { label: 'Time Complexity', score: 'O(n) amortized · Optimal' },
      { label: 'Space Complexity', score: 'O(1) auxiliary · Optimal' },
    ],
    checkResult: 'Benchmark: 0.42ms on n = 100,000 · O(n) time · O(1) space',
  },
];

export interface StoryArc {
  id: string;
  index: string;
  title: string;
  chapter: string;
  topic: string;
  difficulty: string;
  summary: string;
  objective: string;
  sampleInput: string;
  sampleOutput: string;
  complexity: string;
}

export const STORY_ARCS: StoryArc[] = [
  {
    id: 'kingdom-search',
    index: '01',
    title: 'The Kingdom Search',
    chapter: 'Chapter 1: The Oracle’s Trial',
    topic: 'Binary Search',
    difficulty: 'Easy',
    summary:
      'Navigate sorted watchtower signals across the northern frontier using monotonic predicate invariants.',
    objective:
      'Determine the minimum beacon range required so every outpost receives an alert in logarithmic time.',
    sampleInput: 'towers = [1, 4, 9, 15], relays = 2',
    sampleOutput: 'min_radius = 3',
    complexity: 'O(n log M) time · O(1) auxiliary space',
  },
  {
    id: 'enchanted-maze',
    index: '02',
    title: 'The Enchanted Maze',
    chapter: 'Chapter 3: Shadows & Paths',
    topic: 'Graph BFS',
    difficulty: 'Medium',
    summary:
      'Escape shifting stone corridors before midnight by propagating multi-source breadth-first frontier waves.',
    objective:
      'Compute the shortest safe traversal route when corridor gates alternate state on every step.',
    sampleInput: 'grid = 5x5, portals = 2, start = (0,0)',
    sampleOutput: 'shortest_steps = 7',
    complexity: 'O(V + E) time · State-augmented queue',
  },
  {
    id: 'dragons-coin',
    index: '03',
    title: 'Dragon’s Coin Dilemma',
    chapter: 'Chapter 7: The Memoized Vault',
    topic: 'Dynamic Programming',
    difficulty: 'Hard',
    summary:
      'Balance tribute weights inside the Obsidian Treasury without triggering overlapping subproblem traps.',
    objective:
      'Derive the bottom-up state transition to maximize vault yield under strict capacity and cooldown rules.',
    sampleInput: 'vaults = [6, 2, 9, 4], capacity = 11',
    sampleOutput: 'max_yield = 15',
    complexity: 'O(n · W) time · Rolling 1D state compression',
  },
];

export interface RoadmapRelease {
  id: string;
  quarter: string;
  title: string;
  summary: string;
  detail: string;
}

export const UPCOMING_ROADMAP: RoadmapRelease[] = [
  {
    id: 'heatmaps',
    quarter: 'Q3 2025',
    title: 'Heatmaps for solvers',
    summary: 'Activity streaks & topic coverage',
    detail:
      'Visualize your daily practice streak, algorithmic topic depth, and weak zones across a unified contribution heatmap.',
  },
  {
    id: 'oa-board',
    quarter: 'Q3 2025',
    title: 'Community OA Board',
    summary: 'Moderated assessment patterns',
    detail:
      'Share and browse real online assessment problem statements, pattern tags, and verified optimal breakdowns.',
  },
  {
    id: 'peer-rooms',
    quarter: 'Q4 2025',
    title: 'Peer pairing rooms',
    summary: 'Reciprocal mock sessions',
    detail:
      'Pair with another engineer for live two-way practice featuring a built-in timer, shared editor, and calibration rubric.',
  },
];

export interface TestimonialStory {
  initials: string;
  name: string;
  company: 'Google' | 'Amazon' | 'Meta';
  role: string;
  quote: string;
  outcome: string;
}

export const SUCCESS_STORIES: TestimonialStory[] = [
  {
    initials: 'AK',
    name: 'Aarav Krishnan',
    company: 'Google',
    role: 'SDE @ Google — Bangalore',
    quote:
      'My Sora interviewer was a current Google L5. She grilled me exactly like a real loop — I walked into my actual interview already knowing what to expect.',
    outcome: 'Cleared Google L4 loop',
  },
  {
    initials: 'PM',
    name: 'Pooja Mehra',
    company: 'Amazon',
    role: 'SDE-2 @ Amazon — Hyderabad',
    quote:
      'The story-based DP track finally broke through. I had failed DP interviews 3 times before. The Dragon’s Vault arc made it genuinely intuitive.',
    outcome: 'Promoted to SDE-2 loop offer',
  },
  {
    initials: 'RS',
    name: 'Rohan Sehgal',
    company: 'Meta',
    role: 'Engineer @ Meta — Remote',
    quote:
      'Coding inside the same window as my interviewer felt like the real thing. No tab switching, no context loss. That alone changed my interview performance.',
    outcome: 'Matched E5 product engineering',
  },
];

export const TARGET_COMPANIES = ['Google', 'Amazon', 'Meta', 'Microsoft', 'Apple', 'Stripe'];
export const INTERVIEW_TRACKS = [
  'Live DSA Mock Loop',
  'System Design Session',
  'Story-Driven Problem Arc',
];

export const FOOTER_MEDIA = {
  clip1080:
    'https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/abdab52e-bb1b-477d-ae7c-26c5f8915433.mp4',
  clip720:
    'https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/15017aa7-135b-471f-a8a1-42a208bc61b2.mp4',
  poster:
    'https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/af6deff1-d678-4dc6-ae24-2880b16cdb20.jpg',
};

export interface InfoTopicContent {
  title: string;
  eyebrow: string;
  body: string[];
}

export const INFO_MODAL_TOPICS: Record<string, InfoTopicContent> = {
  Methodology: {
    eyebrow: 'Sora Pedagogy',
    title: 'How Sora Prepares You for Real Loops',
    body: [
      'Every mock interview on Sora mirrors the exact pacing, ambiguity, and follow-up depth of senior engineers at Google, Amazon, Meta, and Microsoft.',
      'Instead of practicing in isolation with static hints, you articulate invariants aloud inside our shared live editor and receive calibrated scoring across problem decomposition, code fluency, and edge-case rigor.',
    ],
  },
  Careers: {
    eyebrow: 'Mentors & Team',
    title: 'Interview With Us or Become a Verified Mentor',
    body: [
      'We partner with staff and senior engineers across top-tier engineering organizations who care deeply about thoughtful technical mentorship.',
      'If you have conducted 25+ hiring loops and want to help engineers build lasting problem-solving confidence, request early access and mention mentor onboarding.',
    ],
  },
  'Privacy Policy': {
    eyebrow: 'Legal & Trust',
    title: 'Privacy Policy',
    body: [
      'Sora collects only the contact details and session preferences you explicitly submit when requesting early access or scheduling a live interview.',
      'Your live coding sessions and interviewer feedback notes remain private to your workspace and are never shared with third-party employers or recruiters.',
    ],
  },
  'Terms of Service': {
    eyebrow: 'Legal & Trust',
    title: 'Terms of Service',
    body: [
      'Sora provides educational mock technical interviews and narrative algorithm curriculum for personal skill development.',
      'Both candidates and verified mentors commit to respectful collaboration, confidentiality of shared feedback, and authentic live coding practice.',
    ],
  },
};
