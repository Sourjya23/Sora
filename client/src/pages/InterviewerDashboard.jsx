import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import socket from "../socket/socket";
import WhatsNewSection from "../components/WhatsNewSection";

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

  const handleReviewCandidate = async (meetingId, status) => {
    try {
      await API.post(`/meeting/review/${meetingId}`, { status }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}`
        }
      });
      alert(`Candidate marked as ${status}.`);
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
                  <div key={meeting._id} className="p-6 flex flex-col gap-4 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-start justify-between flex-wrap gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono px-2 py-0.5 bg-white/[0.05] border border-white/10 rounded text-zinc-300">
                            {meeting.jobId || "N/A"}
                          </span>
                          <span className="text-xs text-zinc-500">
                            {new Date(meeting.scheduledTime).toLocaleString()}
                          </span>
                        </div>
                        <h4 className="font-medium text-sm text-white mt-1.5">
                          Assessment with {meeting.candidateId?.name || "Candidate"} ({meeting.candidateId?.email})
                        </h4>
                      </div>

                      <div className="flex items-center gap-2">
                        {meeting.forensicReport && !meeting.forensicReport.isProcessing && (
                          <button
                            onClick={() => navigate(`/report/${meeting.meetingId}`)}
                            className="bg-white/[0.06] hover:bg-white/10 text-white border border-white/10 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all"
                          >
                            Forensic Report &rarr;
                          </button>
                        )}
                        {meeting.recordingUrl && (
                          <a 
                            href={meeting.recordingUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="bg-white/[0.06] hover:bg-white/10 text-zinc-300 hover:text-white px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all border border-white/10"
                          >
                            Recording
                          </a>
                        )}
                      </div>
                    </div>
                    
                    {meeting.status === "completed" && (
                      <div className="pt-3 border-t border-white/5 flex gap-2">
                        <button 
                          onClick={() => handleReviewCandidate(meeting.meetingId, "approved")}
                          className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                        >
                          Select Candidate
                        </button>
                        <button 
                          onClick={() => handleReviewCandidate(meeting.meetingId, "rejected")}
                          className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                        >
                          Reject Candidate
                        </button>
                      </div>
                    )}

                    {meeting.status === "approved" && (
                      <div className="text-xs text-emerald-400 font-medium">
                        ✓ Candidate Selected
                      </div>
                    )}

                    {meeting.status === "rejected" && (
                      <div className="text-xs text-rose-400 font-medium">
                        ✕ Candidate Not Selected
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
    </div>
  );
}

export default InterviewerDashboard;
