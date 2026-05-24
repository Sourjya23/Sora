/**
 * Problem Search Engine — Fast local retrieval from the curated problem bank.
 * No AI calls needed for most queries. Uses tag/pattern/difficulty matching.
 */

const problemBankOriginal = require("../data/problemBank.json");
const stringProblemBank = require("../data/stringProblemBank.json");

const problemBank = [...problemBankOriginal, ...stringProblemBank];

// Precompute search index for blazing-fast lookups
const searchIndex = {
  byTag: {},
  byPattern: {},
  byDifficulty: {},
  byId: {},
};

// Build the inverted index on module load
problemBank.forEach((problem) => {
  // Index by ID
  searchIndex.byId[problem.id] = problem;

  // Index by difficulty
  const diff = problem.difficulty.toLowerCase();
  if (!searchIndex.byDifficulty[diff]) searchIndex.byDifficulty[diff] = [];
  searchIndex.byDifficulty[diff].push(problem);

  // Index by pattern
  const pattern = problem.pattern.toLowerCase();
  if (!searchIndex.byPattern[pattern]) searchIndex.byPattern[pattern] = [];
  searchIndex.byPattern[pattern].push(problem);

  // Index by tags
  problem.tags.forEach((tag) => {
    const t = tag.toLowerCase();
    if (!searchIndex.byTag[t]) searchIndex.byTag[t] = [];
    searchIndex.byTag[t].push(problem);
  });
});

// All known patterns for fuzzy matching
const KNOWN_PATTERNS = [...new Set(problemBank.map((p) => p.pattern.toLowerCase()))];
const KNOWN_TAGS = [...new Set(problemBank.flatMap((p) => p.tags.map((t) => t.toLowerCase())))];

/**
 * Parse a natural-language query into structured filters.
 * e.g., "easy array two pointers" => { difficulty: "easy", tags: ["array"], patterns: ["two pointers"] }
 */
function parseQuery(query) {
  const q = query.toLowerCase().trim();
  const filters = { difficulty: null, tags: [], patterns: [], keywords: [] };

  // Extract difficulty
  if (/\beasy\b/.test(q)) filters.difficulty = "easy";
  else if (/\bmedium\b/.test(q)) filters.difficulty = "medium";
  else if (/\bhard\b/.test(q)) filters.difficulty = "hard";
  else if (/\bbeginner\b/.test(q)) filters.difficulty = "easy";
  else if (/\bintermediate\b/.test(q)) filters.difficulty = "medium";
  else if (/\badvanced\b/.test(q)) filters.difficulty = "hard";

  // Extract known patterns (multi-word patterns first)
  const sortedPatterns = KNOWN_PATTERNS.sort((a, b) => b.length - a.length);
  for (const pattern of sortedPatterns) {
    if (q.includes(pattern)) {
      filters.patterns.push(pattern);
    }
  }

  // Extract known tags
  for (const tag of KNOWN_TAGS) {
    if (q.includes(tag)) {
      filters.tags.push(tag);
    }
  }

  // Extract remaining keywords for fuzzy matching
  const words = q.split(/\s+/).filter((w) => w.length > 2);
  words.forEach((word) => {
    // Skip already-matched words
    if (["easy", "medium", "hard", "beginner", "intermediate", "advanced", "problem", "problems", "question", "questions", "based", "give", "me", "practice", "want", "some"].includes(word)) return;
    if (!filters.tags.includes(word) && !filters.patterns.some((p) => p.includes(word))) {
      filters.keywords.push(word);
    }
  });

  return filters;
}

/**
 * Score a problem against parsed filters. Higher = better match.
 */
function scoreProblem(problem, filters) {
  let score = 0;

  // Exact difficulty match: +30
  if (filters.difficulty && problem.difficulty.toLowerCase() === filters.difficulty) {
    score += 30;
  }

  // Tag matches: +20 each
  const problemTags = problem.tags.map((t) => t.toLowerCase());
  filters.tags.forEach((tag) => {
    if (problemTags.includes(tag)) score += 20;
  });

  // Pattern match: +25
  const problemPattern = problem.pattern.toLowerCase();
  filters.patterns.forEach((pattern) => {
    if (problemPattern === pattern) score += 25;
    else if (problemPattern.includes(pattern) || pattern.includes(problemPattern)) score += 15;
  });

  // Keyword fuzzy match against title + statement: +10 each
  const searchableText = `${problem.title} ${problem.problemStatement} ${problem.pattern} ${problem.tags.join(" ")}`.toLowerCase();
  filters.keywords.forEach((kw) => {
    if (searchableText.includes(kw)) score += 10;
  });

  // Bonus for recommended problems: +5
  if (problem.recommended) score += 5;

  return score;
}

/**
 * Search the problem bank. Returns up to `limit` best matches.
 */
function searchProblems(query, limit = 5) {
  const filters = parseQuery(query);

  // Score every problem
  const scored = problemBank.map((problem) => ({
    problem,
    score: scoreProblem(problem, filters),
  }));

  // Filter out zero-score problems only if we have some matches
  const withScore = scored.filter((s) => s.score > 0);

  let results;
  if (withScore.length > 0) {
    // Sort by score descending, then by difficulty score ascending (easier first for ties)
    results = withScore
      .sort((a, b) => b.score - a.score || a.problem.difficultyScore - b.problem.difficultyScore)
      .slice(0, limit);
  } else {
    // Fallback: return recommended problems
    results = scored
      .filter((s) => s.problem.recommended)
      .sort(() => Math.random() - 0.5)
      .slice(0, limit)
      .map((s) => ({ ...s, score: 1 }));
  }

  return {
    query,
    filters,
    matchedProblems: results.map((r) => ({
      ...r.problem,
      relevanceScore: r.score,
    })),
    totalInBank: problemBank.length,
  };
}

/**
 * Get a single problem by its bank ID.
 */
function getProblemById(id) {
  return searchIndex.byId[id] || null;
}

/**
 * Get all unique topics/patterns in the bank (for UI dropdowns).
 */
function getAllTopics() {
  const patterns = [...new Set(problemBank.map((p) => p.pattern))];
  const difficulties = ["Easy", "Medium", "Hard"];
  return { patterns, difficulties, totalProblems: problemBank.length };
}

module.exports = { searchProblems, getProblemById, getAllTopics, problemBank };
