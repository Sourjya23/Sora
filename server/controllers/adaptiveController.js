const OllamaService = require("../utils/ollamaService");
const UserProgress = require("../models/UserProgress");
const Problem = require("../models/Problem");
const Submission = require("../models/Submission");
const { searchProblems, getProblemById: getBankProblem, getAllTopics } = require("../utils/problemSearch");

// Helper to get or create user progress
async function getUserProgress(userId) {
  let progress = await UserProgress.findOne({ userId });
  if (!progress) {
    progress = await UserProgress.create({ userId, topicMastery: {} });
  }
  return progress;
}

// Calculate ELO change based on result
// simplified algorithm: +15 for full pass, -10 for fail, scaled by difficulty diff
function calculateEloChange(userElo, problemElo, passed, total, optimalTimeComplexity) {
  const kFactor = 32;
  const expectedScore = 1 / (1 + Math.pow(10, (problemElo - userElo) / 400));
  
  // actual score is based on test cases passed (prevent division by zero)
  let actualScore = total > 0 ? passed / total : 0;
  
  // penalize if not optimal time complexity (for simplicity, if false, reduce actual score)
  if (actualScore === 1 && !optimalTimeComplexity) {
    actualScore = 0.8; 
  }

  const change = Math.round(kFactor * (actualScore - expectedScore));
  return change;
}

/**
 * GENERATE PROBLEM — Now uses instant retrieval from curated problem bank.
 * No more AI generation, no more JDoodle verification, no more hallucinations.
 * Response time: < 100ms (down from 30-60 seconds).
 */
exports.generateProblem = async (req, res) => {
  try {
    const { query, previousProblemId, exactMatch } = req.body;
    const userId = req.user.id;

    if (!query) return res.status(400).json({ message: "Query is required" });

    console.log(`[Problem Retrieval] Query: "${query}", ExactMatch: ${!!exactMatch}`);

    // 1. Search the curated problem bank (fetch more if we might need to extract options)
    const searchResult = searchProblems(query, exactMatch ? 5 : 20);

    if (searchResult.matchedProblems.length === 0) {
      return res.status(404).json({ 
        message: "No matching problems found in the bank. Try different keywords like 'easy array', 'medium sliding window', or 'hard binary search'." 
      });
    }

    // NEW: Interactive Disambiguation
    if (!exactMatch && searchResult.matchedProblems.length > 1) {
      const uniquePatterns = [...new Set(searchResult.matchedProblems.map(p => p.pattern))].filter(Boolean);
      
      // If the query yields multiple distinct topic patterns, let the user choose one
      if (uniquePatterns.length > 1) {
        return res.status(200).json({
          requiresClarification: true,
          options: uniquePatterns.slice(0, 6)
        });
      }
    }

    // 2. Pick the best match (or a random one from top matches to add variety)
    let selectedProblem;
    
    // If user has a previous problem, try to avoid repeating it
    if (previousProblemId) {
      const prevProblem = await Problem.findById(previousProblemId);
      if (prevProblem) {
        // Filter out the previous problem from results
        const filtered = searchResult.matchedProblems.filter(
          (p) => p.title !== prevProblem.title
        );
        selectedProblem = filtered.length > 0 ? filtered[0] : searchResult.matchedProblems[0];
      } else {
        selectedProblem = searchResult.matchedProblems[0];
      }
    } else {
      // Pick from top 3 randomly for variety
      const topN = searchResult.matchedProblems.slice(0, Math.min(3, searchResult.matchedProblems.length));
      selectedProblem = topN[Math.floor(Math.random() * topN.length)];
    }

    console.log(`[Problem Retrieval] Selected: "${selectedProblem.title}" (Score: ${selectedProblem.relevanceScore})`);

    // 3. Check if this problem already exists in DB for this user
    let existingProblem = await Problem.findOne({ 
      title: selectedProblem.title, 
      createdBy: userId 
    });

    if (!existingProblem) {
      // Save to database for history tracking
      existingProblem = await Problem.create({
        title: selectedProblem.title,
        topic: selectedProblem.pattern || "General",
        difficultyScore: selectedProblem.difficultyScore || (selectedProblem.difficulty === 'Easy' ? 1000 : selectedProblem.difficulty === 'Medium' ? 1500 : 2000),
        statement: selectedProblem.problemStatement,
        starterCode: selectedProblem.starterCode,
        testCases: selectedProblem.testCases || (selectedProblem.examples ? selectedProblem.examples.map(ex => ({
          input: typeof ex.input === 'object' ? JSON.stringify(ex.input) : String(ex.input),
          expectedOutput: typeof ex.output === 'object' ? JSON.stringify(ex.output) : String(ex.output),
          isHidden: false
        })) : [{input: "N/A", expectedOutput: "N/A", isHidden: false}]),
        generatedByAI: false,
        createdBy: userId,
      });
    }

    // 4. Find similar problems
    const similarSearch = searchProblems(selectedProblem.pattern + " " + (selectedProblem.tags || []).join(" "), 6);
    const similarProblems = similarSearch.matchedProblems
      .filter(p => p.title !== selectedProblem.title)
      .slice(0, 3)
      .map(p => ({ 
        title: p.title, 
        difficultyScore: p.difficultyScore || (p.difficulty === 'Easy' ? 1000 : p.difficulty === 'Medium' ? 1500 : 2000), 
        topic: p.pattern 
      }));

    // 5. Return the problem with search metadata
    res.status(200).json({
      problem: existingProblem,
      similarProblems: similarProblems,
      searchMeta: {
        query: searchResult.query,
        totalMatches: searchResult.matchedProblems.length,
        totalInBank: searchResult.totalInBank,
        relevanceScore: selectedProblem.relevanceScore,
        otherMatches: searchResult.matchedProblems.filter(p => p.id !== selectedProblem.id).slice(0, 4).map(p => ({
          id: p.id,
          title: p.title,
          difficulty: p.difficulty,
          pattern: p.pattern
        }))
      }
    });
  } catch (error) {
    console.error("Generate problem error:", error);
    res.status(500).json({ message: "Failed to retrieve problem", error: error.message });
  }
};

