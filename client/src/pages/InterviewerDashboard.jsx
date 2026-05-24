import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import socket from "../socket/socket";

function InterviewerDashboard() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Interviewer");
  const [tickets, setTickets] = useState([]);
  const [pendingProfiles, setPendingProfiles] = useState([]);
  const [completedMeetings, setCompletedMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("tickets");
  const [joinNotification, setJoinNotification] = useState(null);

  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewingId, setReviewingId] = useState(null);

  // Schedule Modal State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [scheduledTime, setScheduledTime] = useState("");
  const [keyPassword, setKeyPassword] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}` };
      const [ticketsRes, profilesRes, completedRes] = await Promise.all([
        API.get("/interview/tickets", { headers }),
        API.get("/profile/pending-profiles", { headers }),
        API.get("/meeting/completed", { headers })
      ]);
      setTickets(ticketsRes.data);
      setPendingProfiles(profilesRes.data);
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

    // Listen for candidate join notifications in real-time
    const handleJoinNotification = (data) => {
      console.log("[socket] Received candidate join notification:", data);
      setJoinNotification(data);
    };
    socket.on("candidate-joined-notification", handleJoinNotification);

    return () => {
      socket.off("candidate-joined-notification", handleJoinNotification);
    };
  }, []);

  const handleReview = async (id, status) => {
    try {
      setReviewingId(id);
      await API.put(`/profile/review-profile/${id}`, { status, adminNotes: reviewNotes }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}`
        }
      });
      setPendingProfiles(pendingProfiles.filter(p => p._id !== id));
      setReviewNotes("");
    } catch (err) {
      console.error("Failed to review profile", err);
    } finally {
      setReviewingId(null);
    }
  };

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
    // Prefill date input to match preferredSlotStart
    if (ticket.preferredSlotStart) {
      const date = new Date(ticket.preferredSlotStart);
      // Format to yyyy-MM-ddThh:mm for datetime-local value
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
      alert("Interview scheduled successfully! Meeting link and password have been emailed to the candidate.");
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
      alert(`Candidate successfully ${status}. Email sent.`);
      fetchData();
    } catch (err) {
      console.error(`Failed to ${status} candidate:`, err);
      alert("Failed to review candidate.");
    }
  };

  const handleDismissTicket = async (ticketId) => {
    if (confirm("Are you sure you want to dismiss this meeting? It will be removed from all dashboards.")) {
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/20">
              <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              interview.io
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-xs bg-slate-900 border border-slate-800 text-slate-400 px-3 py-1 rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Interviewer Mode
            </span>
            <button
              onClick={handleSignOut}
              className="text-xs bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white px-4 py-2 rounded-xl transition-all duration-200"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>
 
      {joinNotification && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-4 flex items-center justify-between shadow-lg animate-pulse shrink-0">
          <div className="flex items-center space-x-3">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
            <p className="text-sm font-semibold">
              Candidate <strong className="underline">{joinNotification.candidateName}</strong> has entered the meeting room!
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                const id = joinNotification.meetingId;
                setJoinNotification(null);
                navigate(`/meeting/${id}`);
              }}
              className="bg-white text-emerald-700 hover:bg-emerald-50 font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-md"
            >
              Join Meet Room
            </button>
            <button
              onClick={() => setJoinNotification(null)}
              className="text-white/80 hover:text-white text-xs border border-white/20 hover:border-white/40 px-2 py-1 rounded-lg"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Welcome back, {userName}!</h2>
            <p className="text-slate-400 text-sm mt-1">
              Manage candidate pipelines, schedule slots, and run live coding evaluations.
            </p>
          </div>
        </div>

        <div className="flex space-x-4 mb-6 border-b border-slate-800 pb-1">
          <button
            onClick={() => setActiveTab("tickets")}
            className={`pb-2 px-1 text-sm font-semibold transition-colors border-b-2 ${activeTab === "tickets" ? "border-violet-500 text-white" : "border-transparent text-slate-400 hover:text-slate-200"}`}
          >
            Assigned Tickets ({tickets.filter(t => t.status !== "dismissed").length})
          </button>
          <button
            onClick={() => setActiveTab("profiles")}
            className={`pb-2 px-1 text-sm font-semibold transition-colors border-b-2 ${activeTab === "profiles" ? "border-violet-500 text-white" : "border-transparent text-slate-400 hover:text-slate-200"}`}
          >
            Pending Verifications ({pendingProfiles.length})
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`pb-2 px-1 text-sm font-semibold transition-colors border-b-2 ${activeTab === "completed" ? "border-violet-500 text-white" : "border-transparent text-slate-400 hover:text-slate-200"}`}
          >
            Completed Interviews ({completedMeetings.length})
          </button>
        </div>

        {activeTab === "tickets" && (
          <div className="bg-slate-900/20 border border-slate-900 rounded-3xl overflow-hidden backdrop-blur-md">
            <div className="p-6 border-b border-slate-900 flex items-center justify-between">
              <h3 className="font-semibold text-lg">Assigned Evaluation Slots (Tickets)</h3>
            </div>

            <div className="divide-y divide-slate-900">
              {loading ? (
                <div className="p-8 text-center text-slate-400">Loading tickets...</div>
              ) : tickets.filter(t => t.status !== "dismissed").length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <p>No evaluation slots assigned yet.</p>
                </div>
              ) : (
                tickets.filter(t => t.status !== "dismissed").map((ticket) => (
                  <div key={ticket._id} className="p-6 flex flex-col hover:bg-slate-900/10 transition-colors gap-4">
                    <div className="flex items-start justify-between flex-wrap gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center border border-slate-800 text-xs font-bold text-slate-400 text-center uppercase p-1">
                          {ticket.status}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-base">{ticket.title}</h4>
                            <span className="text-xs bg-violet-500/15 text-violet-400 font-bold border border-violet-500/20 px-2 py-0.5 rounded">
                              {ticket.jobId || "N/A"}
                            </span>
                          </div>
                          <p className="text-slate-400 text-xs mt-0.5">
                            Candidate: <strong>{ticket.candidateId?.name}</strong> • {ticket.candidateId?.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {ticket.status === "scheduled" ? (
                          <>
                            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl">
                              🔒 Scheduled & Locked
                            </span>
                            <button
                              onClick={() => navigate(`/meeting/${ticket.meetingId}`)}
                              className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-all"
                            >
                              Join Meet Room
                            </button>
                            <button
                              onClick={() => handleDismissTicket(ticket._id)}
                              className="bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                              title="Dismiss Meeting"
                            >
                              ✕
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              onClick={() => handleOpenScheduleModal(ticket)}
                              className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold px-4 py-2.5 rounded-xl text-xs shadow-md shadow-violet-600/10 transition-all"
                            >
                              Schedule Interview
                            </button>
                            <button
                              onClick={() => handleDismissTicket(ticket._id)}
                              className="bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 px-3 py-2.5 rounded-xl text-xs font-bold transition-all"
                              title="Dismiss Meeting"
                            >
                              Dismiss
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Ticket Details Panel */}
                    <div className="mt-2 space-y-3 bg-slate-950/40 border border-slate-900 p-4 rounded-2xl text-sm text-slate-300">
                      <div>
                        <strong>Job Description (JD):</strong>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-3 bg-slate-950 p-2.5 rounded border border-slate-900/60 overflow-y-auto whitespace-pre-wrap max-h-[80px]">
                          {ticket.jobDescription}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2 text-xs text-slate-400">
                        <div>
                          <strong>Candidate Preferred Slot:</strong>
                          <div className="text-violet-400 font-semibold mt-1">
                            Start: {ticket.preferredSlotStart ? new Date(ticket.preferredSlotStart).toLocaleString() : "N/A"}<br/>
                            End: {ticket.preferredSlotEnd ? new Date(ticket.preferredSlotEnd).toLocaleString() : "N/A"}
                          </div>
                        </div>
                        
                        <div>
                          <strong>Candidate Resume:</strong>
                          <div className="mt-1">
                            {ticket.resumeUrl ? (
                              <a 
                                href={ticket.resumeUrl} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="text-violet-400 hover:underline font-semibold"
                              >
                                View PDF Resume &rarr;
                              </a>
                            ) : "No resume attached"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "profiles" && (
          <div className="bg-slate-900/20 border border-slate-900 rounded-3xl overflow-hidden backdrop-blur-md">
            <div className="p-6 border-b border-slate-900">
              <h3 className="font-semibold text-lg">Pending Candidate Verifications</h3>
            </div>

            <div className="divide-y divide-slate-900">
              {loading ? (
                <div className="p-8 text-center text-slate-400">Loading profiles...</div>
              ) : pendingProfiles.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <p>No pending profiles to verify.</p>
                </div>
              ) : (
                pendingProfiles.map((profile) => (
                  <div key={profile._id} className="p-6 flex flex-col gap-4 bg-slate-950/30">
                    <div>
                      <h4 className="font-bold text-xl text-white mb-1">{profile.name}</h4>
                      <p className="text-slate-400 text-sm mb-4">{profile.email} • {profile.experienceLevel} • National ID: {profile.nationalId}</p>
                      
                      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-sm mb-4">
                        <p className="mb-2"><strong>Intro:</strong> {profile.intro}</p>
                        <p className="mb-2"><strong>Skills:</strong> {profile.skills?.join(", ")}</p>
                        {profile.resumeUrl && (
                          <p className="mb-2">
                            <strong>Resume:</strong> <a href={profile.resumeUrl} target="_blank" rel="noreferrer" className="text-violet-400 hover:underline">View PDF</a>
                          </p>
                        )}
                        {profile.projects?.length > 0 && (
                          <div className="mt-2">
                            <strong>Projects:</strong>
                            <ul className="list-disc pl-4 mt-1 space-y-1">
                              {profile.projects.map((proj, i) => (
                                <li key={i}><a href={proj.link} target="_blank" rel="noreferrer" className="text-violet-400 hover:underline">{proj.title}</a> - {proj.description}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                        <div className="flex-1 w-full">
                          <label className="block text-xs font-medium text-slate-400 mb-1 uppercase">Review Notes (Sent to Candidate)</label>
                          <textarea
                            value={reviewNotes}
                            onChange={(e) => setReviewNotes(e.target.value)}
                            placeholder="Add feedback for approval or rejection..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-sm text-slate-200 outline-none focus:border-violet-500 min-h-[60px]"
                          />
                        </div>
                        <div className="flex space-x-3 w-full sm:w-auto">
                          <button
                            onClick={() => handleReview(profile._id, "approved")}
                            disabled={reviewingId === profile._id}
                            className="flex-1 sm:flex-none bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 font-semibold px-4 py-2 rounded-xl text-sm transition-all"
                          >
                            Approve & Shortlist
                          </button>
                          <button
                            onClick={() => handleReview(profile._id, "rejected")}
                            disabled={reviewingId === profile._id}
                            className="flex-1 sm:flex-none bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30 font-semibold px-4 py-2 rounded-xl text-sm transition-all"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "completed" && (
          <div className="bg-slate-900/20 border border-slate-900 rounded-3xl overflow-hidden backdrop-blur-md">
            <div className="p-6 border-b border-slate-900">
              <h3 className="font-semibold text-lg">Completed Interviews</h3>
            </div>

            <div className="divide-y divide-slate-900">
              {loading ? (
                <div className="p-8 text-center text-slate-400">Loading completed meetings...</div>
              ) : completedMeetings.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <p>No completed interviews found.</p>
                </div>
              ) : (
                completedMeetings.map((meeting) => (
                  <div key={meeting._id} className="p-6 flex flex-col hover:bg-slate-900/10 transition-colors gap-4">
                    <div className="flex items-start justify-between flex-wrap gap-4">
                      <div>
                        <h4 className="font-semibold text-base mb-1">
                          Assessment with {meeting.candidateId?.name || "Unknown Candidate"}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                            Job ID: {meeting.jobId || "N/A"}
                          </span>
                          <span>•</span>
                          <span>{new Date(meeting.scheduledTime).toLocaleString()}</span>
                        </div>
                      </div>
                      {meeting.recordingUrl && (
                        <a 
                          href={meeting.recordingUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                          Download / View Full
                        </a>
                      )}
                    </div>
                    
                    {meeting.recordingUrl ? (
                      <div className="mt-2 w-full max-w-2xl bg-black rounded-xl overflow-hidden border border-slate-800 aspect-video shadow-lg">
                        <video 
                          src={meeting.recordingUrl} 
                          controls 
                          className="w-full h-full object-contain"
                          preload="metadata"
                        />
                      </div>
                    ) : (
                      <div className="mt-2 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        Recording not available for this session.
                      </div>
                    )}
                    
                    {meeting.status === "completed" && (
                      <div className="mt-4 pt-4 border-t border-slate-800 flex gap-3">
                        <button 
                          onClick={() => handleReviewCandidate(meeting.meetingId, "approved")}
                          className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                        >
                          Select Candidate
                        </button>
                        <button 
                          onClick={() => handleReviewCandidate(meeting.meetingId, "rejected")}
                          className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                        >
                          Reject Candidate
                        </button>
                      </div>
                    )}

                    {meeting.status === "approved" && (
                      <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm font-semibold">
                        Candidate Selected - Offer Email Sent
                      </div>
                    )}

                    {meeting.status === "rejected" && (
                      <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm font-semibold">
                        Candidate Rejected - Rejection Email Sent
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* Schedule & Lock Modal */}
      {showScheduleModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
            <button 
              onClick={() => setShowScheduleModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              ✕
            </button>
            <h3 className="text-xl font-bold text-white mb-1">Confirm Schedule</h3>
            <p className="text-xs text-slate-400 mb-6">Confirm date/time and entry key password. Once locked, this meeting cannot be rescheduled.</p>

            <form onSubmit={handleScheduleSubmit} className="space-y-5">
              <div className="bg-slate-950 p-4 border border-slate-850 rounded-2xl text-xs space-y-1.5 mb-4">
                <p><strong>Candidate:</strong> {selectedTicket.candidateId?.name}</p>
                <p><strong>Job ID:</strong> {selectedTicket.jobId}</p>
                <p><strong>Candidate Preferred Window:</strong></p>
                <p className="text-violet-400 pl-2">
                  Start: {new Date(selectedTicket.preferredSlotStart).toLocaleString()}<br/>
                  End: {new Date(selectedTicket.preferredSlotEnd).toLocaleString()}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Confirmed Start Time</label>
                <input
                  type="datetime-local"
                  required
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-100 outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Key Password (Alphanumeric)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={keyPassword}
                    onChange={(e) => setKeyPassword(e.target.value.toUpperCase())}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-100 outline-none focus:border-violet-500 font-mono tracking-widest font-bold"
                    placeholder="PASS-XXXX"
                  />
                  <button
                    type="button"
                    onClick={() => setKeyPassword(generatePassword())}
                    className="bg-slate-800 hover:bg-slate-700 text-xs px-3 rounded-xl border border-slate-750 font-bold"
                  >
                    Regen
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">This key is required by the candidate and you to enter the meet</p>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-all shadow-lg"
              >
                🔒 Confirm & Lock Interview
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default InterviewerDashboard;
