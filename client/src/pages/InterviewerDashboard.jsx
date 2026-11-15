import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import socket from "../socket/socket";
import WhatsNewSection from "../components/WhatsNewSection";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  Star,
  FileText,
  Video,
  ExternalLink,
  X,
  Send,
  Award,
  ShieldCheck,
  TrendingUp,
  Brain,
  Check,
} from "lucide-react";

function InterviewerDashboard() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Interviewer");
  const [tickets, setTickets] = useState([]);
  const [completedMeetings, setCompletedMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("tickets");
  const [joinNotification, setJoinNotification] = useState(null);

  // Schedule Modal State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [scheduledTime, setScheduledTime] = useState("");
  const [keyPassword, setKeyPassword] = useState("");

  // Transparent Decision Hub Modal State
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [selectedMeetingForDecision, setSelectedMeetingForDecision] = useState(null);
  const [mentorRating, setMentorRating] = useState(5);
  const [mentorVerdict, setMentorVerdict] = useState("Hire");
  const [mentorNotes, setMentorNotes] = useState("");
  const [submittingDecision, setSubmittingDecision] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}` };
      const [ticketsRes, completedRes] = await Promise.all([
        API.get("/interview/tickets", { headers }),
        API.get("/meeting/completed", { headers })
      ]);
      setTickets(ticketsRes.data);
      setCompletedMeetings(completedRes.data);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserName(user.name);
    }
    
    fetchData();

    const handleJoinNotification = (data) => {
      setJoinNotification(data);
    };
    socket.on("candidate-joined-notification", handleJoinNotification);

    return () => {
      socket.off("candidate-joined-notification", handleJoinNotification);
    };
  }, []);

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let pass = "PASS-";
    for (let i = 0; i < 4; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const handleOpenScheduleModal = (ticket) => {
    setSelectedTicket(ticket);
    if (ticket.preferredSlotStart) {
      const date = new Date(ticket.preferredSlotStart);
      const localStr = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setScheduledTime(localStr);
    } else {
      setScheduledTime("");
    }
    setKeyPassword(generatePassword());
    setShowScheduleModal(true);
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!scheduledTime) {
      alert("Please confirm a scheduled date and time.");
      return;
    }
    if (!keyPassword.trim()) {
      alert("Key password is required.");
      return;
    }

    try {
      await API.post(
        "/meeting/schedule",
        {
          ticketId: selectedTicket._id,
          scheduledTime: new Date(scheduledTime),
          keyPassword: keyPassword
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}`
          }
        }
      );
      alert("Interview scheduled successfully! Notification sent to the candidate.");
      setShowScheduleModal(false);
      fetchData();
    } catch (err) {
      console.error("Failed to schedule meeting:", err);
      alert("Failed to schedule: " + (err.response?.data?.message || err.message));
    }
  };

  const openDecisionModal = (meeting) => {
    setSelectedMeetingForDecision(meeting);
    setMentorRating(meeting.interviewerFeedback?.rating || 4);
    setMentorVerdict(meeting.interviewerFeedback?.verdict || meeting.aiVerdict?.verdict || "Hire");
    setMentorNotes(meeting.interviewerFeedback?.notes || "");
    setShowDecisionModal(true);
  };

  const handleFinalizeDecision = async (status) => {
    if (!selectedMeetingForDecision) return;
    setSubmittingDecision(true);
    try {
      await API.post(
        `/meeting/review/${selectedMeetingForDecision.meetingId}`,
        {
          status, // "approved" or "rejected"
          rating: mentorRating,
          verdict: mentorVerdict,
          notes: mentorNotes,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}`,
          },
        }
      );
      alert(
        status === "approved"
          ? "Candidate officially selected! Custom offer notification dispatched by Sora HR Agent."
          : "Candidate not selected. Personalized constructive feedback dispatched by Sora HR Agent."
      );
      setShowDecisionModal(false);
      fetchData();
    } catch (err) {
      console.error("Failed to submit decision:", err);
      alert("Failed to submit decision: " + (err.response?.data?.message || err.message));
    } finally {
      setSubmittingDecision(false);
    }
  };

  const handleReviewCandidate = async (meetingId, status) => {
    try {
      await API.post(`/meeting/review/${meetingId}`, { status }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}`
        }
      });
      alert(`Candidate marked as ${status}. Custom email dispatched by HR Agent.`);
      fetchData();
    } catch (err) {
      console.error(`Failed to ${status} candidate:`, err);
      alert("Failed to review candidate.");
    }
  };

  const handleDismissTicket = async (ticketId) => {
    if (confirm("Dismiss this ticket from your board?")) {
      try {
        await API.post(`/interview/dismiss/${ticketId}`, {}, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}`
          }
        });
        fetchData();
      } catch (err) {
        console.error("Failed to dismiss ticket:", err);
        alert("Failed to dismiss: " + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#041826] text-white flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-white/10 bg-[#041826]/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate("/")}>
            <span
              style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
              className="text-2xl font-normal text-white tracking-tight"
            >
              Sora
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs px-3 py-1 rounded-full border border-white/10 bg-white/[0.04] text-zinc-300">
              Interviewer
            </span>
            <button
              onClick={handleSignOut}
              className="text-xs bg-white/[0.06] hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white px-3.5 py-1.5 rounded-full transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Real-time Join Notification */}
      {joinNotification && (
        <div className="bg-emerald-950/80 border-b border-emerald-500/20 text-white px-6 py-3 flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <p className="text-xs font-medium text-emerald-200">
              Candidate <strong>{joinNotification.candidateName}</strong> has joined the meeting room.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                const id = joinNotification.meetingId;
                setJoinNotification(null);
                navigate(`/meeting/${id}`);
              }}
              className="bg-white text-[#041826] hover:bg-zinc-200 font-medium px-3 py-1.5 rounded-lg text-xs transition-all"
            >
              Enter Room
            </button>
            <button
              onClick={() => setJoinNotification(null)}
              className="text-zinc-400 hover:text-white text-xs px-2 py-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Welcome Bar */}
      <div className="border-b border-white/10 bg-white/[0.01] py-6 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-normal tracking-tight text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
              Welcome, {userName}
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">Manage evaluation slots, schedule sessions, and conduct live rounds.</p>
          </div>

          <div className="flex bg-white/[0.04] p-1 rounded-xl border border-white/10 self-start md:self-auto">
            <button
              onClick={() => setActiveTab("tickets")}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "tickets" ? "bg-white text-[#041826]" : "text-zinc-400 hover:text-white"
              }`}
            >
              Assigned Tickets ({tickets.filter(t => t.status !== "dismissed").length})
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "completed" ? "bg-white text-[#041826]" : "text-zinc-400 hover:text-white"
              }`}
            >
              Completed ({completedMeetings.length})
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {activeTab === "tickets" && (
          <div className="bg-[#041a2a]/60 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md">
            <div className="p-6 border-b border-white/10">
              <h3 className="font-medium text-lg text-white">Evaluation Queue</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Candidate interview requests pending schedule or live</p>
            </div>

            <div className="divide-y divide-white/5">
              {loading ? (
                <div className="p-8 text-center text-zinc-500 text-xs">Loading queue...</div>
              ) : tickets.filter(t => t.status !== "dismissed").length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-xs">
                  No evaluation tickets assigned currently.
                </div>
              ) : (
                tickets.filter(t => t.status !== "dismissed").map((ticket) => (
                  <div key={ticket._id} className="p-6 flex flex-col gap-4 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-start justify-between flex-wrap gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-mono px-2 py-0.5 bg-white/[0.05] border border-white/10 rounded text-zinc-300">
                            {ticket.jobId || "Round"}
                          </span>
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {ticket.status.toUpperCase()}
                          </span>
                        </div>
                        <h4 className="font-medium text-sm text-white mt-1.5">
                          Candidate: {ticket.candidateId?.name} ({ticket.candidateId?.email})
                        </h4>
                      </div>

                      <div className="flex items-center gap-2">
                        {ticket.status === "scheduled" ? (
                          <>
                            <button
                              onClick={() => navigate(`/meeting/${ticket.meetingId}`)}
                              className="bg-white text-[#041826] hover:bg-zinc-200 font-medium px-4 py-2 rounded-xl text-xs transition-all"
                            >
                              Join Room
                            </button>
                            <button
                              onClick={() => handleDismissTicket(ticket._id)}
                              className="text-xs bg-white/[0.05] hover:bg-rose-500/20 text-zinc-400 hover:text-rose-300 border border-white/10 px-3 py-2 rounded-xl transition-all"
                              title="Dismiss"
                            >
                              ✕
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              onClick={() => handleOpenScheduleModal(ticket)}
                              className="bg-white text-[#041826] hover:bg-zinc-200 font-medium px-4 py-2 rounded-xl text-xs transition-all"
                            >
                              Schedule Session
                            </button>
                            <button
                              onClick={() => handleDismissTicket(ticket._id)}
                              className="text-xs bg-white/[0.05] hover:bg-rose-500/20 text-zinc-400 hover:text-rose-300 border border-white/10 px-3 py-2 rounded-xl transition-all"
                              title="Dismiss"
                            >
                              Dismiss
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-xl text-xs">
                      <div>
                        <span className="text-zinc-500 uppercase tracking-wider text-[10px] block mb-1">Candidate Preferred Slot</span>
                        <p className="text-zinc-300">
                          {ticket.preferredSlotStart ? new Date(ticket.preferredSlotStart).toLocaleString() : "Flexible"} &rarr; {ticket.preferredSlotEnd ? new Date(ticket.preferredSlotEnd).toLocaleString() : ""}
                        </p>
                      </div>

                      <div>
                        <span className="text-zinc-500 uppercase tracking-wider text-[10px] block mb-1">Resume</span>
                        {ticket.resumeUrl ? (
                          <a 
                            href={ticket.resumeUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-zinc-200 hover:underline font-medium"
                          >
                            View Attached Resume &rarr;
                          </a>
                        ) : (
                          <span className="text-zinc-500">None attached</span>
                        )}
                      </div>

                      {ticket.jobDescription && (
                        <div className="md:col-span-2 pt-2 border-t border-white/5">
                          <span className="text-zinc-500 uppercase tracking-wider text-[10px] block mb-1">Job Description Excerpt</span>
                          <p className="text-zinc-400 line-clamp-2">{ticket.jobDescription}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "completed" && (
          <div className="bg-[#041a2a]/60 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md">
            <div className="p-6 border-b border-white/10">
              <h3 className="font-medium text-lg text-white">Completed Rounds</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Review recordings, AI forensic analysis, and mark selection status</p>
            </div>

            <div className="divide-y divide-white/5">
              {loading ? (
                <div className="p-8 text-center text-zinc-500 text-xs">Loading sessions...</div>
              ) : completedMeetings.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-xs">
                  No completed evaluations found.
                </div>
              ) : (
                completedMeetings.map((meeting) => (
                  <div key={meeting._id} className="p-6 flex flex-col gap-4 hover:bg-white/[0.02] transition-colors border-b border-white/5 last:border-b-0">
                    <div className="flex items-start justify-between flex-wrap gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 rounded">
                            {meeting.jobId || "N/A"}
                          </span>
                          <span className="text-xs text-zinc-400">
                            {new Date(meeting.scheduledTime).toLocaleString()}
                          </span>
                          {meeting.recordingUrl && (
                            <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                              <Video className="w-3 h-3" /> Video Stored
                            </span>
                          )}
                        </div>
                        <h4 className="font-medium text-sm text-white mt-1.5 flex items-center gap-2">
                          <span>Assessment with {meeting.candidateId?.name || "Candidate"}</span>
                          <span className="text-xs text-zinc-400 font-normal">({meeting.candidateId?.email})</span>
                        </h4>

                        {/* AI Synthesis Verdict Pill */}
                        {meeting.aiVerdict?.verdict ? (
                          <div className="mt-2.5 flex items-center flex-wrap gap-2">
                            <span
                              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
                                meeting.aiVerdict.verdict === "Strong Hire" || meeting.aiVerdict.verdict === "Hire"
                                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                                  : meeting.aiVerdict.verdict === "Leaning No Hire"
                                  ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                                  : "bg-rose-500/15 border-rose-500/30 text-rose-300"
                              }`}
                            >
                              <Brain className="w-3 h-3" />
                              <span>AI Verdict: {meeting.aiVerdict.verdict} ({meeting.aiVerdict.confidenceScore || 88}%)</span>
                            </span>
                            <span className="text-xs text-zinc-400">
                              Tech: <strong className="text-white">{meeting.aiVerdict.technicalScore || 75}/100</strong> &bull; Integrity: <strong className="text-white">{meeting.aiVerdict.integrityScore || 95}/100</strong>
                            </span>
                          </div>
                        ) : meeting.forensicReport?.isProcessing ? (
                          <span className="text-[11px] text-cyan-300 font-mono mt-1.5 inline-block animate-pulse">
                            AI Forensic Analysis & Verdict in progress...
                          </span>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openDecisionModal(meeting)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                            meeting.status === "completed"
                              ? "bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-[#02101b] shadow-md shadow-cyan-950/40"
                              : "bg-white/[0.08] hover:bg-white/15 text-white border border-white/15"
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{meeting.status === "completed" ? "Review & Decision Hub" : "Decision Summary"}</span>
                        </button>

                        {meeting.forensicReport && !meeting.forensicReport.isProcessing && (
                          <button
                            onClick={() => navigate(`/report/${meeting.meetingId}`)}
                            className="bg-white/[0.06] hover:bg-white/10 text-white border border-white/10 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all"
                          >
                            Forensics &rarr;
                          </button>
                        )}
                        {meeting.recordingUrl && (
                          <a 
                            href={meeting.recordingUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="bg-white/[0.06] hover:bg-white/10 text-zinc-300 hover:text-white px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all border border-white/10 flex items-center gap-1"
                          >
                            <Video className="w-3 h-3" />
                            <span>Recording</span>
                          </a>
                        )}
                      </div>
                    </div>
                    
                    {meeting.status === "approved" && (
                      <div className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Candidate Selected &bull; Personalized Offer Email Dispatched by Sora HR Agent</span>
                      </div>
                    )}

                    {meeting.status === "rejected" && (
                      <div className="text-xs text-rose-400 font-medium flex items-center gap-1.5">
                        <XCircle className="w-4 h-4 text-rose-400" />
                        <span>Candidate Not Selected &bull; Constructive Growth Feedback Dispatched by Sora HR Agent</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* What's New Section */}
        <div className="mt-8">
          <WhatsNewSection />
        </div>
      </main>

      {/* Schedule Modal */}
      {showScheduleModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#041a2a] border border-white/10 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            <button 
              onClick={() => setShowScheduleModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white text-base"
            >
              ✕
            </button>
            <h3 className="text-xl font-normal text-white mb-1" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
              Confirm Schedule
            </h3>
            <p className="text-xs text-zinc-400 mb-6">Set confirmed time and entry password key for the room.</p>

            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div className="bg-white/[0.02] p-3.5 border border-white/10 rounded-xl text-xs space-y-1">
                <p className="text-zinc-400">Candidate: <strong className="text-white">{selectedTicket.candidateId?.name}</strong></p>
                <p className="text-zinc-400">Job: <strong className="text-white">{selectedTicket.jobId}</strong></p>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider">Scheduled Time</label>
                <input
                  type="datetime-local"
                  required
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-white/40"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider">Key Password</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={keyPassword}
                    onChange={(e) => setKeyPassword(e.target.value.toUpperCase())}
                    className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-white/40 font-mono tracking-wider font-bold"
                    placeholder="PASS-XXXX"
                  />
                  <button
                    type="button"
                    onClick={() => setKeyPassword(generatePassword())}
                    className="bg-white/[0.06] hover:bg-white/10 text-xs px-3 rounded-xl border border-white/10 text-zinc-300"
                  >
                    Regen
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-white hover:bg-zinc-200 text-[#041826] font-medium py-3 px-4 rounded-xl text-xs transition-all shadow-lg mt-2"
              >
                Confirm & Lock Slot
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Transparent Decision Hub Modal */}
      {showDecisionModal && selectedMeetingForDecision && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-[#082235] border border-cyan-500/30 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-[0_25px_70px_rgba(0,0,0,0.8)] relative max-h-[90vh] overflow-y-auto font-sans">
            <button 
              onClick={() => setShowDecisionModal(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-2 mb-1.5">
              <img src="/Sora_Favicon.jpg" alt="Sora" className="w-6 h-6 rounded-md object-cover shadow" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-400">
                Sora HR Workflow Agent &bull; Decision Center
              </span>
            </div>
            <h3 className="text-2xl font-normal text-white mb-1" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
              Assessment Verdict & Decision
            </h3>
            <p className="text-xs text-cyan-100/70 mb-5">
              Candidate: <strong className="text-white">{selectedMeetingForDecision.candidateId?.name}</strong> ({selectedMeetingForDecision.candidateId?.email}) &bull; Job: <strong className="font-mono text-cyan-300">{selectedMeetingForDecision.jobId}</strong>
            </p>

            {/* 1. AI Synthesis & Verdict Section */}
            <div className="bg-[#051726] border border-cyan-500/20 rounded-2xl p-5 mb-5 shadow-inner">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <span className="text-xs font-semibold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-cyan-400" /> AI Agent Analysis & Recommendation
                </span>
                {selectedMeetingForDecision.aiVerdict?.verdict ? (
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border shadow-sm ${
                    selectedMeetingForDecision.aiVerdict.verdict === "Strong Hire" || selectedMeetingForDecision.aiVerdict.verdict === "Hire"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : selectedMeetingForDecision.aiVerdict.verdict === "Leaning No Hire"
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                  }`}>
                    AI Recommendation: {selectedMeetingForDecision.aiVerdict.verdict} ({selectedMeetingForDecision.aiVerdict.confidenceScore || 88}%)
                  </span>
                ) : (
                  <span className="text-xs text-cyan-300/70 font-mono animate-pulse">Analysis compiling...</span>
                )}
              </div>

              {/* Score Grid */}
              <div className="grid grid-cols-3 gap-3 my-3">
                <div className="bg-[#031320] p-3 rounded-xl border border-cyan-500/15 text-center">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Technical Score</span>
                  <span className="text-lg font-bold text-cyan-300 font-mono">
                    {selectedMeetingForDecision.aiVerdict?.technicalScore || 75}/100
                  </span>
                </div>
                <div className="bg-[#031320] p-3 rounded-xl border border-cyan-500/15 text-center">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Integrity Index</span>
                  <span className="text-lg font-bold text-emerald-400 font-mono">
                    {selectedMeetingForDecision.aiVerdict?.integrityScore || 95}/100
                  </span>
                </div>
                <div className="bg-[#031320] p-3 rounded-xl border border-cyan-500/15 text-center">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Problem Solving</span>
                  <span className="text-lg font-bold text-cyan-300 font-mono">
                    {selectedMeetingForDecision.aiVerdict?.problemSolvingScore || 80}/100
                  </span>
                </div>
              </div>

              <p className="text-xs text-cyan-100/80 leading-relaxed mb-3">
                {selectedMeetingForDecision.aiVerdict?.summary || "Automated evaluation of candidate code correctness, Big-O complexity, and telemetry."}
              </p>

              {selectedMeetingForDecision.aiVerdict?.strengths && selectedMeetingForDecision.aiVerdict.strengths.length > 0 && (
                <div className="mt-2 text-xs">
                  <span className="text-emerald-400 font-medium block mb-1">Key Strengths Identified:</span>
                  <ul className="list-disc pl-4 text-zinc-300 space-y-1">
                    {selectedMeetingForDecision.aiVerdict.strengths.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedMeetingForDecision.aiVerdict?.growthAreas && selectedMeetingForDecision.aiVerdict.growthAreas.length > 0 && (
                <div className="mt-3 text-xs">
                  <span className="text-amber-400 font-medium block mb-1">Constructive Growth Takeaways:</span>
                  <ul className="list-disc pl-4 text-zinc-300 space-y-1">
                    {selectedMeetingForDecision.aiVerdict.growthAreas.map((g, idx) => (
                      <li key={idx}>{g}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Video & Forensic Links */}
              <div className="flex items-center gap-3 mt-4 pt-3 border-t border-cyan-500/15">
                {selectedMeetingForDecision.recordingUrl && (
                  <a 
                    href={selectedMeetingForDecision.recordingUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-xs text-cyan-300 hover:text-white flex items-center gap-1 underline"
                  >
                    <Video className="w-3.5 h-3.5" /> Watch Cloud Video Recording
                  </a>
                )}
                <button
                  onClick={() => navigate(`/report/${selectedMeetingForDecision.meetingId}`)}
                  className="text-xs text-cyan-300 hover:text-white flex items-center gap-1 underline cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" /> Full Forensic Report
                </button>
              </div>
            </div>

            {/* 2. Mentor Evaluation Section */}
            <div className="bg-[#051726] border border-cyan-500/20 rounded-2xl p-5 mb-5 shadow-inner">
              <h4 className="text-xs font-semibold text-cyan-300 uppercase tracking-wider mb-3">
                Mentor Feedback & Consensus
              </h4>

              {selectedMeetingForDecision.status === "completed" ? (
                <div className="space-y-4">
                  {/* Rating Stars */}
                  <div>
                    <label className="block text-xs text-zinc-300 mb-1.5">Mentor Rating</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setMentorRating(star)}
                          className="p-1 text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star className={`w-6 h-6 ${star <= mentorRating ? "fill-amber-400 text-amber-400" : "text-zinc-600"}`} />
                        </button>
                      ))}
                      <span className="text-xs text-zinc-400 font-mono ml-2">{mentorRating} / 5 Stars</span>
                    </div>
                  </div>

                  {/* Mentor Verdict Buttons */}
                  <div>
                    <label className="block text-xs text-zinc-300 mb-1.5">Mentor Recommendation</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {["Strong Hire", "Hire", "Leaning No Hire", "No Hire"].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setMentorVerdict(v)}
                          className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                            mentorVerdict === v
                              ? v.includes("Hire") && !v.includes("No")
                                ? "bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-md shadow-emerald-950/40"
                                : "bg-rose-500/20 border-rose-400 text-rose-300 shadow-md shadow-rose-950/40"
                              : "bg-[#031320] border-cyan-500/15 text-zinc-400 hover:text-white"
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mentor Notes */}
                  <div>
                    <label className="block text-xs text-zinc-300 mb-1.5">
                      Personalized Feedback for Candidate Email (Strengths, Notes, Growth Areas)
                    </label>
                    <textarea
                      value={mentorNotes}
                      onChange={(e) => setMentorNotes(e.target.value)}
                      rows={3}
                      placeholder="E.g., Great problem solving approach and clean syntax. Handled edge cases smoothly. Recommended for backend systems."
                      className="w-full bg-[#031320] border border-cyan-500/20 rounded-xl p-3 text-xs text-white outline-none focus:border-cyan-400 resize-none leading-relaxed"
                    />
                    <span className="text-[10px] text-zinc-500 mt-1 block">
                      This personalized feedback will be dynamically woven into the candidate's custom acceptance or constructive guidance email.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400">Mentor Verdict:</span>
                    <strong className="text-white">{selectedMeetingForDecision.interviewerFeedback?.verdict || "Submitted"}</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400">Rating:</span>
                    <strong className="text-amber-400">{selectedMeetingForDecision.interviewerFeedback?.rating || 5} / 5 Stars</strong>
                  </div>
                  {selectedMeetingForDecision.interviewerFeedback?.notes && (
                    <p className="text-zinc-300 italic bg-[#031320] p-3 rounded-xl border border-cyan-500/15 mt-2">
                      "{selectedMeetingForDecision.interviewerFeedback.notes}"
                    </p>
                  )}
                  <div className="pt-2 text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Decision finalized & custom email dispatched to candidate.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Decision Finalize CTA Buttons (Only if pending) */}
            {selectedMeetingForDecision.status === "completed" && (
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  onClick={() => handleFinalizeDecision("approved")}
                  disabled={submittingDecision}
                  className="w-full sm:flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold py-3 px-4 rounded-xl text-xs transition-all shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                >
                  <Check className="w-4 h-4" />
                  <span>Select Candidate & Send Offer Mail</span>
                </button>

                <button
                  onClick={() => handleFinalizeDecision("rejected")}
                  disabled={submittingDecision}
                  className="w-full sm:flex-1 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-semibold py-3 px-4 rounded-xl text-xs transition-all shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                >
                  <X className="w-4 h-4" />
                  <span>Reject Candidate & Send Constructive Feedback</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default InterviewerDashboard;
