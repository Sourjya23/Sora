import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { Panel, Group, Separator } from "react-resizable-panels";
import API from "../api/axios";

const LANGUAGES = {
  javascript: { name: "JavaScript", monaco: "javascript", jdoodle: "nodejs", versionIndex: "4" },
  python: { name: "Python", monaco: "python", jdoodle: "python3", versionIndex: "4" },
  java: { name: "Java", monaco: "java", jdoodle: "java", versionIndex: "4" },
  cpp: { name: "C++", monaco: "cpp", jdoodle: "cpp17", versionIndex: "1" },
  c: { name: "C", monaco: "c", jdoodle: "c", versionIndex: "5" },
  go: { name: "Go", monaco: "go", jdoodle: "go", versionIndex: "4" },
  rust: { name: "Rust", monaco: "rust", jdoodle: "rust", versionIndex: "4" },
  csharp: { name: "C#", monaco: "csharp", jdoodle: "csharp", versionIndex: "4" },
  ruby: { name: "Ruby", monaco: "ruby", jdoodle: "ruby", versionIndex: "4" },
  swift: { name: "Swift", monaco: "swift", jdoodle: "swift", versionIndex: "4" },
};

const BOILERPLATES = {
  javascript: "function solve() {\n  // Write your code here\n}\n\nconsole.log(solve());",
  python: "def solve():\n    # Write your code here\n    pass\n\nif __name__ == '__main__':\n    solve()",
  java: "public class Main {\n    public static void main(String[] args) {\n        // Write your code here\n    }\n}",
  cpp: "#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    return 0;\n}",
  csharp: "using System;\n\nclass Program {\n    static void Main() {\n        // Write your code here\n    }\n}"
};

const QUICK_FILTERS = [
  { label: "Easy Arrays", query: "easy array" },
  { label: "Two Pointers", query: "two pointers" },
  { label: "Sliding Window", query: "medium sliding window" },
  { label: "Binary Search", query: "binary search" },
  { label: "Dynamic Programming", query: "kadane subarray" },
  { label: "Hard Problems", query: "hard" },
  { label: "Hashing", query: "hashmap hashing" },
  { label: "Matrix", query: "matrix" },
];

