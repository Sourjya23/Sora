import React, { useState, useMemo } from "react";
import { ExternalLink, Search, Sparkles } from "lucide-react";
import problemsData from "../data/whatsNewProblems.json";

const TOPIC_CATEGORIES = [
  { id: "all", label: "All Topics" },
  { id: "Programming Basics", label: "Programming Basics" },
  { id: "Control Flow & Loops", label: "Control Flow & Loops" },
  { id: "Math & Number Handling", label: "Math & Numbers" },
  { id: "Bits, Functions & Recursion", label: "Bits & Recursion" },
  { id: "Arrays", label: "Arrays" },
  { id: "Searching & Sorting", label: "Searching & Sorting" },
  { id: "Strings", label: "Strings" },
  { id: "Frequency & Hashing", label: "Frequency & Hashing" },
  { id: "Matrices & 2D Arrays", label: "Matrices & 2D" },
];

export default function WhatsNewSection() {
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Filter problems based on topic and search query
  const filteredProblems = useMemo(() => {
    return problemsData.filter((p) => {
      // Normalize topics (handle "Strings / Characters" as "Strings", Array ops as Arrays)
      const matchesTopic =
        selectedTopic === "all" ||
        p.topic === selectedTopic ||
        (selectedTopic === "Strings" && p.topic.includes("String")) ||
        (selectedTopic === "Arrays" && p.topic.includes("Array"));

      const query = searchQuery.trim().toLowerCase();
      if (!query) return matchesTopic;

      const matchesSearch =
        p.title.toLowerCase().includes(query) ||
        p.subtopic.toLowerCase().includes(query) ||
        p.topic.toLowerCase().includes(query) ||
        p.platform.toLowerCase().includes(query) ||
        p.statement.toLowerCase().includes(query) ||
        p.tags.some((t) => t.toLowerCase().includes(query));

      return matchesTopic && matchesSearch;
    });
  }, [selectedTopic, searchQuery]);

  // Reset to page 1 on filter/search change
  const totalPages = Math.ceil(filteredProblems.length / pageSize) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const paginatedProblems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredProblems.slice(start, start + pageSize);
  }, [filteredProblems, safePage, pageSize]);

  const handleTopicChange = (topicId) => {
    setSelectedTopic(topicId);
    setCurrentPage(1);
  };

  const getPlatformBadge = (platform) => {
    switch (platform.toLowerCase()) {
      case "leetcode":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "geeksforgeeks":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "code360":
        return "bg-sky-500/10 text-sky-400 border-sky-500/20";
      default:
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    }
  };

  const getDifficultyBadge = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case "beginner":
      case "basic":
      case "easy":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "medium":
        return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      case "hard":
        return "text-rose-400 bg-rose-500/10 border-rose-500/20";
      default:
        return "text-zinc-400 bg-white/[0.04] border-white/10";
    }
  };

  return (
    <section className="bg-[#041a2a]/60 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md mb-8">
      {/* Header */}
      <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h3
              className="font-normal text-2xl text-white tracking-tight"
              style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
            >
              What's New
            </h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 ml-2">
              {problemsData.length} Problems
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Curated DSA drills and fundamentals practice listed by topic.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search problems or tags..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400/50 transition-colors"
          />
        </div>
      </div>

      {/* Topic Filter Pills */}
      <div className="px-6 py-3 border-b border-white/5 bg-white/[0.01] flex items-center gap-2 overflow-x-auto no-scrollbar">
        {TOPIC_CATEGORIES.map((cat) => {
          const isActive = selectedTopic === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => handleTopicChange(cat.id)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? "bg-white text-[#041826] shadow-sm"
                  : "bg-white/[0.03] hover:bg-white/[0.08] text-zinc-400 hover:text-white border border-white/5"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Problem List */}
      <div className="divide-y divide-white/5">
        {paginatedProblems.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 text-xs">
            No questions found matching the selected filter.
          </div>
        ) : (
          paginatedProblems.map((prob) => (
            <div
              key={prob.id}
              className="p-5 flex flex-col md:flex-row md:items-start justify-between gap-4 hover:bg-white/[0.02] transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-[11px] font-mono text-zinc-500">
                    #{prob.seq}
                  </span>
                  <span
                    className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded border ${getPlatformBadge(
                      prob.platform
                    )}`}
                  >
                    {prob.platform}
                  </span>
                  {prob.difficulty && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded border ${getDifficultyBadge(
                        prob.difficulty
                      )}`}
                    >
                      {prob.difficulty}
                    </span>
                  )}
                  <span className="text-[11px] text-zinc-400 font-medium">
                    {prob.topic} &middot; {prob.subtopic}
                  </span>
                </div>

                <h4 className="text-sm font-medium text-white group-hover:text-cyan-300 transition-colors">
                  <a
                    href={prob.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 hover:underline"
                  >
                    {prob.title}
                    <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                  </a>
                </h4>

                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  {prob.statement}
                </p>

                {/* Tags */}
                {prob.tags && prob.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                    {prob.tags.slice(0, 5).map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] text-zinc-400 bg-white/[0.03] border border-white/5 px-2 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {prob.tags.length > 5 && (
                      <span className="text-[10px] text-zinc-500">
                        +{prob.tags.length - 5}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="shrink-0 self-start md:self-center">
                <a
                  href={prob.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-white/[0.06] hover:bg-white text-zinc-200 hover:text-[#041826] border border-white/10 hover:border-white text-xs font-medium px-3.5 py-1.5 rounded-xl transition-all"
                >
                  <span>Solve</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-white/10 bg-white/[0.01] flex items-center justify-between text-xs text-zinc-400">
          <span>
            Showing {(safePage - 1) * pageSize + 1}–
            {Math.min(safePage * pageSize, filteredProblems.length)} of{" "}
            {filteredProblems.length} questions
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="px-3 py-1 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] disabled:opacity-40 disabled:cursor-not-allowed text-zinc-300 transition-colors"
            >
              Previous
            </button>
            <span className="font-mono text-white px-2">
              {safePage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="px-3 py-1 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] disabled:opacity-40 disabled:cursor-not-allowed text-zinc-300 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
