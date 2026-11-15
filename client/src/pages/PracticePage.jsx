import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import API from "../api/axios";

const LANGUAGES = {
  javascript: { name: "JavaScript", monaco: "javascript", jdoodle: "nodejs", versionIndex: "4" },
  python: { name: "Python", monaco: "python", jdoodle: "python3", versionIndex: "4" },
  java: { name: "Java", monaco: "java", jdoodle: "java", versionIndex: "4" },
  cpp: { name: "C++", monaco: "cpp", jdoodle: "cpp17", versionIndex: "1" },
  c: { name: "C", monaco: "c", jdoodle: "c", versionIndex: "5" },
  react: { name: "React", monaco: "javascript", isFrontend: true },
  html: { name: "HTML / JS", monaco: "html", isFrontend: true },
  sql: { name: "SQL", monaco: "sql", jdoodle: "sql", versionIndex: "4" },
};

const BOILERPLATES = {
  javascript: "function solve() {\n  // Write your code here\n}\n\nconsole.log(solve());",
  python: "def solve():\n    # Write your code here\n    pass\n\nif __name__ == '__main__':\n    solve()",
  java: "public class Main {\n    public static void main(String[] args) {\n        // Write your code here\n    }\n}",
  cpp: "#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    return 0;\n}",
  csharp: "using System;\n\nclass Program {\n    static void Main() {\n        // Write your code here\n    }\n}"
};

