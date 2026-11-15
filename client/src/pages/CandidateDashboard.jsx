import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import CompleteProfile from "../components/CompleteProfile";
import WhatsNewSection from "../components/WhatsNewSection";

function CandidateDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard" or "profile"
  const [meetings, setMeetings] = useState([]);
  const [pendingTickets, setPendingTickets] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [meetingsLoading, setMeetingsLoading] = useState(false);

  // Ticket Modal State
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [jobId, setJobId] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [slotStart, setSlotStart] = useState("");
  const [slotEnd, setSlotEnd] = useState("");
  const [resumeFile, setResumeFile] = useState(null);

  const [ticketLoading, setTicketLoading] = useState(false);
  const [ticketError, setTicketError] = useState("");
  const [ticketSuccess, setTicketSuccess] = useState("");

  const fetchUserAndMeetings = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      
      const headers = { Authorization: `Bearer ${token}` };
      
      const userRes = await API.get("/profile/me", { headers });
      setUser(userRes.data);
      localStorage.setItem("user", JSON.stringify(userRes.data));

      setMeetingsLoading(true);
      const [meetingsRes, ticketsRes, lessonsRes] = await Promise.all([
        API.get("/meeting/my-meetings", { headers }),
        API.get("/interview/my-tickets", { headers }),
        API.get("/ai/lessons", { headers })
      ]);
      setMeetings(meetingsRes.data);
      setPendingTickets(ticketsRes.data);
      setLessons(lessonsRes.data);
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
      const userStr = localStorage.getItem("user");
      if (userStr) setUser(JSON.parse(userStr));
    } finally {
      setMeetingsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserAndMeetings();
  }, [navigate]);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleProfileComplete = (updatedUser) => {
    setUser(updatedUser);
    alert("Profile updated successfully!");
    fetchUserAndMeetings();
  };

  const handleRaiseTicketSubmit = async (e) => {
    e.preventDefault();
    setTicketError("");
    setTicketSuccess("");

    if (!/^JOB-\d{5}$/.test(jobId)) {
      setTicketError("Job ID must be in format JOB-XXXXX (e.g., JOB-12345).");
      return;
    }

    if (jobDescription.trim().length < 50) {
      setTicketError("Job Description (JD) must be at least 50 characters long.");
      return;
    }

    const start = new Date(slotStart);
    const end = new Date(slotEnd);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setTicketError("Please enter valid dates and times for preferred slots.");
      return;
    }
    if (start < new Date()) {
      setTicketError("Preferred start time must be in the future.");
      return;
    }
    if (end <= start) {
      setTicketError("Preferred end time must be after the start time.");
      return;
    }

    if (!resumeFile && !user?.resumeUrl) {
      setTicketError("Please upload your updated resume.");
      return;
    }

    setTicketLoading(true);

    try {
      const formData = new FormData();
      formData.append("jobId", jobId);
      formData.append("jobDescription", jobDescription);
      formData.append("preferredSlotStart", slotStart);
      formData.append("preferredSlotEnd", slotEnd);
      if (resumeFile) {
        formData.append("resume", resumeFile);
      }

      const response = await API.post(
        "/interview/raise-ticket",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}`
          }
        }
      );
      
      setTicketSuccess(response.data.message);
      fetchUserAndMeetings();
      setTimeout(() => {
        setShowTicketModal(false);
        setJobId("");
        setJobDescription("");
        setSlotStart("");
        setSlotEnd("");
        setResumeFile(null);
        setTicketSuccess("");
      }, 2000);
    } catch (err) {
      setTicketError(err.response?.data?.message || "Failed to raise ticket");
    } finally {
      setTicketLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#041826] flex items-center justify-center text-white text-sm">
        Loading dashboard...
      </div>
    );
  }

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
              Candidate
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

      {/* Hero Welcome Bar */}
      <div className="border-b border-white/10 bg-white/[0.01] py-6 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-normal tracking-tight text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                Welcome, {user.name}
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">{user.email}</p>
            </div>
            
            {user.profileStatus === "approved" && (
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Verified
              </span>
            )}
            {(!user.profileCompleted || user.profileStatus === "pending") && (
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                Pending Verification
              </span>
            )}
            {user.profileStatus === "rejected" && (
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                Rejected
              </span>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-white/[0.04] p-1 rounded-xl border border-white/10 self-start md:self-auto">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "dashboard" ? "bg-white text-[#041826]" : "text-zinc-400 hover:text-white"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "profile" ? "bg-white text-[#041826]" : "text-zinc-400 hover:text-white"
              }`}
            >
              Profile Settings
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {activeTab === "dashboard" && (
          <>
            {user.profileStatus === "rejected" && user.adminNotes && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-zinc-300">
                <h4 className="text-xs font-semibold uppercase text-rose-400 tracking-wider mb-1">Rejection Feedback</h4>
                <p className="text-sm">{user.adminNotes}</p>
                <button 
                  onClick={() => setActiveTab("profile")}
                  className="mt-2 text-xs text-white hover:underline font-semibold"
                >
                  Edit Profile to Resubmit &rarr;
                </button>
              </div>
            )}

            {/* Quick Actions & Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Nebula Button - strictly Nebula, no tags underneath */}
              <button
                onClick={() => navigate("/practice")}
                className="p-6 rounded-2xl bg-[#041a2a]/80 hover:bg-[#07243a] border border-white/10 hover:border-white/25 transition-all text-left flex flex-col justify-between h-[120px] group shadow-lg"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs text-zinc-400 font-mono">01</span>
                  <span className="text-zinc-400 group-hover:text-white transition-colors">&rarr;</span>
                </div>
                <h3 className="text-2xl font-normal tracking-tight text-white group-hover:text-cyan-300 transition-colors" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                  Nebula
                </h3>
              </button>

              {/* Zephyr Button - strictly Zephyr, no tags underneath */}
              <button
                id="tour-adaptive-practice"
                onClick={() => navigate("/adaptive-practice")}
                className="p-6 rounded-2xl bg-[#041a2a]/80 hover:bg-[#07243a] border border-white/10 hover:border-white/25 transition-all text-left flex flex-col justify-between h-[120px] group shadow-lg"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs text-zinc-400 font-mono">02</span>
                  <span className="text-zinc-400 group-hover:text-white transition-colors">&rarr;</span>
                </div>
                <h3 className="text-2xl font-normal tracking-tight text-white group-hover:text-cyan-300 transition-colors" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                  Zephyr
                </h3>
              </button>

              {/* Metrics: Scheduled */}
              <div className="p-6 rounded-2xl bg-[#041a2a]/60 border border-white/10 flex flex-col justify-between h-[120px]">
                <span className="text-xs text-zinc-400">Scheduled Interviews</span>
                <span className="text-3xl font-light text-white">
                  {meetings.filter(m => m.status === "scheduled" || m.status === "live").length}
                </span>
              </div>

              {/* Metrics: Completed */}
              <div className="p-6 rounded-2xl bg-[#041a2a]/60 border border-white/10 flex flex-col justify-between h-[120px]">
                <span className="text-xs text-zinc-400">Completed Interviews</span>
                <span className="text-3xl font-light text-white">
                  {meetings.filter(m => ["completed", "approved", "rejected"].includes(m.status)).length}
                </span>
              </div>
            </div>

            {/* What's New Section */}
            <WhatsNewSection />

            {/* Interviews Section */}
            <div className="bg-[#041a2a]/60 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md">
              <div className="p-6 border-b border-white/10 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="font-medium text-lg text-white">Interviews</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">Live sessions and interview history</p>
                </div>
                
                {user.profileStatus === "approved" ? (
                  (meetings.filter(m => m.status !== "completed" && m.status !== "dismissed" && m.status !== "approved" && m.status !== "rejected").length > 0 || pendingTickets.length > 0) ? (
                    <span className="text-xs text-amber-300/80 px-3 py-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10">
                      Ticket limit reached
                    </span>
                  ) : (
                    <button 
                      onClick={() => setShowTicketModal(true)}
                      className="bg-white text-[#041826] hover:bg-zinc-200 font-medium px-4 py-2 rounded-xl text-xs transition-all"
                    >
                      + Raise Ticket
                    </button>
                  )
                ) : (
                  <span className="text-xs text-zinc-500 px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.02]">
                    Profile approval required to schedule
                  </span>
                )}
              </div>

              {/* Active Rounds */}
              <div className="divide-y divide-white/5">
                {meetingsLoading ? (
                  <div className="p-8 text-center text-zinc-500 text-xs">Loading schedules...</div>
                ) : meetings.filter(m => ["scheduled", "live"].includes(m.status)).length === 0 ? (
                  <div className="p-8 text-center text-zinc-500 text-xs">
                    No active interviews scheduled.
                  </div>
                ) : (
                  meetings.filter(m => ["scheduled", "live"].includes(m.status)).map((meeting) => (
                    <div
                      key={meeting._id}
                      className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono px-2 py-0.5 bg-white/[0.05] border border-white/10 rounded text-zinc-300">
                            {meeting.jobId || "Round"}
                          </span>
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {meeting.status.toUpperCase()}
                          </span>
                        </div>
                        
                        <h4 className="font-medium text-sm mt-2 text-white">
                          {meeting.candidateId?._id === user?._id || meeting.candidateId === user?._id 
                            ? "Interview with " + (meeting.interviewerId?.name || "Mentor") 
                            : "Candidate: " + (meeting.candidateId?.name || "Unknown")}
                        </h4>
                        
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-zinc-400">
                          <span>{new Date(meeting.scheduledTime).toLocaleString()}</span>
                          <span>Room: <strong className="font-mono text-zinc-300">{meeting.meetingId}</strong></span>
                          <span>Key: <strong className="font-mono text-white bg-white/10 px-1.5 py-0.5 rounded">{meeting.keyPassword}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => navigate(`/meeting/${meeting.meetingId}`)}
                          className="bg-white text-[#041826] hover:bg-zinc-200 font-medium px-4 py-2 rounded-xl text-xs transition-all"
                        >
                          Enter Room
                        </button>
                        {meeting.resumeUrl && (
                          <a 
                            href={meeting.resumeUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs border border-white/10 hover:border-white/20 bg-white/[0.04] text-zinc-300 px-3 py-2 rounded-xl transition-all"
                          >
                            Resume
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Completed Rounds */}
              {meetings.filter(m => ["completed", "approved", "rejected"].includes(m.status)).length > 0 && (
                <>
                  <div className="bg-white/[0.02] px-6 py-2.5 border-t border-white/10">
                    <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Past Evaluations</span>
                  </div>
                  <div className="divide-y divide-white/5">
                    {meetings.filter(m => ["completed", "approved", "rejected"].includes(m.status)).map((meeting) => (
                      <div
                        key={meeting._id}
                        className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono px-2 py-0.5 bg-white/[0.05] border border-white/10 rounded text-zinc-400">
                              {meeting.jobId || "N/A"}
                            </span>
                            {meeting.status === "completed" && (
                              <span className="text-[11px] font-medium text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                In Review
                              </span>
                            )}
                            {meeting.status === "approved" && (
                              <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                Selected
                              </span>
                            )}
                            {meeting.status === "rejected" && (
                              <span className="text-[11px] font-medium text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                                Not Selected
                              </span>
                            )}
                          </div>
                          
                          <h4 className="font-medium text-sm mt-1.5 text-white">
                            {meeting.candidateId?._id === user?._id || meeting.candidateId === user?._id 
                              ? "Session with " + (meeting.interviewerId?.name || "Mentor") 
                              : "Candidate: " + (meeting.candidateId?.name || "Unknown")}
                          </h4>
                          
                          <p className="text-xs text-zinc-500 mt-1">
                            {new Date(meeting.scheduledTime).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {activeTab === "profile" && (
          <div>
            <CompleteProfile 
              user={user}
              onComplete={handleProfileComplete} 
            />
          </div>
        )}
      </main>

      {/* Ticket Modal */}
      {showTicketModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#041a2a] border border-white/10 rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowTicketModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white text-base"
            >
              ✕
            </button>
            <h3 className="text-xl font-normal text-white mb-1" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
              Request Interview
            </h3>
            <p className="text-zinc-400 text-xs mb-6">Propose your preferred slot and details for the live coding round.</p>

            {ticketError && <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">{ticketError}</div>}
            {ticketSuccess && <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">{ticketSuccess}</div>}

            <form onSubmit={handleRaiseTicketSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider">Job ID</label>
                <input
                  type="text"
                  required
                  value={jobId}
                  onChange={(e) => setJobId(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl py-2.5 px-3.5 text-sm text-white outline-none focus:border-white/40 transition-colors"
                  placeholder="JOB-12345"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider">Job Description</label>
                <textarea
                  required
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl py-2.5 px-3.5 text-sm text-white outline-none focus:border-white/40 min-h-[80px] transition-colors"
                  placeholder="Paste job details (minimum 50 characters)..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider">Slot Start</label>
                  <input
                    type="datetime-local"
                    required
                    value={slotStart}
                    onChange={(e) => setSlotStart(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-white/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider">Slot End</label>
                  <input
                    type="datetime-local"
                    required
                    value={slotEnd}
                    onChange={(e) => setSlotEnd(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-white/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider">Resume (PDF/DOC)</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setResumeFile(e.target.files[0])}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl py-2 px-3 text-xs text-zinc-300 outline-none file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:bg-white/10 file:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={ticketLoading}
                className="w-full bg-white hover:bg-zinc-200 text-[#041826] font-medium py-3 px-4 rounded-xl text-xs transition-all shadow-lg disabled:opacity-50 mt-2"
              >
                {ticketLoading ? "Submitting..." : "Submit Ticket"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CandidateDashboard;
