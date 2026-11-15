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
  { label: "Arrays", query: "easy array" },
  { label: "Two Pointers", query: "two pointers" },
  { label: "Sliding Window", query: "medium sliding window" },
  { label: "Binary Search", query: "binary search" },
  { label: "Dynamic Programming", query: "kadane subarray" },
  { label: "Hash Maps", query: "hashmap hashing" },
];

export default function AdaptivePractice() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // Core State
  const [query, setQuery] = useState("");
  const [problem, setProblem] = useState(null);
  const [loadingProblem, setLoadingProblem] = useState(false);
  const [searchOptions, setSearchOptions] = useState(null);
  
  // History State
  const [history, setHistory] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Editor State
  const [code, setCode] = useState("// Write your solution here...\n");
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
      setHistory(res.data.history || []);
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
    try {
      const res = await API.get(`/adaptive/problem/${id}`, getAuthHeaders());
      const loadedProblem = res.data.problem;
      setProblem(loadedProblem);
      setCode(BOILERPLATES[language] || "// Write your solution here...\n");
    } catch (err) {
      console.error("Failed to load history problem", err);
    } finally {
      setLoadingProblem(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm("Clear your problem history?")) return;
    try {
      await API.delete("/adaptive/history", getAuthHeaders());
      setHistory([]);
    } catch (err) {
      console.error("Failed to clear history", err);
    }
  };

  const handleGenerateProblem = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!query.trim() || loadingProblem) return;

    setLoadingProblem(true);
    setEvaluationResult(null);
    setProblem(null);
    setSearchOptions(null);

    try {
      const res = await API.post("/adaptive/generate-problem", { query }, getAuthHeaders());
      if (res.data.needsDisambiguation) {
        setSearchOptions(res.data.options);
      } else if (res.data.problem) {
        setProblem(res.data.problem);
        setCode(BOILERPLATES[language] || "// Write your solution here...\n");
        fetchHistory();
      }
    } catch (err) {
      console.error("Failed to fetch problem", err);
    } finally {
      setLoadingProblem(false);
    }
  };

  const handleOptionSelect = (option) => {
    setSearchOptions(null);
    setQuery(option);
    setTimeout(() => {
      handleGenerateProblem(null);
    }, 50);
  };

  const handleQuickFilter = (q) => {
    setQuery(q);
    setSearchOptions(null);
    setLoadingProblem(true);
    setEvaluationResult(null);
    setProblem(null);

    API.post("/adaptive/generate-problem", { query: q }, getAuthHeaders())
      .then((res) => {
        if (res.data.problem) {
          setProblem(res.data.problem);
          setCode(BOILERPLATES[language] || "// Write your solution here...\n");
          fetchHistory();
        }
      })
      .catch((err) => console.error("Filter problem load failed", err))
      .finally(() => setLoadingProblem(false));
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    const isStarter = !code || code.startsWith("// Write your solution") || Object.values(BOILERPLATES).includes(code);
    if (isStarter) {
      setCode(BOILERPLATES[newLang] || "// Write your code here\n");
    }
  };

  const handleSubmitCode = async () => {
    if (!problem || isEvaluating) return;
    setIsEvaluating(true);
    setEvaluationResult(null);

    try {
      const res = await API.post(
        "/adaptive/evaluate",
        {
          problemId: problem._id,
          code,
          language,
        },
        getAuthHeaders()
      );
      setEvaluationResult(res.data);
      fetchHistory();
    } catch (err) {
      console.error("Evaluation failed", err);
      setEvaluationResult({ error: err.response?.data?.message || "Evaluation failed" });
    } finally {
      setIsEvaluating(false);
    }
  };

  const renderStatement = (text) => {
    if (!text) return null;
    return text.split("\n").map((line, idx) => (
      <p key={idx} className="text-xs text-zinc-300 leading-relaxed mb-2">
        {line}
      </p>
    ));
  };

  return (
    <div className="h-screen w-full bg-[#041826] flex flex-col overflow-hidden font-sans text-white">
      {/* Top Header - Strictly Zephyr, no tags */}
      <header className="h-14 border-b border-white/10 bg-[#041826]/90 backdrop-blur-md flex items-center justify-between px-6 z-10 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(user?.role === "interviewer" ? "/interviewer-dashboard" : "/candidate-dashboard")}
            className="text-zinc-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/[0.04]"
            title="Back to Dashboard"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          
          {/* Strictly Zephyr, no tags or subtitle text underneath */}
          <h1 
            style={{ fontFamily: "'Instrument Serif', Georgia, serif" }} 
            className="text-2xl font-normal tracking-tight text-white"
          >
            Zephyr
          </h1>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
              sidebarOpen ? "bg-white text-[#041826] border-white font-medium" : "bg-white/[0.04] text-zinc-400 border-white/10 hover:text-white"
            }`}
          >
            History
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setProblem(null);
              setEvaluationResult(null);
              setCode(BOILERPLATES[language] || "// Write your solution here...\n");
              setQuery("");
            }}
            className="text-xs bg-white/[0.06] hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg transition-all"
          >
            + New Problem
          </button>
          <div className="text-xs text-zinc-400">{user?.name}</div>
        </div>
      </header>

      {/* Main Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* SIDEBAR: History */}
        {sidebarOpen && (
          <div className="w-60 bg-[#031320]/80 border-r border-white/10 flex flex-col shrink-0 overflow-hidden">
            <div className="p-3.5 border-b border-white/10 flex items-center justify-between">
              <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">History</span>
              {history.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="text-[10px] text-zinc-500 hover:text-rose-400 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {history.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center mt-4">No past problems.</p>
              ) : (
                history.map((hItem) => (
                  <button
                    key={hItem._id}
                    onClick={() => loadHistoryProblem(hItem._id)}
                    className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors ${
                      problem?._id === hItem._id 
                        ? "bg-white/[0.08] text-white border border-white/15" 
                        : "text-zinc-400 hover:text-white hover:bg-white/[0.03]"
                    }`}
                  >
                    <p className="truncate font-medium">{hItem.title}</p>
                    <span className="text-[10px] text-zinc-500">{hItem.topic}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        <Group orientation="horizontal" className="flex-1">
          {/* LEFT PANE: Problem Description & Search */}
          <Panel defaultSize={38} minSize={25}>
            <div className="h-full flex flex-col border-r border-white/10 bg-[#031320]/50 relative">
              {/* Problem Details Scroll Area */}
              <div className="flex-1 overflow-y-auto p-6 pb-28">
                {!problem && !loadingProblem && (!searchOptions || searchOptions.length === 0) && (
                  <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto">
                    <h3 
                      style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
                      className="text-2xl text-white mb-2"
                    >
                      Search a problem to begin
                    </h3>
                    <p className="text-xs text-zinc-400 mb-6">
                      Select a topic pattern below or type a query in the search bar.
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {QUICK_FILTERS.map((filter) => (
                        <button
                          key={filter.label}
                          onClick={() => handleQuickFilter(filter.query)}
                          className="text-xs bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-zinc-300 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {loadingProblem && (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    <p className="text-xs text-zinc-400 mt-4">Retrieving problem...</p>
                  </div>
                )}

                {searchOptions && searchOptions.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-white">Select a specific pattern:</h3>
                    <div className="space-y-2">
                      {searchOptions.map((opt, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleOptionSelect(opt)}
                          className="w-full text-left p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs text-zinc-200 transition-colors flex items-center justify-between"
                        >
                          <span>{opt}</span>
                          <span className="text-zinc-500">&rarr;</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {problem && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-xl font-normal text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                        {problem.title}
                      </h2>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-500">
                        <span>{problem.topic}</span>
                        <span>•</span>
                        <span>ELO {problem.difficultyScore}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/10">
                      {renderStatement(problem.statement)}
                    </div>

                    {problem.testCases && problem.testCases.length > 0 && (
                      <div className="pt-4 border-t border-white/10 space-y-3">
                        <span className="text-xs font-medium text-zinc-300 block">Example Case</span>
                        <div className="bg-black/40 border border-white/10 rounded-xl p-3.5 space-y-2 text-xs font-mono">
                          <div>
                            <span className="text-zinc-500 font-sans text-[10px] block mb-0.5">Input</span>
                            <span className="text-zinc-300">{problem.testCases[0].input}</span>
                          </div>
                          <div className="pt-2 border-t border-white/5">
                            <span className="text-zinc-500 font-sans text-[10px] block mb-0.5">Expected Output</span>
                            <span className="text-emerald-400">{problem.testCases[0].expectedOutput}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Search Bar */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#031320] via-[#031320]/95 to-transparent">
                <form onSubmit={handleGenerateProblem} className="relative">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search problem (e.g. 'binary search', 'two pointers')..."
                    disabled={loadingProblem}
                    className="w-full bg-[#041826] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-white/40 pr-10"
                  />
                  <button
                    type="submit"
                    disabled={!query.trim() || loadingProblem}
                    className="absolute right-2 top-2 bottom-2 px-2.5 text-xs text-zinc-400 hover:text-white disabled:opacity-40"
                  >
                    &rarr;
                  </button>
                </form>
              </div>
            </div>
          </Panel>

          <Separator className="w-[1px] bg-white/10 hover:bg-white/30 transition-colors cursor-col-resize z-20" />

          {/* RIGHT PANE: Code Editor & Evaluation Results */}
          <Panel defaultSize={62} minSize={30}>
            <Group orientation="vertical">
              <Panel defaultSize={68} minSize={25}>
                <div className="h-full flex flex-col bg-[#020d17]">
                  {/* Editor Bar */}
                  <div className="h-12 border-b border-white/10 flex items-center justify-between px-4 shrink-0 bg-white/[0.01]">
                    <select
                      value={language}
                      onChange={handleLanguageChange}
                      className="bg-[#041826] border border-white/10 text-zinc-300 text-xs rounded-lg px-2.5 py-1 outline-none"
                    >
                      {Object.keys(LANGUAGES).map((key) => (
                        <option key={key} value={key}>{LANGUAGES[key].name}</option>
                      ))}
                    </select>

                    <button
                      onClick={handleSubmitCode}
                      disabled={isEvaluating || !problem}
                      className="bg-white hover:bg-zinc-200 text-[#041826] text-xs font-medium px-4 py-1.5 rounded-lg disabled:opacity-40 transition-all"
                    >
                      {isEvaluating ? "Evaluating..." : "Submit Solution"}
                    </button>
                  </div>

                  <div className="flex-1 min-h-0 relative">
                    <Editor
                      height="100%"
                      theme="vs-dark"
                      language={language}
                      value={code}
                      onChange={(val) => setCode(val || "")}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 13,
                        padding: { top: 14 },
                        automaticLayout: true,
                        wordWrap: "on",
                        scrollBeyondLastLine: false,
                      }}
                    />

                    {!problem && (
                      <div className="absolute inset-0 bg-[#020d17]/80 backdrop-blur-sm flex items-center justify-center z-10">
                        <span className="text-zinc-500 text-xs">Search and select a problem to write code</span>
                      </div>
                    )}
                  </div>
                </div>
              </Panel>

              <Separator className="h-[1px] bg-white/10 hover:bg-white/30 transition-colors cursor-row-resize z-20" />

              {/* Evaluation Panel */}
              <Panel defaultSize={32} minSize={15}>
                <div className="h-full bg-[#031320] p-4 overflow-y-auto">
                  {isEvaluating && (
                    <div className="flex items-center gap-2 text-zinc-400 text-xs">
                      <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      <span>Running tests...</span>
                    </div>
                  )}

                  {evaluationResult && !evaluationResult.error && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-6">
                        <div>
                          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Passed Tests</span>
                          <span className="text-lg font-light text-white">
                            {evaluationResult.submission.executionResult.passed} / {evaluationResult.submission.executionResult.total}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Score Change</span>
                          <span className={`text-lg font-light ${evaluationResult.eloChange >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                            {evaluationResult.eloChange > 0 ? "+" : ""}{evaluationResult.eloChange}
                          </span>
                        </div>
                      </div>

                      {evaluationResult.compilerOutput && (
                        <div>
                          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Output</span>
                          <div className="bg-black/40 text-zinc-300 font-mono text-xs p-3 rounded-lg border border-white/10 overflow-x-auto whitespace-pre">
                            {evaluationResult.compilerOutput}
                          </div>
                        </div>
                      )}

                      {evaluationResult.submission.aiFeedback?.suggestions && (
                        <p className="text-xs text-zinc-400 italic">
                          "{evaluationResult.submission.aiFeedback.suggestions}"
                        </p>
                      )}
                    </div>
                  )}

                  {evaluationResult?.error && (
                    <p className="text-xs text-rose-400 font-mono">{evaluationResult.error}</p>
                  )}

                  {!evaluationResult && !isEvaluating && (
                    <div className="h-full flex items-center justify-center text-zinc-500 text-xs italic">
                      Submit your solution to view test outcomes and evaluation feedback.
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
