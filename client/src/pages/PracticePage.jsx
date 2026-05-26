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
  react: { name: "React (Web)", monaco: "javascript", isFrontend: true },
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
  const [editorCode, setEditorCode] = useState("// Start coding here...\n");
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionOutput, setExecutionOutput] = useState(null);
  const [frontendHtml, setFrontendHtml] = useState(null);

  // Left panel tab
  const [leftTab, setLeftTab] = useState("lesson"); // "lesson" | "chat"

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
    if (lessonId && user) {
      loadLessonById(lessonId);
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
      
      // Set editor language based on lesson or topic
      let targetLang = data.language || "javascript";
      if (topic.toLowerCase().includes("react")) targetLang = "react";
      else if (topic.toLowerCase().includes("html") || topic.toLowerCase().includes("css")) targetLang = "html";
      else if (topic.toLowerCase().includes("sql")) targetLang = "sql";
      
      if (LANGUAGES[targetLang]) {
        setLanguage(targetLang);
      }

      // Load first section's starter code
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

  const handleGenerateLesson = async (e) => {
    e.preventDefault();
    if (!topicInput.trim() || loadingLesson) return;

    setLoadingLesson(true);
    setLesson(null);
    setLessonError("");
    setActiveSection(0);
    setChatMessages([]);
    setCurrentTopic(topicInput.trim());
    setLeftTab("lesson");

    try {
      const res = await API.post("/ai/generate-lesson", { topic: topicInput.trim() }, getAuthHeaders());
      const { lesson: data, lessonId } = res.data;
      
      // Update URL so a refresh retains the lesson
      if (lessonId) {
        setSearchParams({ lessonId });
      }
      
      setLesson(data);

      // Set editor language based on lesson or topic
      let targetLang = data.language || "javascript";
      if (topicInput.toLowerCase().includes("react")) targetLang = "react";
      else if (topicInput.toLowerCase().includes("html") || topicInput.toLowerCase().includes("css")) targetLang = "html";
      else if (topicInput.toLowerCase().includes("sql")) targetLang = "sql";
      
      if (LANGUAGES[targetLang]) {
        setLanguage(targetLang);
      }

      // Load first section's starter code
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
    const isStarter = !editorCode || editorCode === "// Your code here" || editorCode === "// Start coding here...\n" || Object.values(BOILERPLATES).includes(editorCode);
    if (isStarter) {
      setEditorCode(BOILERPLATES[newLang] || "// Your code here");
    }
  };

const handleRunCode = async () => {
    if (isExecuting) return;
    setIsExecuting(true);
    setExecutionOutput(null);
    setFrontendHtml(null);

    const langConfig = LANGUAGES[language];

    // Frontend Compilation (React / HTML)
    if (langConfig?.isFrontend) {
      setTimeout(() => {
        let html = editorCode;
        if (language === "react") {
          html = `
            <!DOCTYPE html>
            <html>
            <head>
              <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
              <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
              <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
              <style>body { font-family: sans-serif; color: #18181b; background: #ffffff; padding: 1rem; }</style>
            </head>
            <body>
              <div id="root"></div>
              <script type="text/babel">
                try {
                  ${editorCode}
                  
                  // Auto-mount if App is defined and root.render is not explicitly called
                  if (typeof App !== 'undefined' && !editorCode.includes('createRoot')) {
                    const root = ReactDOM.createRoot(document.getElementById('root'));
                    root.render(<App />);
                  }
                } catch(err) {
                  document.getElementById('root').innerHTML = '<div style="color:#e11d48; font-family:monospace;">' + err.message + '</div>';
                }
              </script>
            </body>
            </html>
          `;
        } else {
          // Wrap basic HTML in a styled body if just pure JS/HTML
          html = `<!DOCTYPE html><html><head><style>body{color:#18181b;background:#ffffff;}</style></head><body>${editorCode}</body></html>`;
        }
        
        setFrontendHtml(html);
        setExecutionOutput({ statusCode: 200, isFrontend: true });
        setIsExecuting(false);
      }, 500);
      return;
    }

    // Backend Execution (JDoodle)
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

  // Render markdown-like text with code blocks
  const renderText = (text) => {
    if (!text) return null;
    const parts = text.split(/(```[\s\S]*?```)/g);
    return parts.map((part, i) => {
      if (part.startsWith("```")) {
        const code = part.replace(/```\w*\n?/, "").replace(/```$/, "").trim();
        return (
          <pre key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 my-3 text-sm font-mono text-emerald-700 overflow-x-auto whitespace-pre-wrap">
            {code}
          </pre>
        );
      }
      return <span key={i} className="whitespace-pre-wrap">{part}</span>;
    });
  };

  return (
    <div className="h-screen w-full bg-transparent flex flex-col overflow-hidden font-sans text-zinc-200">

      {/* Header */}
      <header className="h-14 border-b border-white/10 bg-white/5 flex items-center justify-between px-6 z-10 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(user?.role === "interviewer" ? "/interviewer-dashboard" : "/candidate-dashboard")}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">AI</span>
            </div>
            <span className="font-bold text-white text-sm">Practice & Learn</span>
          </div>
          {currentTopic && (
            <span className="text-[10px] bg-violet-500/10 border border-zinc-900/20 text-white px-3 py-1 rounded-full font-bold uppercase tracking-wider">
              {currentTopic}
            </span>
          )}
        </div>

        {/* Topic Search Bar in header */}
        <form onSubmit={handleGenerateLesson} className="flex items-center gap-2 max-w-lg flex-1 mx-8">
          <div className="flex-1 relative">
            <input
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              placeholder='What do you want to learn? (e.g., "React", "Binary Search", "SQL Joins")'
              className="w-full bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-white placeholder:text-zinc-400 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loadingLesson || !topicInput.trim()}
            className="bg-white/10 hover:bg-zinc-800 text-white text-sm font-bold px-5 py-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-600/20"
          >
            {loadingLesson ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Generating...
              </span>
            ) : "Generate Lesson"}
          </button>
        </form>

        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span>{user?.name}</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">

        {/* LEFT PANE: Lesson + Chat */}
        <div className="w-[500px] shrink-0 border-r border-white/10 flex flex-col bg-white/5">

          {/* Tabs */}
          <div className="flex bg-white/5 backdrop-blur-lg border-b border-white/10 shrink-0">
            <button
              onClick={() => setLeftTab("lesson")}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${leftTab === "lesson" ? "bg-white/10/10 text-white border-b-2 border-zinc-900" : "text-zinc-400 hover:bg-white/20/10 hover:text-zinc-300"}`}
            >
              📚 Lesson
            </button>
            <button
              onClick={() => setLeftTab("chat")}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${leftTab === "chat" ? "bg-white/10/10 text-white border-b-2 border-zinc-900" : "text-zinc-400 hover:bg-white/20/10 hover:text-zinc-300"}`}
            >
              💬 Ask AI
            </button>
          </div>

          {/* Lesson Tab */}
          {leftTab === "lesson" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {!lesson && !loadingLesson ? (
                // Empty state
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-20 h-20 bg-white/10/10 border border-zinc-900/20 rounded-3xl flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">Ready to learn?</h2>
                  <p className="text-zinc-400 text-sm max-w-xs">Type any programming topic above and I'll generate a complete, interactive lesson for you.</p>
                  <div className="mt-6 flex flex-wrap gap-2 justify-center">
                    {["React Hooks", "Binary Search", "SQL Joins", "REST APIs", "Python OOP"].map(s => (
                      <button
                        key={s}
                        onClick={() => { setTopicInput(s); }}
                        className="text-xs bg-white/5 backdrop-blur-lg border border-white/10 text-zinc-400 px-3 py-1.5 rounded-lg hover:border-zinc-900/30 hover:text-white transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  {lessonError && (
                    <div className="mt-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl max-w-md">
                      <p className="text-rose-600 text-sm font-bold flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Error Generating Lesson
                      </p>
                      <p className="text-rose-600/80 text-xs mt-2 text-left">{lessonError}</p>
                    </div>
                  )}
                </div>
              ) : loadingLesson ? (
                // Loading state
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-white/10 border-t-violet-500 rounded-full animate-spin"></div>
                  </div>
                  <p className="text-white font-bold mt-6 text-sm">Generating your lesson...</p>
                  <p className="text-zinc-400 text-xs mt-2">This may take a few seconds</p>
                </div>
              ) : (
                // Lesson content
                <div className="flex-1 overflow-y-auto">
                  {/* Section Tabs */}
                  <div className="flex overflow-x-auto border-b border-white/10 bg-white/5 shrink-0 scrollbar-hide">
                    {lesson.sections.map((section, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSectionClick(idx)}
                        className={`px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-colors ${activeSection === idx ? "border-zinc-900 text-white bg-violet-500/10" : "border-transparent text-zinc-400 hover:text-zinc-300 hover:bg-white/20/10"}`}
                      >
                        {idx + 1}. {section.heading?.length > 20 ? section.heading.substring(0, 20) + "..." : section.heading}
                      </button>
                    ))}
                  </div>

                  {/* Active Section Content */}
                  {lesson.sections[activeSection] && (
                    <div className="p-5 space-y-5">
                      <h3 className="text-lg font-extrabold text-white tracking-tight">{lesson.sections[activeSection].heading}</h3>

                      {/* Explanation */}
                      <div className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">
                        {lesson.sections[activeSection].explanation}
                      </div>

                      {/* Code Example */}
                      {lesson.sections[activeSection].codeExample && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Code Example</span>
                            <button
                              onClick={loadCodeExample}
                              className="text-[10px] text-white hover:text-zinc-200 font-bold uppercase tracking-wider"
                            >
                              Load in Editor →
                            </button>
                          </div>
                          <pre className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-mono text-emerald-700 overflow-x-auto whitespace-pre-wrap">
                            {lesson.sections[activeSection].codeExample}
                          </pre>
                        </div>
                      )}

                      {/* Exercise */}
                      {lesson.sections[activeSection].exercise && (
                        <div className="bg-white/10/5 border border-zinc-900/20 rounded-2xl p-5 space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-white text-lg">🏋️</span>
                            <span className="text-sm font-bold text-white uppercase tracking-wider">Exercise</span>
                          </div>
                          <p className="text-sm text-zinc-300 leading-relaxed">
                            {lesson.sections[activeSection].exercise.instructions}
                          </p>
                          {lesson.sections[activeSection].exercise.hint && (
                            <details className="text-xs text-zinc-400">
                              <summary className="cursor-pointer hover:text-white font-bold">💡 Show Hint</summary>
                              <p className="mt-2 text-zinc-400 pl-4 border-l-2 border-zinc-900/30">{lesson.sections[activeSection].exercise.hint}</p>
                            </details>
                          )}
                          <button
                            onClick={() => {
                              if (lesson.sections[activeSection].exercise.starterCode) {
                                setEditorCode(lesson.sections[activeSection].exercise.starterCode);
                              }
                            }}
                            className="text-xs bg-white/10 hover:bg-zinc-800 text-white px-4 py-2 rounded-lg font-bold transition-colors"
                          >
                            Load Exercise in Editor
                          </button>
                        </div>
                      )}

                      {/* Navigation */}
                      <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <button
                          onClick={() => handleSectionClick(Math.max(0, activeSection - 1))}
                          disabled={activeSection === 0}
                          className="text-xs text-zinc-400 hover:text-white disabled:opacity-30 font-bold"
                        >
                          ← Previous
                        </button>
                        <span className="text-[10px] text-zinc-400">{activeSection + 1} / {lesson.sections.length}</span>
                        <button
                          onClick={() => handleSectionClick(Math.min(lesson.sections.length - 1, activeSection + 1))}
                          disabled={activeSection === lesson.sections.length - 1}
                          className="text-xs text-white hover:text-zinc-200 disabled:opacity-30 font-bold"
                        >
                          Next →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Chat Tab */}
          {leftTab === "chat" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.length === 0 && (
                  <div className="text-center text-zinc-400 text-xs italic mt-8">
                    {currentTopic
                      ? `Ask me anything about "${currentTopic}"! I can also review your code.`
                      : "Generate a lesson first, then ask me questions here!"}
                  </div>
                )}
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                    <span className="text-[9px] text-zinc-400 mb-1 font-bold uppercase tracking-wider">
                      {msg.role === "user" ? "You" : "AI Tutor"}
                    </span>
                    <div className={`px-4 py-3 rounded-2xl text-sm max-w-[90%] break-words leading-relaxed ${msg.role === "user"
                        ? "bg-white text-zinc-900 font-bold hover:scale-105 rounded-br-md"
                        : "bg-white/5 backdrop-blur-lg border border-white/10 text-zinc-300 rounded-bl-md"
                      }`}
                    >
                      {msg.role === "assistant" ? renderText(msg.content) : msg.content}
                    </div>
                  </div>
                ))}
                {loadingChat && (
                  <div className="flex items-start">
                    <div className="bg-white/5 backdrop-blur-lg border border-white/10 px-4 py-3 rounded-2xl rounded-bl-md">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                        <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                        <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleChatSubmit} className="p-3 border-t border-white/10 bg-white/5 backdrop-blur-lg flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={currentTopic ? `Ask about ${currentTopic}...` : "Generate a lesson first..."}
                  disabled={!currentTopic}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-white disabled:opacity-50 placeholder:text-zinc-400"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || loadingChat || !currentTopic}
                  className="bg-white text-zinc-900 font-bold hover:scale-105 px-4 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 transition-all"
                >
                  Send
                </button>
              </form>
            </div>
          )}
        </div>

        {/* RIGHT PANE: Code Editor + Output */}
        <div className="flex-1 flex flex-col bg-white/5 backdrop-blur-lg">

          {/* Editor Header */}
          <div className="h-12 bg-white/5 backdrop-blur-lg border-b border-white/10 flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-3">
              <select
                value={language}
                onChange={handleLanguageChange}
                disabled={!!lesson}
                title={lesson ? "Language is locked during an active lesson." : "Select language"}
                className="bg-white/5 border border-white/10 text-zinc-200 text-xs rounded-lg px-3 py-1.5 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {Object.keys(LANGUAGES).map(key => (
                  <option key={key} value={key}>{LANGUAGES[key].name}</option>
                ))}
              </select>
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider">
                {lesson ? "Locked for Lesson" : "Editor"}
              </span>
            </div>

            <button
              onClick={handleRunCode}
              disabled={isExecuting}
              className="bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold px-5 py-2 rounded-lg disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-sm"
            >
              {isExecuting ? (
                <>
                  <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Running...
                </>
              ) : "▶ Run Code"}
            </button>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              language={LANGUAGES[language]?.monaco || language}
              value={editorCode}
              onChange={(val) => setEditorCode(val || "")}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                padding: { top: 16 },
                automaticLayout: true,
                wordWrap: "on",
                scrollBeyondLastLine: false,
              }}
            />
          </div>

          {/* Output Panel */}
          <div className="h-[200px] min-h-[150px] bg-white/5 border-t border-white/10 flex flex-col shrink-0">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider p-3 border-b border-white/10 bg-white/5 backdrop-blur-lg flex items-center justify-between">
              <span>Output</span>
              {executionOutput && (
                <span className={`text-[9px] px-2 py-0.5 rounded-full ${executionOutput.statusCode === 200 ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20" : "bg-rose-500/10 text-rose-600 border border-rose-500/20"}`}>
                  {executionOutput.statusCode === 200 ? "Success" : "Error"}
                </span>
              )}
            </div>
            <div className="flex-1 p-0 overflow-hidden relative">
              {frontendHtml ? (
                <iframe 
                  srcDoc={frontendHtml} 
                  title="Frontend Execution"
                  className="w-full h-full border-none bg-white/5 backdrop-blur-lg"
                  sandbox="allow-scripts"
                />
              ) : executionOutput ? (
                <div className="p-3 h-full overflow-y-auto">
                  <pre className={`text-sm font-mono whitespace-pre-wrap ${executionOutput.statusCode !== 200 ? "text-rose-600" : "text-zinc-300"}`}>
                    {executionOutput.output || "No output"}
                  </pre>
                </div>
              ) : (
                <div className="p-3 text-zinc-400 text-xs italic">Run your code to see output here...</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