export default function PracticePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  // Topic / Lesson state
  const [topicInput, setTopicInput] = useState("");
  const [currentTopic, setCurrentTopic] = useState("");
  const [lesson, setLesson] = useState(null);
  const [loadingLesson, setLoadingLesson] = useState(false);
  const [lessonError, setLessonError] = useState("");
  const [activeSection, setActiveSection] = useState(0);

  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);
  const chatEndRef = useRef(null);

  // Editor state
  const [language, setLanguage] = useState("javascript");
  const [editorCode, setEditorCode] = useState("// Write your solution here...\n");
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionOutput, setExecutionOutput] = useState(null);
  const [frontendHtml, setFrontendHtml] = useState(null);
  const [frontendError, setFrontendError] = useState(null);

  // Left panel tab
  const [leftTab, setLeftTab] = useState("lesson"); // "lesson" | "chat"

  useEffect(() => {
    const handleIframeMessage = (event) => {
      if (event.data?.type === 'EXECUTION_ERROR') {
        setFrontendError(event.data.error);
      } else if (event.data?.type === 'EXECUTION_SUCCESS') {
        setFrontendError(null);
      }
    };
    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
  }, []);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      setUser(JSON.parse(userStr));
    } else {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    const lessonId = searchParams.get("lessonId");
    const topicParam = searchParams.get("topic");

    if (lessonId && user) {
      loadLessonById(lessonId);
    } else if (topicParam && user && !lesson && !loadingLesson) {
      handleGenerateLesson(null, topicParam);
    }
  }, [searchParams, user]);

  const loadLessonById = async (lessonId) => {
    try {
      setLoadingLesson(true);
      const res = await API.get(`/ai/lessons/${lessonId}`, getAuthHeaders());
      const { lesson: data, topic } = res.data;
      
      setLesson(data);
      setCurrentTopic(topic);
      setTopicInput(topic);
      
      let targetLang = data.language || "javascript";
      if (topic.toLowerCase().includes("react")) targetLang = "react";
      else if (topic.toLowerCase().includes("html") || topic.toLowerCase().includes("css")) targetLang = "html";
      else if (topic.toLowerCase().includes("sql")) targetLang = "sql";
      
      if (LANGUAGES[targetLang]) {
        setLanguage(targetLang);
      }

      if (data.sections?.[0]?.exercise?.starterCode) {
        setEditorCode(data.sections[0].exercise.starterCode);
      }
    } catch (err) {
      console.error("Failed to load lesson:", err);
      setLessonError("Could not load the requested lesson.");
    } finally {
      setLoadingLesson(false);
    }
  };

  const handleCompleteLesson = async () => {
    const lessonId = searchParams.get("lessonId");
    if (!lessonId) return;
    
    try {
      await API.put(`/ai/lessons/${lessonId}/complete`, {}, getAuthHeaders());
      setLesson(null);
      setTopicInput("");
      setCurrentTopic("");
      setSearchParams({});
      setEditorCode("// Write your solution here...\n");
      setExecutionOutput(null);
      setFrontendHtml(null);
    } catch (err) {
      console.error("Failed to complete lesson:", err);
      alert("Failed to mark lesson as completed.");
    }
  };

  const handleGenerateLesson = async (e, topicOverride = null) => {
    if (e && e.preventDefault) e.preventDefault();
    const targetTopic = topicOverride || topicInput;
    if (!targetTopic.trim() || loadingLesson) return;

    setLoadingLesson(true);
    setLesson(null);
    setLessonError("");
    setActiveSection(0);
    setChatMessages([]);
    setCurrentTopic(targetTopic.trim());
    setTopicInput(targetTopic.trim());
    setLeftTab("lesson");

    try {
      const res = await API.post("/ai/generate-lesson", { topic: targetTopic.trim() }, getAuthHeaders());
      const { lesson: data, lessonId } = res.data;
      
      if (lessonId) {
        setSearchParams({ lessonId });
      }
      
      setLesson(data);

      let targetLang = data.language || "javascript";
      if (targetTopic.toLowerCase().includes("react")) targetLang = "react";
      else if (targetTopic.toLowerCase().includes("html") || targetTopic.toLowerCase().includes("css")) targetLang = "html";
      else if (targetTopic.toLowerCase().includes("sql")) targetLang = "sql";
      
      if (LANGUAGES[targetLang]) {
        setLanguage(targetLang);
      }

      if (data.sections?.[0]?.exercise?.starterCode) {
        setEditorCode(data.sections[0].exercise.starterCode);
      }
    } catch (err) {
      console.error("Failed to generate lesson:", err);
      const errorMsg = err.response?.data?.message || "Sorry, I couldn't generate a lesson right now. Please try again.";
      setLessonError(errorMsg);
      setChatMessages([{
        role: "assistant",
        content: errorMsg
      }]);
    } finally {
      setLoadingLesson(false);
    }
  };

  const handleSectionClick = (index) => {
    setActiveSection(index);
    const section = lesson?.sections?.[index];
    if (section?.exercise?.starterCode) {
      setEditorCode(section.exercise.starterCode);
    }
  };

  const loadCodeExample = () => {
    const section = lesson?.sections?.[activeSection];
    if (section?.codeExample) {
      setEditorCode(section.codeExample);
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || loadingChat) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setLoadingChat(true);

    try {
      const res = await API.post("/ai/chat", {
        topic: currentTopic,
        messages: [...chatMessages, { role: "user", content: userMessage }],
        code: editorCode,
      }, getAuthHeaders());
      setChatMessages(prev => [...prev, { role: "assistant", content: res.data.reply }]);
    } catch (err) {
      setChatMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I had trouble responding. Please try again."
      }]);
    } finally {
      setLoadingChat(false);
    }
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    const isStarter = !editorCode || editorCode === "// Your code here" || editorCode.startsWith("// Write your solution");
    if (isStarter) {
      setEditorCode(BOILERPLATES[newLang] || "// Write your code here\n");
    }
  };

  const handleRunCode = async () => {
    if (isExecuting) return;
    setIsExecuting(true);
    setExecutionOutput(null);
    setFrontendHtml(null);

    const langConfig = LANGUAGES[language];

    if (langConfig?.isFrontend) {
      setTimeout(() => {
        let html = editorCode;
        if (language === "react") {
          const strippedCode = editorCode.replace(/import\s+.*?\s+from\s+['"].*?['"];?/g, '');
          const hasRootRender = editorCode.includes('createRoot');
          
          html = `
            <!DOCTYPE html>
            <html>
            <head>
              <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
              <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
              <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
              <style>body { font-family: sans-serif; color: #ffffff; background: #031320; padding: 1rem; }</style>
            </head>
            <body>
              <div id="root"></div>
              <script type="text/babel">
                window.onerror = function(message, source, lineno) {
                  window.parent.postMessage({ type: 'EXECUTION_ERROR', error: message + ' at line ' + lineno }, '*');
                  document.getElementById('root').innerHTML = '<div style="color:#f43f5e; font-family:monospace;">Runtime Error:\\n' + message + '</div>';
                  return true;
                };
                try {
                  const { useState, useEffect, useRef, useMemo, useCallback, useReducer, useContext } = React;
                  ${strippedCode}
                  if (typeof App !== 'undefined' && !${hasRootRender}) {
                    const root = ReactDOM.createRoot(document.getElementById('root'));
                    root.render(<App />);
                  }
                  window.parent.postMessage({ type: 'EXECUTION_SUCCESS' }, '*');
                } catch(err) {
                  window.parent.postMessage({ type: 'EXECUTION_ERROR', error: err.message }, '*');
                  document.getElementById('root').innerHTML = '<div style="color:#f43f5e; font-family:monospace;">Compilation Error:\\n' + err.message + '</div>';
                }
              </script>
            </body>
            </html>
          `;
        } else {
          html = `
            <!DOCTYPE html>
            <html>
            <head>
              <style>body{color:#ffffff;background:#031320;padding:1rem;}</style>
              <script>
                window.onerror = function(message) {
                  window.parent.postMessage({ type: 'EXECUTION_ERROR', error: message }, '*');
                  return true;
                };
                window.onload = function() {
                  window.parent.postMessage({ type: 'EXECUTION_SUCCESS' }, '*');
                };
              </script>
            </head>
            <body>${editorCode}</body>
            </html>
          `;
        }
        
        setFrontendError(null);
        setFrontendHtml(html);
        setExecutionOutput({ statusCode: 200, isFrontend: true });
        setIsExecuting(false);
      }, 400);
      return;
    }

    try {
      const res = await API.post("/code/execute", {
        code: editorCode,
        language,
        stdin: "",
      }, getAuthHeaders());
      setExecutionOutput(res.data);
    } catch (err) {
      setExecutionOutput({ output: err.response?.data?.message || "Execution failed", statusCode: 500 });
    } finally {
      setIsExecuting(false);
    }
  };

  const renderText = (text) => {
    if (!text) return null;
    const parts = text.split(/(```[\s\S]*?```)/g);
    return parts.map((part, i) => {
      if (part.startsWith("```")) {
        const code = part.replace(/```\w*\n?/, "").replace(/```$/, "").trim();
        return (
          <pre key={i} className="bg-black/40 border border-white/10 rounded-xl p-3 my-2 text-xs font-mono text-zinc-300 overflow-x-auto whitespace-pre-wrap">
            {code}
          </pre>
        );
      }
      return <span key={i} className="whitespace-pre-wrap">{part}</span>;
    });
  };

  return (
    <div className="h-screen w-full bg-[#041826] flex flex-col overflow-hidden font-sans text-white">
      {/* Top Header - Strictly Nebula, no tags */}
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
          
          {/* Strictly Nebula, no tags or subtitle text underneath */}
          <h1 
            style={{ fontFamily: "'Instrument Serif', Georgia, serif" }} 
            className="text-2xl font-normal tracking-tight text-white"
          >
            Nebula
          </h1>
        </div>

        {/* Search Input for Topic */}
        <form onSubmit={handleGenerateLesson} className="flex items-center gap-2 max-w-md flex-1 mx-6">
          <input
            type="text"
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
            placeholder="Topic (e.g. Binary Search, React Hooks, SQL)"
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-1.5 text-xs text-white outline-none focus:border-white/40 placeholder:text-zinc-500 transition-colors"
          />
          <button
            type="submit"
            disabled={loadingLesson || !topicInput.trim()}
            className="bg-white hover:bg-zinc-200 text-[#041826] text-xs font-medium px-4 py-1.5 rounded-xl disabled:opacity-40 transition-all shrink-0"
          >
            {loadingLesson ? "Generating..." : "Generate"}
          </button>
        </form>

        <div className="text-xs text-zinc-400">
          {user?.name}
        </div>
      </header>

      {/* Main Content Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANE: Lesson or Chat */}
        <div className="w-[460px] shrink-0 border-r border-white/10 flex flex-col bg-[#031320]/60">
          {/* Minimalist Tabs */}
          <div className="flex border-b border-white/10 shrink-0 bg-white/[0.02]">
            <button
              onClick={() => setLeftTab("lesson")}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                leftTab === "lesson" ? "text-white border-b-2 border-white bg-white/[0.03]" : "text-zinc-400 hover:text-white"
              }`}
            >
              Lesson
            </button>
            <button
              onClick={() => setLeftTab("chat")}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                leftTab === "chat" ? "text-white border-b-2 border-white bg-white/[0.03]" : "text-zinc-400 hover:text-white"
              }`}
            >
              Ask AI
            </button>
          </div>

          {/* Lesson Content */}
          {leftTab === "lesson" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {!lesson && !loadingLesson ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <h3 
                    style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
                    className="text-2xl text-white mb-2"
                  >
                    Select a topic to begin
                  </h3>
                  <p className="text-zinc-400 text-xs max-w-xs mb-6">
                    Enter any programming concept above to generate an interactive lesson.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center max-w-xs">
                    {["Binary Search", "React Hooks", "Dynamic Programming", "SQL Joins"].map((t) => (
                      <button
                        key={t}
                        onClick={() => { setTopicInput(t); }}
                        className="text-xs bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-zinc-300 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  {lessonError && (
                    <div className="mt-6 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
                      {lessonError}
                    </div>
                  )}
                </div>
              ) : loadingLesson ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                  <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  <p className="text-white text-xs mt-4">Generating lesson...</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto">
                  {/* Horizontal Section Pills */}
                  <div className="flex overflow-x-auto border-b border-white/10 bg-white/[0.01] shrink-0 p-2 gap-1.5 scrollbar-hide">
                    {lesson.sections.map((section, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSectionClick(idx)}
                        className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all ${
                          activeSection === idx 
                            ? "bg-white text-[#041826] font-medium" 
                            : "text-zinc-400 hover:text-white bg-white/[0.03]"
                        }`}
                      >
                        {idx + 1}. {section.heading}
                      </button>
                    ))}
                  </div>

                  {lesson.sections[activeSection] && (
                    <div className="p-6 space-y-6">
                      <h3 className="text-lg font-medium text-white">
                        {lesson.sections[activeSection].heading}
                      </h3>

                      <div className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                        {lesson.sections[activeSection].explanation}
                      </div>

                      {lesson.sections[activeSection].codeExample && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Example</span>
                            <button
                              onClick={loadCodeExample}
                              className="text-[11px] text-zinc-300 hover:text-white transition-colors"
                            >
                              Load in Editor &rarr;
                            </button>
                          </div>
                          <pre className="bg-black/40 border border-white/10 rounded-xl p-3.5 text-xs font-mono text-zinc-300 overflow-x-auto whitespace-pre-wrap">
                            {lesson.sections[activeSection].codeExample}
                          </pre>
                        </div>
                      )}

                      {lesson.sections[activeSection].exercise && (
                        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 space-y-3">
                          <span className="text-xs font-medium text-white block">Exercise</span>
                          <p className="text-xs text-zinc-300 leading-relaxed">
                            {lesson.sections[activeSection].exercise.instructions}
                          </p>
                          <button
                            onClick={() => {
                              if (lesson.sections[activeSection].exercise.starterCode) {
                                setEditorCode(lesson.sections[activeSection].exercise.starterCode);
                              }
                            }}
                            className="text-xs bg-white/[0.08] hover:bg-white/[0.12] text-white px-3 py-1.5 rounded-lg transition-colors border border-white/10"
                          >
                            Load Exercise in Editor
                          </button>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <button
                          onClick={() => handleSectionClick(Math.max(0, activeSection - 1))}
                          disabled={activeSection === 0}
                          className="text-xs text-zinc-400 hover:text-white disabled:opacity-30"
                        >
                          &larr; Previous
                        </button>
                        <span className="text-[11px] text-zinc-500">
                          {activeSection + 1} of {lesson.sections.length}
                        </span>
                        {activeSection === lesson.sections.length - 1 ? (
                          <button
                            onClick={handleCompleteLesson}
                            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                          >
                            Complete Lesson ✓
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSectionClick(Math.min(lesson.sections.length - 1, activeSection + 1))}
                            className="text-xs text-zinc-200 hover:text-white"
                          >
                            Next &rarr;
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Ask AI Tab */}
          {leftTab === "chat" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.length === 0 && (
                  <div className="text-center text-zinc-500 text-xs mt-8">
                    {currentTopic ? `Ask questions regarding "${currentTopic}".` : "Generate a lesson first to start asking questions."}
                  </div>
                )}
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                    <span className="text-[10px] text-zinc-500 mb-1">
                      {msg.role === "user" ? "You" : "Nebula AI"}
                    </span>
                    <div className={`px-3.5 py-2.5 rounded-xl text-xs max-w-[90%] leading-relaxed ${
                      msg.role === "user" ? "bg-white text-[#041826] font-medium" : "bg-white/[0.04] border border-white/10 text-zinc-300"
                    }`}>
                      {msg.role === "assistant" ? renderText(msg.content) : msg.content}
                    </div>
                  </div>
                ))}
                {loadingChat && (
                  <div className="text-xs text-zinc-500 animate-pulse">Thinking...</div>
                )}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleChatSubmit} className="p-3 border-t border-white/10 bg-[#031320] flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask a question..."
                  disabled={!currentTopic}
                  className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-white/40 placeholder:text-zinc-500"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || loadingChat || !currentTopic}
                  className="bg-white text-[#041826] hover:bg-zinc-200 px-3.5 py-2 rounded-xl text-xs font-medium disabled:opacity-40 transition-all"
                >
                  Send
                </button>
              </form>
            </div>
          )}
        </div>

        {/* RIGHT PANE: Code Editor & Runner */}
        <div className="flex-1 flex flex-col bg-[#020d17]">
          {/* Top Control Bar */}
          <div className="h-12 border-b border-white/10 flex items-center justify-between px-4 shrink-0 bg-white/[0.01]">
            <div className="flex items-center gap-3">
              <select
                value={language}
                onChange={handleLanguageChange}
                disabled={!!lesson}
                className="bg-[#041826] border border-white/10 text-zinc-300 text-xs rounded-lg px-2.5 py-1 outline-none"
              >
                {Object.keys(LANGUAGES).map(key => (
                  <option key={key} value={key}>{LANGUAGES[key].name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleRunCode}
              disabled={isExecuting}
              className="bg-white hover:bg-zinc-200 text-[#041826] text-xs font-medium px-4 py-1.5 rounded-lg disabled:opacity-40 transition-all flex items-center gap-1.5"
            >
              {isExecuting ? "Executing..." : "Run Code"}
            </button>
          </div>

          {/* Monaco Editor Container */}
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              language={LANGUAGES[language]?.monaco || language}
              value={editorCode}
              onChange={(val) => setEditorCode(val || "")}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                padding: { top: 14 },
                automaticLayout: true,
                wordWrap: "on",
                scrollBeyondLastLine: false,
              }}
            />
          </div>

          {/* Compiler Output Drawer */}
          <div className="h-[180px] bg-[#031320] border-t border-white/10 flex flex-col shrink-0">
            <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider px-4 py-2 border-b border-white/10 flex items-center justify-between">
              <span>Output</span>
              {executionOutput && (
                <span className={`text-[10px] ${
                  (executionOutput.isFrontend ? !frontendError : (executionOutput.statusCode === 200 && !executionOutput.output?.match(/(Error:|Exception|SyntaxError)/i)))
                  ? "text-emerald-400" 
                  : "text-rose-400"
                }`}>
                  {(executionOutput.isFrontend ? !frontendError : (executionOutput.statusCode === 200 && !executionOutput.output?.match(/(Error:|Exception|SyntaxError)/i))) 
                    ? "Success" 
                    : "Error"}
                </span>
              )}
            </div>
            
            <div className="flex-1 p-3 overflow-y-auto font-mono text-xs text-zinc-300">
              {frontendHtml ? (
                <iframe 
                  srcDoc={frontendHtml} 
                  title="Preview"
                  className="w-full h-full border-none bg-transparent"
                  sandbox="allow-scripts"
                />
              ) : executionOutput ? (
                <pre className="whitespace-pre-wrap">{executionOutput.output || "Program finished with no output."}</pre>
              ) : (
                <span className="text-zinc-500 italic">Run code to see execution output.</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