exports.evaluateSubmission = async (req, res) => {
  try {
    const { problemId, code, language, executionResult } = req.body;
    const userId = req.user.id;

    if (!problemId || !code || !executionResult) {
      return res.status(400).json({ message: "Missing required fields for evaluation" });
    }

    const problem = await Problem.findById(problemId);
    if (!problem) return res.status(404).json({ message: "Problem not found" });

    // 1. Ask deepseek-coder to analyze the code for time/space complexity and weaknesses
    const prompt = `You are a senior software engineer reviewing code. 
Analyze the following ${language} code submitted for the problem "${problem.title}".

Problem Statement:
${problem.statement}

Candidate's Code:
${code}

Test cases passed: ${executionResult.passed} / ${executionResult.total}

CRITICAL INSTRUCTIONS:
- Respond with ONLY valid JSON.
- Provide the Time and Space complexity in Big-O notation.
- Evaluate if the time complexity is optimal for this specific problem (true/false).
- List specific weaknesses (e.g. "memory leaks", "brute force", "no edge case handling").
- Provide a brief suggestion for improvement.

JSON Format:
{
  "timeComplexity": "O(N^2)",
  "spaceComplexity": "O(1)",
  "isOptimalTimeComplexity": false,
  "weaknessesIdentified": ["Uses brute force", "Missing array bounds check"],
  "suggestions": "Try using a hash map to reduce time complexity to O(N)."
}`;

    const rawText = await OllamaService.generate("deepseek-coder", prompt, true);
    
    let aiFeedback;
    try {
      // Extract only the JSON object
      const jsonStart = rawText.indexOf('{');
      const jsonEnd = rawText.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonText = rawText.substring(jsonStart, jsonEnd + 1);
        aiFeedback = JSON.parse(jsonText);
      } else {
        throw new Error("No JSON found");
      }
    } catch (e) {
      aiFeedback = {
        timeComplexity: "Unknown",
        spaceComplexity: "Unknown",
        isOptimalTimeComplexity: false,
        weaknessesIdentified: ["AI evaluation failed"],
        suggestions: "We could not automatically analyze this code."
      };
    }

    // 2. Update User's ELO for this topic
    const progress = await getUserProgress(userId);
    const masteryObj = progress.topicMastery.get(problem.topic) || { level: 1500, problemsSolved: 0 };
    
    const eloChange = calculateEloChange(
      masteryObj.level, 
      problem.difficultyScore, 
      executionResult.passed, 
      executionResult.total, 
      aiFeedback.isOptimalTimeComplexity
    );

    masteryObj.level += eloChange;
    if (executionResult.passed === executionResult.total) {
      masteryObj.problemsSolved += 1;
    }
    masteryObj.lastAttempt = new Date();
    
    progress.topicMastery.set(problem.topic, masteryObj);
    await progress.save();

    // 3. Save Submission Record
    const submission = await Submission.create({
      userId,
      problemId,
      code,
      language,
      executionResult,
      aiFeedback,
      eloChange
    });

    res.status(200).json({ 
      submission,
      newElo: masteryObj.level,
      eloChange
    });

  } catch (error) {
    console.error("Evaluate submission error:", error);
    res.status(500).json({ message: "Failed to evaluate submission", error: error.message });
  }
};

exports.getRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const progress = await getUserProgress(userId);

    // Find topics with lowest ELO to recommend practice
    const masteryEntries = Array.from(progress.topicMastery.entries());
    
    // Sort by level ascending (weakest first)
    masteryEntries.sort((a, b) => a[1].level - b[1].level);
    
    const weakTopics = masteryEntries.slice(0, 3).map(entry => ({
      topic: entry[0],
      level: entry[1].level
    }));

    // If no history, suggest basics
    if (weakTopics.length === 0) {
      return res.status(200).json({
        recommendations: ["Arrays", "Strings", "Hash Maps"]
      });
    }

    res.status(200).json({ recommendations: weakTopics.map(w => w.topic) });
  } catch (error) {
    res.status(500).json({ message: "Failed to get recommendations", error: error.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    // Fetch problems generated by this user
    const history = await Problem.find({ createdBy: userId })
      .sort({ createdAt: -1 })
      .select("title topic difficultyScore createdAt")
      .limit(20);
    
    res.status(200).json({ history });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch history", error: error.message });
  }
};

exports.clearHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    await Problem.deleteMany({ createdBy: userId });
    res.status(200).json({ message: "History cleared successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to clear history", error: error.message });
  }
};

exports.getProblem = async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) return res.status(404).json({ message: "Problem not found" });
    
    // Find similar problems
    const similarSearch = searchProblems(problem.topic || "", 5);
    const similarProblems = similarSearch.matchedProblems
      .filter(p => p.title !== problem.title)
      .slice(0, 3)
      .map(p => ({ 
        title: p.title, 
        difficultyScore: p.difficultyScore || (p.difficulty === 'Easy' ? 1000 : p.difficulty === 'Medium' ? 1500 : 2000), 
        topic: p.pattern 
      }));

    res.status(200).json({ problem, similarProblems });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch problem", error: error.message });
  }
};

/**
 * NEW: Browse all available topics/patterns in the bank.
 */
exports.getBankTopics = async (req, res) => {
  try {
    const topics = getAllTopics();
    res.status(200).json(topics);
  } catch (error) {
    res.status(500).json({ message: "Failed to get topics", error: error.message });
  }
};
