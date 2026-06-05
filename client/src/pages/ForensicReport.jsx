import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/axios";

function ForensicReport() {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const headers = { Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}` };
        const res = await API.get(`/meeting/details/${meetingId}`, { headers });
        setMeeting(res.data);
      } catch (err) {
        console.error("Failed to fetch forensic report", err);
        setError("Failed to fetch forensic report.");
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [meetingId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] text-gray-900 flex items-center justify-center font-serif">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 italic">Loading analysis...</p>
        </div>
      </div>
    );
  }

  if (error || !meeting || !meeting.forensicReport) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] text-gray-900 flex items-center justify-center font-serif">
        <div className="max-w-md w-full text-center px-4">
          <h2 className="text-2xl font-bold font-sans mb-4">Report Unavailable</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">The forensic report for this meeting could not be loaded or is not yet available. It may still be processing in the background.</p>
          <button onClick={() => navigate(-1)} className="text-blue-600 hover:text-blue-800 font-sans font-medium transition-colors">
            ← Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const selectedReport = meeting.forensicReport;

  // Render Verdict badge based on Medium style (clean, minimal borders)
  const renderVerdictBadge = (recommendation) => {
    const rec = recommendation?.toLowerCase() || "pending";
    if (rec === "offer") {
      return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-sans font-medium">Offer</span>;
    } else if (rec === "reject") {
      return <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-sans font-medium">Reject</span>;
    }
    return <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-sans font-medium">Borderline</span>;
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-gray-900 flex justify-center p-4 sm:p-8 selection:bg-blue-100">
      <div className="w-full max-w-3xl bg-white shadow-sm border border-gray-100 rounded-xl px-6 py-10 sm:px-12 sm:py-16">
        
        {/* Navigation / Meta */}
        <div className="flex items-center justify-between mb-12 font-sans">
          <button 
            onClick={() => navigate(-1)}
            className="text-gray-500 hover:text-gray-900 flex items-center gap-2 text-sm transition-colors"
          >
            <span>←</span> Back to Dashboard
          </button>
          <span className="text-xs tracking-widest text-gray-400 uppercase font-semibold">
            Job ID: {meeting.jobId || "N/A"}
          </span>
        </div>

        {/* Header */}
        <header className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold font-sans tracking-tight text-gray-900 mb-4 leading-tight">
            AI Forensic Analysis
          </h1>
          <p className="text-xl text-gray-500 font-serif leading-relaxed">
            Automated session evaluation for <strong className="font-semibold text-gray-800">{meeting.candidate?.name || "Candidate"}</strong>
          </p>
          <div className="mt-6 flex items-center gap-4 border-t border-gray-100 pt-6">
            <div className="font-sans text-sm font-semibold uppercase tracking-wider text-gray-500">Verdict</div>
            {renderVerdictBadge(selectedReport.recommendation)}
          </div>
        </header>

        {/* Executive Summary */}
        <section className="mb-14">
          <p className="text-lg sm:text-xl font-serif text-gray-800 leading-relaxed whitespace-pre-wrap first-letter:text-5xl first-letter:font-bold first-letter:mr-1 first-letter:float-left first-letter:font-sans">
            {selectedReport.detailedSummary || "No detailed summary was generated for this session."}
          </p>
        </section>

        <hr className="border-gray-200 mb-10 w-16 mx-auto" />

        {/* Complexity Metrics */}
        <section className="mb-14 grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div>
            <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Time Complexity</h3>
            <p className="font-mono text-3xl font-medium text-gray-900">{selectedReport.timeComplexity || "N/A"}</p>
          </div>
          <div>
            <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Space Complexity</h3>
            <p className="font-mono text-3xl font-medium text-gray-900">{selectedReport.spaceComplexity || "N/A"}</p>
          </div>
        </section>

        {/* Code Correctness */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold font-sans text-gray-900 mb-4">Code Correctness & Quality</h2>
          <div className="pl-4 border-l-4 border-gray-200">
            <p className="font-serif text-gray-700 leading-relaxed text-lg">
              {selectedReport.codeCorrectness || "No correctness analysis provided."}
            </p>
          </div>
        </section>

        <hr className="border-gray-200 mb-10 w-16 mx-auto" />

        {/* Behavioral Analysis */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold font-sans text-gray-900 mb-8">Behavioral Flags</h2>

          <div className="space-y-10">
            
            {/* Screen Share */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="font-sans font-semibold text-gray-900 text-lg">Screen Sharing Policy</h3>
                {selectedReport.screenSharedEntirely ? (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-sans uppercase tracking-wider">Compliant</span>
                ) : (
                  <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded font-sans uppercase tracking-wider">Violation</span>
                )}
              </div>
              <p className="font-serif text-gray-600">
                {selectedReport.screenSharedEntirely 
                  ? "The candidate shared their screen for the entire duration of the interview."
                  : "The candidate failed to share their screen for portions of the interview, posing a significant integrity risk."}
              </p>
            </div>

            {/* Tab Switches */}
            <div>
              <h3 className="font-sans font-semibold text-gray-900 text-lg mb-4 flex items-center gap-2">
                Tab Switches
                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full font-normal">
                  {selectedReport.tabChanges?.length || 0}
                </span>
              </h3>
              {selectedReport.tabChanges && selectedReport.tabChanges.length > 0 ? (
                <ul className="space-y-3 font-serif text-gray-700">
                  {selectedReport.tabChanges.map((change, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="text-gray-300 mt-1.5 text-xs">■</span>
                      <span className="leading-relaxed">{change}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="font-serif text-gray-500 italic">No tab switching detected.</p>
              )}
            </div>

            {/* Paste Events */}
            <div>
              <h3 className="font-sans font-semibold text-gray-900 text-lg mb-4 flex items-center gap-2">
                Pasted Code Chunks
                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full font-normal">
                  {selectedReport.copyPasted?.length || 0}
                </span>
              </h3>
              {selectedReport.copyPasted && selectedReport.copyPasted.length > 0 ? (
                <ul className="space-y-3 font-serif text-gray-700">
                  {selectedReport.copyPasted.map((paste, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="text-gray-300 mt-1.5 text-xs">■</span>
                      <span className="leading-relaxed">{paste}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="font-serif text-gray-500 italic">No suspicious pasting detected.</p>
              )}
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}

export default ForensicReport;
