import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import CompleteProfile from "../components/CompleteProfile";

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
      
      // Fetch user profile
      const userRes = await API.get("/profile/me", { headers });
      setUser(userRes.data);
      localStorage.setItem("user", JSON.stringify(userRes.data));

      // Fetch meetings and pending tickets
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
      // Fallback
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

    // 1. Validate Job ID format (JOB-XXXXX)
    if (!/^JOB-\d{5}$/.test(jobId)) {
      setTicketError("Job ID must be in format JOB-XXXXX (e.g., JOB-12345).");
      return;
    }

    // 2. Validate JD length (min 50)
    if (jobDescription.trim().length < 50) {
      setTicketError("Job Description (JD) must be at least 50 characters long.");
      return;
    }

    // 3. Validate slots
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

    // 4. Validate resume (required if not already on profile)
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

  if (!user) return <div className="min-h-screen bg-transparent flex items-center justify-center text-white">Loading dashboard...</div>;

  return (
    <div className="min-h-screen bg-transparent text-white flex flex-col font-sans" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-xl border-b border-white/10 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div id="tour-profile" className="w-[30px] h-[30px] rounded-[8px] bg-white flex items-center justify-center overflow-hidden">
              <img src="/Sora_Favicon.jpg" alt="Sora Logo" className="w-full h-full object-cover" />
            </div>
            <span style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }} className="text-[20px] font-extrabold text-white tracking-[-0.01em]">
              Sora
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-xs bg-white/5 backdrop-blur-lg border border-white/10 text-zinc-400 px-3 py-1 rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Candidate Mode
            </span>
            <button
              onClick={handleSignOut}
              className="text-xs bg-white/5 backdrop-blur-lg hover:bg-white/20/10 border border-white/10 text-zinc-300 hover:text-white px-4 py-2 rounded-xl transition-all duration-200"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Hero Header with verification sign */}
      <div className="bg-white/5 backdrop-blur-lg border-b border-white/10 py-6 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Welcome, {user.name}</h1>
              <p className="text-xs text-zinc-400 mt-0.5">{user.email}</p>
            </div>
            
            {/* Verification Sign */}
            {user.profileStatus === "approved" && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" title="Profile Verified">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                Verified Candidate
              </div>
            )}
            {(!user.profileCompleted || user.profileStatus === "pending") && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20" title="Verification Pending">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                Pending Verification
              </div>
            )}
            {user.profileStatus === "rejected" && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20" title="Verification Rejected">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                Rejected Profile
              </div>
            )}
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex bg-white/5 backdrop-blur-lg p-1 rounded-xl border border-white/10 self-start md:self-auto">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === "dashboard" ? "bg-white text-zinc-900 font-bold hover:scale-105 shadow-md shadow-black/5" : "text-zinc-400 hover:text-white"}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === "profile" ? "bg-white text-zinc-900 font-bold hover:scale-105 shadow-md shadow-black/5" : "text-zinc-400 hover:text-white"}`}
            >
              Profile Settings
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        
        {activeTab === "dashboard" && (
          <>
            {/* Show feedback if rejected */}
            {user.profileStatus === "rejected" && user.adminNotes && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 text-zinc-300">
                <h4 className="text-xs font-bold uppercase text-rose-400 tracking-wider mb-1">Rejection Feedback</h4>
                <p className="text-sm">{user.adminNotes}</p>
                <button 
                  onClick={() => setActiveTab("profile")}
                  className="mt-2 text-xs text-white hover:underline font-semibold"
                >
                  Edit Profile to Resubmit &rarr;
                </button>
              </div>
            )}

            {/* Top Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <p className="text-xs text-zinc-400 uppercase tracking-wider">Scheduled Assessments</p>
                <h3 className="text-3xl font-bold mt-2 tracking-tight">
                  {meetings.filter(m => m.status === "scheduled" || m.status === "live").length}
                </h3>
                <p className="text-xs text-zinc-400 mt-1">Upcoming live coding rounds</p>
              </div>
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <p className="text-xs text-zinc-400 uppercase tracking-wider">Completed Assessments</p>
                <h3 className="text-3xl font-bold mt-2 tracking-tight">
                  {meetings.filter(m => ["completed", "approved", "rejected"].includes(m.status)).length}
                </h3>
                <p className="text-xs text-zinc-400 mt-1">Rounds submitted for review</p>
              </div>
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <p className="text-xs text-zinc-400 uppercase tracking-wider">Profile Verification</p>
                <h3 className="text-3xl font-bold mt-2 tracking-tight capitalize">{user.profileStatus || "pending"}</h3>
                <p className="text-xs text-zinc-400 mt-1">Must be approved to request interviews</p>
              </div>
              <button
                onClick={() => navigate("/practice")}
                className="p-6 rounded-2xl bg-gradient-to-br from-violet-600/10 to-fuchsia-600/10 border border-zinc-900/20 backdrop-blur-sm text-left hover:border-zinc-900/40 transition-all group"
              >
                <p className="text-xs text-white uppercase tracking-wider font-bold">Practice & Learn</p>
                <h3 className="text-xl font-bold mt-2 tracking-tight text-white group-hover:text-zinc-200 transition-colors">LessonBasedLearning</h3>
                <p className="text-xs text-zinc-400 mt-1">Learn any topic with interactive coding →</p>
              </button>
              <button
                id="tour-adaptive-practice"
                onClick={() => navigate("/adaptive-practice")}
                className="p-6 rounded-2xl bg-gradient-to-br from-emerald-600/10 to-teal-600/10 border border-emerald-500/20 backdrop-blur-sm text-left hover:border-emerald-500/40 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-bl-lg uppercase tracking-widest">DeepSeek</div>
                <p className="text-xs text-emerald-400 uppercase tracking-wider font-bold">Coding Interview</p>
                <h3 className="text-xl font-bold mt-2 tracking-tight text-white group-hover:text-emerald-300 transition-colors">StorybaseCodePractise</h3>
                <p className="text-xs text-zinc-400 mt-1">Generate custom placement problems →</p>
              </button>
            </div>

            {/* Previous Lessons Section */}
            {lessons.length > 0 && (
              <div className="mb-8 bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md">
                <div className="p-6 border-b border-white/10 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10/20 flex items-center justify-center border border-zinc-900/30">
                    <span className="text-white">📚</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Your AI Lessons</h3>
                    <p className="text-xs text-zinc-400">Resume your previously generated learning sessions</p>
                  </div>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {lessons.map(lesson => (
                    <div 
                      key={lesson._id}
                      onClick={() => navigate(`/practice?lessonId=${lesson._id}`)}
                      className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-zinc-900/50 cursor-pointer transition-all group"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-white bg-violet-500/10 px-2 py-1 rounded-md">
                          {lesson.language}
                        </span>
                        <span className="text-xs text-zinc-400">{new Date(lesson.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h4 className="text-sm font-bold text-white mb-2 group-hover:text-zinc-200 transition-colors">
                        {lesson.topic}
                        {lesson.completed && <span className="ml-2 text-emerald-400 font-bold" title="Completed">✓</span>}
                      </h4>
                      <p className="text-xs text-zinc-400">Click to resume this interactive lesson →</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dashboard Content Container */}
            <div id="tour-schedule" className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md">
              <div className="p-6 border-b border-white/10 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="font-semibold text-lg">Your Interviews</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">Click join when the interview is active. Use key password provided.</p>
                </div>
                
                {user.profileStatus === "approved" ? (
                  (meetings.filter(m => m.status !== "completed" && m.status !== "dismissed" && m.status !== "approved" && m.status !== "rejected").length > 0 || pendingTickets.length > 0) ? (
                    <span className="text-xs bg-amber-500/10 border border-amber-500/20 text-amber-400 px-4 py-2.5 rounded-xl cursor-not-allowed" title="You already have an active ticket or meeting">
                      ⚠️ Ticket limit reached
                    </span>
                  ) : (
                    <button 
                      onClick={() => setShowTicketModal(true)}
                      className="bg-white/10 hover:bg-zinc-800 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-black/10 transition-all text-xs"
                    >
                      + Raise Interview Ticket
                    </button>
                  )
                ) : (
                  <span className="text-xs bg-white/5 backdrop-blur-lg border border-white/10 text-zinc-400 px-4 py-2.5 rounded-xl cursor-not-allowed" title="Unlock by getting profile approved">
                    🔒 Raise Ticket (Locked)
                  </span>
                )}
              </div>

              {/* Active Interviews Section */}
              <div className="bg-white/5 px-6 py-3 border-b border-white/10">
                <h4 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Active Interviews</h4>
              </div>
              <div className="divide-y divide-slate-900">
                {meetingsLoading ? (
                  <div className="p-8 text-center text-zinc-400">Loading interview schedules...</div>
                ) : meetings.filter(m => ["scheduled", "live"].includes(m.status)).length === 0 ? (
                  <div className="p-8 text-center text-zinc-400">
                    <p className="text-sm">No active interviews scheduled.</p>
                    {user.profileStatus === "approved" && (
                      <p className="text-xs text-zinc-400 mt-1">Click "Raise Interview Ticket" to schedule one.</p>
                    )}
                  </div>
                ) : (
                  meetings.filter(m => ["scheduled", "live"].includes(m.status)).map((meeting) => (
                    <div
                      key={meeting._id}
                      className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-white/20/5 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold px-2 py-0.5 bg-violet-500/10 text-white border border-zinc-900/20 rounded">
                            {meeting.jobId || "N/A"}
                          </span>
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {meeting.status.toUpperCase()}
                          </span>
                        </div>
                        
                        <h4 className="font-bold text-base mt-2 text-white">
                          {meeting.candidateId?._id === user?._id || meeting.candidateId === user?._id ? "Technical Round with " + (meeting.interviewerId?.name || "Interviewer") : "Interviewing Candidate: " + (meeting.candidateId?.name || "Unknown")}
                        </h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 mt-3 text-xs text-zinc-400">
                          <div>
                            <strong>Time:</strong> {new Date(meeting.scheduledTime).toLocaleString()}
                          </div>
                          <div>
                            <strong>Meeting ID:</strong> <span className="font-mono">{meeting.meetingId}</span>
                          </div>
                          <div className="sm:col-span-2 flex items-center gap-1.5 mt-1">
                            <strong>Key Password:</strong> 
                            <span className="font-mono bg-white/5 backdrop-blur-lg border border-white/10 text-white font-bold px-2 py-0.5 rounded text-sm tracking-wider">
                              {meeting.keyPassword}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          onClick={() => navigate(`/meeting/${meeting.meetingId}`)}
                          className="bg-white/10 hover:bg-zinc-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md transition-all"
                        >
                          Enter Lobby
                        </button>
                        {meeting.resumeUrl && (
                          <a 
                            href={meeting.resumeUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs border border-white/10 hover:border-white/20 bg-white/5 backdrop-blur-lg text-zinc-300 hover:text-white px-3 py-2.5 rounded-xl transition-all"
                          >
                            Resume
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Previous Interviews Section */}
              <div id="tour-feedback" className="bg-white/5 px-6 py-3 border-y border-white/10 mt-4">
                <h4 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Previous Interviews</h4>
              </div>
              <div className="divide-y divide-slate-900">
                {meetingsLoading ? (
                  <div className="p-8 text-center text-zinc-400">Loading interview schedules...</div>
                ) : meetings.filter(m => ["completed", "approved", "rejected"].includes(m.status)).length === 0 ? (
                  <div className="p-8 text-center text-zinc-400">
                    <p className="text-sm">No previous interviews found.</p>
                  </div>
                ) : (
                  meetings.filter(m => ["completed", "approved", "rejected"].includes(m.status)).map((meeting) => (
                    <div
                      key={meeting._id}
                      className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-white/20/5 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold px-2 py-0.5 bg-violet-500/10 text-white border border-zinc-900/20 rounded">
                            {meeting.jobId || "N/A"}
                          </span>
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/10 text-zinc-300 border border-white/20">
                            MEETING ENDED
                          </span>
                        </div>
                        
                        <h4 className="font-bold text-base mt-2 text-white">
                          {meeting.candidateId?._id === user?._id || meeting.candidateId === user?._id ? "Technical Round with " + (meeting.interviewerId?.name || "Interviewer") : "Interviewing Candidate: " + (meeting.candidateId?.name || "Unknown")}
                        </h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 mt-3 text-xs text-zinc-400">
                          <div>
                            <strong>Time:</strong> {new Date(meeting.scheduledTime).toLocaleString()}
                          </div>
                          <div>
                            <strong>Meeting ID:</strong> <span className="font-mono">{meeting.meetingId}</span>
                          </div>
                          <div className="sm:col-span-2 flex items-center gap-1.5 mt-1">
                            {meeting.status === "completed" && (
                              <span className="font-semibold text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                                🕒 Wait for review
                              </span>
                            )}
                            {meeting.status === "approved" && (
                              <span className="font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                                🎉 Selected - Check Email for Offer
                              </span>
                            )}
                            {meeting.status === "rejected" && (
                              <span className="font-semibold text-rose-400 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20">
                                ❌ Rejected - Check Email for Details
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowTicketModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white text-lg"
            >
              ✕
            </button>
            <h3 className="text-2xl font-bold text-white mb-2">Raise Interview Ticket</h3>
            <p className="text-zinc-400 text-xs mb-6">Propose a slot and upload JD info to request a live coding round.</p>

            {ticketError && <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">{ticketError}</div>}
            {ticketSuccess && <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">{ticketSuccess}</div>}

            <form onSubmit={handleRaiseTicketSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1 uppercase tracking-wider">Job ID (Required)</label>
                <input
                  type="text"
                  required
                  value={jobId}
                  onChange={(e) => setJobId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-white transition-colors"
                  placeholder="JOB-12345"
                />
                <p className="text-[10px] text-zinc-400 mt-1">Strict format: JOB- followed by 5 digits</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1 uppercase tracking-wider">Job Description (JD) (Required)</label>
                <textarea
                  required
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-white min-h-[80px] transition-colors"
                  placeholder="Paste the job description here (min 50 characters)..."
                />
                <p className="text-[10px] text-zinc-400 mt-1">Must be at least 50 characters</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1 uppercase tracking-wider">Preferred Slot Start (Required)</label>
                  <input
                    type="datetime-local"
                    required
                    value={slotStart}
                    onChange={(e) => setSlotStart(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1 uppercase tracking-wider">Preferred Slot End (Required)</label>
                  <input
                    type="datetime-local"
                    required
                    value={slotEnd}
                    onChange={(e) => setSlotEnd(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1 uppercase tracking-wider">Updated Resume (PDF/DOC)</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setResumeFile(e.target.files[0])}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-zinc-300 outline-none file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-violet-500 transition-all"
                />
                {user.resumeUrl ? (
                  <p className="text-[10px] text-emerald-400 mt-1">✓ Verified resume available. Upload only to update.</p>
                ) : (
                  <p className="text-[10px] text-rose-400 mt-1">* Resume is required as you have none uploaded yet.</p>
                )}
              </div>

              <button
                type="submit"
                disabled={ticketLoading}
                className="w-full bg-white/10 hover:bg-zinc-800 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-all shadow-lg disabled:opacity-50 mt-4"
              >
                {ticketLoading ? "Submitting Request..." : "Confirm & Raise Ticket"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CandidateDashboard;