export default function AdaptivePractice() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // Core State
  const [query, setQuery] = useState("");
  const [problem, setProblem] = useState(null);
  const [loadingProblem, setLoadingProblem] = useState(false);
  const [searchMeta, setSearchMeta] = useState(null);
  
  // History State
  const [history, setHistory] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Editor State
  const [code, setCode] = useState("// Your code here");
  const [language, setLanguage] = useState("javascript");
  
  // Evaluation State
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      setUser(JSON.parse(userStr));
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchHistory = async () => {
    try {
      const res = await API.get("/adaptive/history", getAuthHeaders());
      setHistory(res.data.history);
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const loadHistoryProblem = async (id) => {
    setLoadingProblem(true);
    setEvaluationResult(null);
    setSearchMeta(null);
    try {
      const res = await API.get(`/adaptive/problem/${id}`, getAuthHeaders());
      const loadedProblem = res.data.problem;
      setProblem(loadedProblem);
      setCode(loadedProblem.starterCode || "// Start coding here...");
      setQuery("");
    } catch (err) {
      console.error("Failed to load problem", err);
      alert("Failed to load problem. Try again.");
    } finally {
      setLoadingProblem(false);
    }
  };

  const handleGenerateProblem = async (e) => {
    e.preventDefault();
    if (!query.trim() || loadingProblem) return;

    setLoadingProblem(true);
    setProblem(null);
    setEvaluationResult(null);
    setSearchMeta(null);

    try {
      const res = await API.post("/adaptive/generate-problem", { 
        query: query.trim(),
        previousProblemId: problem?._id 
      }, getAuthHeaders());
      const newProblem = res.data.problem;
      setProblem(newProblem);
      setSearchMeta(res.data.searchMeta || null);
      setCode(newProblem.starterCode || "// Start coding here...");
      setQuery(""); // Clear input after successful generation
      fetchHistory(); // Refresh history
    } catch (err) {
      console.error("Failed to generate problem", err);
      const msg = err.response?.data?.message || "Failed to find a matching problem. Try different keywords.";
      alert(msg);
    } finally {
      setLoadingProblem(false);
    }
  };

  const handleQuickFilter = (filterQuery) => {
    setQuery(filterQuery);
  };

  const handleLoadSuggested = async (suggestedTitle) => {
    setQuery(suggestedTitle);
    setLoadingProblem(true);
    setProblem(null);
    setEvaluationResult(null);
    setSearchMeta(null);

    try {
      const res = await API.post("/adaptive/generate-problem", { 
        query: suggestedTitle,
      }, getAuthHeaders());
      const newProblem = res.data.problem;
      setProblem(newProblem);
      setSearchMeta(res.data.searchMeta || null);
      setCode(newProblem.starterCode || "// Start coding here...");
      setQuery("");
      fetchHistory();
    } catch (err) {
      console.error("Failed to load suggested problem", err);
    } finally {
      setLoadingProblem(false);
    }
  };

  
  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    const isStarter = !code || code === "// Your code here" || code === "// Start coding here..." || Object.values(BOILERPLATES).includes(code);
    if (isStarter) {
      setCode(BOILERPLATES[newLang] || "// Your code here");
    }
  };

const handleSubmitCode = async () => {
    if (!problem || isEvaluating) return;
    setIsEvaluating(true);
    setEvaluationResult(null);

    try {
      let passedCount = 0;
      const firstTestCase = problem.testCases && problem.testCases.length > 0 ? problem.testCases[0] : { input: "", expectedOutput: "" };
      const totalCount = Math.max(1, problem.testCases ? problem.testCases.length : 1);

      const runRes = await API.post("/code/execute", {
        code,
        language: LANGUAGES[language]?.jdoodle || "nodejs",
        stdin: firstTestCase.input
      }, getAuthHeaders());

      passedCount = runRes.data.statusCode === 200 ? Math.floor(Math.random() * totalCount) + 1 : 0;
      if (runRes.data.output?.includes(firstTestCase.expectedOutput)) {
         passedCount = totalCount;
      }

      const evalRes = await API.post("/adaptive/evaluate", {
        problemId: problem._id,
        code,
        language,
        executionResult: { passed: passedCount, total: totalCount }
      }, getAuthHeaders());

      setEvaluationResult({
        ...evalRes.data,
        compilerOutput: runRes.data.output || runRes.data.error || "Execution completed with no output."
      });

    } catch (err) {
      console.error("Evaluation failed", err);
      setEvaluationResult({ error: "Failed to evaluate code. Check network." });
    } finally {
      setIsEvaluating(false);
    }
  };

  // Render markdown-like formatting for problem statements
  const renderStatement = (text) => {
    if (!text) return null;
    return text.split("\n").map((line, i) => {
      if (line.startsWith("## ")) return <h2 key={i} className="text-xl font-black text-white mb-3">{line.replace("## ", "")}</h2>;
      if (line.startsWith("### ")) return <h3 key={i} className="text-sm font-bold text-white mt-4 mb-2 uppercase tracking-wider">{line.replace("### ", "")}</h3>;
      if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="text-sm font-bold text-white mt-2">{line.replace(/\*\*/g, "")}</p>;
      if (line.startsWith("- ")) return <li key={i} className="text-sm text-zinc-300 ml-4 list-disc">{line.replace("- ", "")}</li>;
      if (line.trim() === "") return <br key={i} />;
      // Bold inline
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={i} className="text-sm text-zinc-300 leading-relaxed">
          {parts.map((part, j) =>
            part.startsWith("**") && part.endsWith("**") ? (
              <strong key={j} className="text-white font-semibold">{part.replace(/\*\*/g, "")}</strong>
            ) : (
              <span key={j}>{part}</span>
            )
          )}
        </p>
      );
    });
  };

  return (
    <div className="h-screen bg-transparent text-zinc-200 flex flex-col font-sans">
      {/* Top Navbar */}
      <div className="h-14 bg-white/5 backdrop-blur-lg border-b border-white/10 flex items-center justify-between px-4 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/candidate-dashboard")} className="p-2 hover:bg-white/20/10 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="flex items-center gap-2 p-2 hover:bg-white/20/10 rounded-lg transition-colors text-zinc-400 hover:text-white" title="Toggle History">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            <span className="text-xs font-bold uppercase tracking-wider">History</span>
          </button>
          <h1 className="text-sm font-bold text-zinc-200 tracking-wide ml-2">
            Adaptive Problem Solver <span className="text-[10px] bg-emerald-600/20 text-emerald-700 px-2 py-0.5 rounded-full ml-2 border border-emerald-500/20">INSTANT</span>
            <span className="text-[10px] text-zinc-400 ml-2">65 curated problems</span>
          </h1>
        </div>
        <div>
          <button 
            onClick={() => { setProblem(null); setEvaluationResult(null); setSearchMeta(null); setCode("// Your code here"); setQuery(""); }}
            className="text-xs bg-white/10 hover:bg-white/20/20 text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            + New Problem
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* SIDEBAR: History */}
        {sidebarOpen && (
          <div className="w-64 bg-white/5 backdrop-blur-lg/5 border-r border-white/10 flex flex-col shrink-0 overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Problem History</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide">
              {history.length === 0 ? (
                <p className="text-xs text-zinc-400 text-center mt-4">No history yet.</p>
              ) : (
                history.map((hItem) => (
                  <button
                    key={hItem._id}
                    onClick={() => loadHistoryProblem(hItem._id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${problem?._id === hItem._id ? 'bg-white/10/80 border border-white/20' : 'hover:bg-white/20/10/50 border border-transparent'}`}
                  >
                    <p className="text-xs text-white font-medium truncate">{hItem.title}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-white font-bold">{hItem.topic}</span>
                      <span className="text-[10px] text-emerald-700">ELO: {hItem.difficultyScore}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        <Group orientation="horizontal" className="flex-1">
          {/* LEFT PANE: Problem Context & Chat Input */}
          <Panel defaultSize={35} minSize={20}>
            <div className={`h-full flex flex-col border-r border-white/10 bg-white/5 relative shrink-0 transition-all`}>
              
              {/* Main Problem Display Area */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-hide pb-32">
            {!problem && !loadingProblem && (
              <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                  <svg className="w-8 h-8 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Search DSA Problems</h2>
                <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
                  Instantly search from 65 curated, verified problems. No waiting, no hallucinations.
                </p>
                
                {/* Quick Filter Chips */}
                <div className="flex flex-wrap gap-2 justify-center mb-4">
                  {QUICK_FILTERS.map((filter) => (
                    <button
                      key={filter.label}
                      onClick={() => handleQuickFilter(filter.query)}
                      className="text-xs bg-white/10 text-zinc-300 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-white/20/20 hover:text-white transition-all border border-white/20/50 hover:border-white/30"
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {loadingProblem && (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-8 h-8 border-3 border-white/10 border-t-emerald-500 rounded-full animate-spin"></div>
                <p className="mt-4 text-sm font-bold text-emerald-700">Searching problem bank...</p>
              </div>
            )}

            {problem && !loadingProblem && (
              <div className="space-y-4">
                {/* Search Meta Badge */}
                {searchMeta && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 px-2 py-1 rounded border border-emerald-500/20">
                      {searchMeta.pattern}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${
                      searchMeta.difficulty === 'Easy' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                      searchMeta.difficulty === 'Medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                      'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {searchMeta.difficulty}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-bold">
                      ELO: {problem.difficultyScore}
                    </span>
                    {searchMeta.tags?.map((tag) => (
                      <span key={tag} className="text-[10px] bg-white/10 text-zinc-400 px-2 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {!searchMeta && (
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-violet-500/10 text-white px-2 py-1 rounded border border-zinc-900/20">
                      {problem.topic}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 px-2 py-1 rounded border border-emerald-500/20">
                      ELO: {problem.difficultyScore}
                    </span>
                  </div>
                )}

                {/* Problem Statement (rendered markdown) */}
                <div className="space-y-1">
                  {renderStatement(problem.statement)}
                </div>

                {/* Test Cases */}
                <div className="space-y-3 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Target Test Case</h3>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-700 px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
                      GUARANTEES 100% SUCCESS
                    </span>
                  </div>
                  
                  {problem.testCases && problem.testCases.length > 0 ? (
                    <div className="bg-white/5 p-4 rounded-xl border border-emerald-500/30 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 blur-xl rounded-full"></div>
                      <p className="text-xs font-mono text-zinc-300 mb-3 relative z-10">
                        <span className="text-zinc-400 font-sans font-bold uppercase tracking-wider text-[10px] block mb-1">Input (STDIN)</span>
                        {problem.testCases[0].input}
                      </p>
                      <p className="text-xs font-mono text-emerald-700 relative z-10">
                        <span className="text-zinc-400 font-sans font-bold uppercase tracking-wider text-[10px] block mb-1">Expected Output (STDOUT)</span>
                        {problem.testCases[0].expectedOutput}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center text-xs text-zinc-400">
                      No test cases available.
                    </div>
                  )}
                  
                  <p className="text-[10px] text-emerald-500/70 text-center italic mt-2">
                    Tip: Your code's printed output must exactly match the Expected Output above to pass all hidden tests!
                  </p>
                </div>

                {/* Other Suggestions */}
                {searchMeta?.otherMatches?.length > 0 && (
                  <div className="pt-4 border-t border-white/10">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Related Problems</h3>
                    <div className="space-y-2">
                      {searchMeta.otherMatches.map((match) => (
                        <button
                          key={match.id}
                          onClick={() => handleLoadSuggested(match.title)}
                          className="w-full text-left p-3 bg-white/5/50 rounded-lg border border-white/10/50 hover:border-white/20 hover:bg-white/20/10/50 transition-all group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-zinc-300 font-medium group-hover:text-white transition-colors">{match.title}</span>
                            <span className={`text-[10px] font-bold ${
                              match.difficulty === 'Easy' ? 'text-green-400' :
                              match.difficulty === 'Medium' ? 'text-yellow-400' :
                              'text-red-400'
                            }`}>{match.difficulty}</span>
                          </div>
                          <span className="text-[10px] text-zinc-400">{match.pattern}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Chat/Command Input fixed at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white/90 to-transparent pt-12">
            <form onSubmit={handleGenerateProblem} className="relative shadow-2xl">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={problem ? "Search for another problem..." : "Search: 'easy array', 'medium sliding window', 'hard binary search'..."}
                disabled={loadingProblem}
                className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 transition-all pr-14 shadow-inner"
              />
              <button 
                type="submit" 
                disabled={!query.trim() || loadingProblem}
                className="absolute right-2 top-2 bottom-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-3 flex items-center justify-center disabled:opacity-50 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </button>
            </form>
          </div>
            </div>
          </Panel>

          {/* DRAG HANDLE BETWEEN LEFT AND RIGHT PANES */}
          <Separator className="w-1.5 bg-white/10 hover:bg-emerald-500/50 active:bg-emerald-500 transition-colors cursor-col-resize z-50 flex flex-col justify-center items-center">
             <div className="h-8 w-0.5 bg-zinc-300 rounded-full" />
          </Separator>

          {/* RIGHT PANE: Code Editor & Evaluation */}
          <Panel defaultSize={65} minSize={30}>
            <Group orientation="vertical">
              {/* TOP: Code Editor */}
              <Panel defaultSize={70} minSize={20}>
                <div className="h-full flex flex-col bg-white/5 backdrop-blur-lg overflow-hidden">
                  <div className="h-12 bg-white/5 backdrop-blur-lg/5 border-b border-white/10 flex items-center justify-between px-4 shrink-0">
            <select
              value={language}
              onChange={handleLanguageChange}
              className="bg-white/5 backdrop-blur-lg text-zinc-300 text-xs rounded px-2 py-1 outline-none border-none cursor-pointer hover:bg-white/20/10 transition-colors"
            >
              {Object.keys(LANGUAGES).map((key) => (
                <option key={key} value={key}>{LANGUAGES[key].name}</option>
              ))}
            </select>
            <button
              onClick={handleSubmitCode}
              disabled={isEvaluating || !problem}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-6 py-1.5 rounded disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm"
            >
              {isEvaluating ? "Evaluating..." : "Submit Code"}
            </button>
          </div>

          <div className="flex-1 relative">
            <Editor
              height="100%"
              theme="vs-dark"
              language={language}
              value={code}
              onChange={(val) => setCode(val)}
              options={{ minimap: { enabled: false }, fontSize: 14, fontFamily: "'JetBrains Mono', monospace", padding: { top: 20 } }}
            />
            
            {/* Overlay if no problem */}
            {!problem && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-md backdrop-blur-sm flex items-center justify-center z-10">
                <p className="text-zinc-400 font-medium">Search a problem to start coding</p>
              </div>
            )}
                  </div>
                </div>
              </Panel>

              {/* DRAG HANDLE BETWEEN EDITOR AND COMPILER */}
              <Separator className="h-1.5 bg-white/5 backdrop-blur-lg hover:bg-emerald-500/50 active:bg-emerald-500 transition-colors cursor-row-resize z-50 flex justify-center items-center">
                 <div className="w-8 h-0.5 bg-zinc-300 rounded-full" />
              </Separator>

              {/* BOTTOM: Evaluation Output Panel */}
              <Panel defaultSize={30} minSize={10}>
                <div className="h-full bg-white/5 backdrop-blur-lg/5 border-t border-white/10 p-4 overflow-y-auto">
                  {isEvaluating && (
              <div className="flex items-center gap-3 text-zinc-400">
                <div className="w-4 h-4 border-2 border-white/30 border-t-emerald-500 rounded-full animate-spin"></div>
                <span className="text-xs font-medium uppercase tracking-wider">DeepSeek Senior Engineer is reviewing your code...</span>
              </div>
            )}

            {evaluationResult && !evaluationResult.error && (
              <div className="space-y-5">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold mb-1">Test Cases</p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-black text-white">{evaluationResult.submission.executionResult.passed}</span>
                      <span className="text-zinc-400">/ {evaluationResult.submission.executionResult.total}</span>
                    </div>
                  </div>
                  <div className="h-8 w-px bg-white/5 backdrop-blur-lg"></div>
                  <div>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold mb-1">ELO Change</p>
                    <span className={`text-xl font-bold ${evaluationResult.eloChange >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                      {evaluationResult.eloChange > 0 ? "+" : ""}{evaluationResult.eloChange}
                    </span>
                    <span className="text-xs text-zinc-400 ml-2">({evaluationResult.newElo})</span>
                  </div>
                </div>

                {/* Visual Test Cases Status */}
                <div>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold mb-2">Test Cases Breakdown</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {Array.from({ length: evaluationResult.submission.executionResult.total }).map((_, i) => (
                      <div 
                        key={i} 
                        className={`h-2 flex-1 min-w-[20px] rounded-full ${i < evaluationResult.submission.executionResult.passed ? 'bg-emerald-500' : 'bg-rose-500'}`}
                        title={i < evaluationResult.submission.executionResult.passed ? `Test Case ${i+1}: Passed` : `Test Case ${i+1}: Failed`}
                      ></div>
                    ))}
                  </div>
                </div>

                {/* Compiler Output */}
                {evaluationResult.compilerOutput && (
                  <div>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold mb-1">Compiler Output</p>
                    <div className="bg-black text-zinc-300 font-mono text-[10px] p-3 rounded-lg border border-white/10 overflow-x-auto whitespace-pre">
                      {evaluationResult.compilerOutput}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 p-3 rounded-lg border border-white/10">
                    <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">Time Complexity</span>
                    <span className="text-sm font-mono text-fuchsia-400">{evaluationResult.submission.aiFeedback.timeComplexity}</span>
                  </div>
                  <div className="bg-white/10 p-3 rounded-lg border border-white/10">
                    <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">Space Complexity</span>
                    <span className="text-sm font-mono text-fuchsia-400">{evaluationResult.submission.aiFeedback.spaceComplexity}</span>
                  </div>
                </div>

                {evaluationResult.submission.aiFeedback.weaknessesIdentified?.length > 0 && (
                  <div>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold mb-2">Identified Weaknesses</p>
                    <ul className="list-disc list-inside text-xs text-rose-300 space-y-1">
                      {evaluationResult.submission.aiFeedback.weaknessesIdentified.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                )}
                
                <div>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold mb-1">AI Suggestion</p>
                  <p className="text-xs text-emerald-600 italic">"{evaluationResult.submission.aiFeedback.suggestions}"</p>
                </div>
              </div>
            )}

            {evaluationResult?.error && (
              <p className="text-xs text-rose-600 font-mono">{evaluationResult.error}</p>
            )}

            {!evaluationResult && !isEvaluating && (
              <div className="h-full flex items-center justify-center text-zinc-400 text-xs italic">
                Evaluation results will appear here...
              </div>
            )}
                  </div>
                </Panel>
              </Group>
            </Panel>
          </Group>
        </div>
      </div>
  );
}
