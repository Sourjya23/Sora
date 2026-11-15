import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [pendingProfiles, setPendingProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("analytics");
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewingId, setReviewingId] = useState(null);
  const [completedMeetings, setCompletedMeetings] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Report Modal State
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}` };
      const [statsRes, usersRes, profilesRes, completedRes, notificationsRes] = await Promise.all([
        API.get("/admin/stats", { headers }),
        API.get("/admin/users", { headers }),
        API.get("/profile/pending-profiles", { headers }),
        API.get("/admin/completed-meetings", { headers }),
        API.get("/admin/notifications", { headers })
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setPendingProfiles(profilesRes.data);
      setCompletedMeetings(completedRes.data);
      setNotifications(notificationsRes.data);
    } catch (err) {
      console.error("Failed to fetch admin data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReview = async (id, status) => {
    try {
      setReviewingId(id);
      await API.put(`/profile/review-profile/${id}`, { status, adminNotes: reviewNotes }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}` }
      });
      alert(`Profile ${status} successfully.`);
      setPendingProfiles(pendingProfiles.filter(p => p._id !== id));
      setReviewNotes("");
      fetchData();
    } catch (err) {
      console.error("Failed to review profile", err);
      alert("Failed to review profile.");
    } finally {
      setReviewingId(null);
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
            <span className="text-xs px-3 py-1 rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-300">
              Admin
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
          <div>
            <h1 className="text-2xl font-normal tracking-tight text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
              Admin Console
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">Platform metrics, user directory, candidate verification, and session forensics.</p>
          </div>

          <div className="flex bg-white/[0.04] p-1 rounded-xl border border-white/10 self-start md:self-auto overflow-x-auto">
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === "analytics" ? "bg-white text-[#041826]" : "text-zinc-400 hover:text-white"
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === "users" ? "bg-white text-[#041826]" : "text-zinc-400 hover:text-white"
              }`}
            >
              Users ({users.length})
            </button>
            <button
              onClick={() => setActiveTab("evaluations")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === "evaluations" ? "bg-white text-[#041826]" : "text-zinc-400 hover:text-white"
              }`}
            >
              Pending Profiles ({pendingProfiles.length})
            </button>
            <button
              onClick={() => setActiveTab("forensics")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === "forensics" ? "bg-white text-[#041826]" : "text-zinc-400 hover:text-white"
              }`}
            >
              Forensics
            </button>
            <button
              onClick={() => setActiveTab("notifications")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === "notifications" ? "bg-white text-[#041826]" : "text-zinc-400 hover:text-white"
              }`}
            >
              Notifications ({notifications.length})
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {loading ? (
          <div className="p-12 text-center text-zinc-500 text-xs">Loading database...</div>
        ) : (
          <>
            {activeTab === "analytics" && stats && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#041a2a]/60 border border-white/10 rounded-2xl p-6 flex flex-col justify-between h-[120px]">
                  <span className="text-xs text-zinc-400">Total Visits</span>
                  <div className="text-3xl font-light text-white">{stats.siteMetrics?.totalVisits || 0}</div>
                </div>
                
                <div className="bg-[#041a2a]/60 border border-white/10 rounded-2xl p-6 flex flex-col justify-between h-[120px]">
                  <span className="text-xs text-zinc-400">Registered Visits</span>
                  <div className="text-3xl font-light text-white">{stats.siteMetrics?.registeredVisits || 0}</div>
                </div>

                <div className="bg-[#041a2a]/60 border border-white/10 rounded-2xl p-6 flex flex-col justify-between h-[120px]">
                  <span className="text-xs text-zinc-400">Total Accounts</span>
                  <div className="text-3xl font-light text-white">{stats.totalUsers}</div>
                </div>

                <div className="bg-[#041a2a]/60 border border-white/10 rounded-2xl p-6 flex flex-col justify-between h-[120px]">
                  <span className="text-xs text-zinc-400">Profile Views</span>
                  <div className="text-3xl font-light text-white">{stats.totalProfileViews}</div>
                </div>
              </div>
            )}

            {activeTab === "users" && (
              <div className="bg-[#041a2a]/60 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md">
                <div className="p-5 border-b border-white/10">
                  <h3 className="font-medium text-base text-white">User Accounts</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-zinc-300">
                    <thead className="bg-white/[0.02] text-[11px] uppercase tracking-wider text-zinc-400 font-medium border-b border-white/10">
                      <tr>
                        <th className="px-5 py-3">Name</th>
                        <th className="px-5 py-3">Email</th>
                        <th className="px-5 py-3">Role</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3 text-right">Registered</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {users.map((u) => (
                        <tr key={u._id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-3.5 font-medium text-white">{u.name}</td>
                          <td className="px-5 py-3.5 text-zinc-400">{u.email}</td>
                          <td className="px-5 py-3.5">
                            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-mono bg-white/[0.05] border border-white/10 text-zinc-300">
                              {u.role}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            {u.role === 'candidate' ? (
                              <span className={`text-[11px] ${
                                u.profileStatus === 'approved' ? 'text-emerald-400' :
                                u.profileStatus === 'pending' ? 'text-amber-300' :
                                u.profileStatus === 'rejected' ? 'text-rose-400' : 'text-zinc-500'
                              }`}>
                                {u.profileStatus ? u.profileStatus.charAt(0).toUpperCase() + u.profileStatus.slice(1) : "Incomplete"}
                              </span>
                            ) : (
                              <span className="text-zinc-600">-</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-right text-zinc-500 font-mono">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "evaluations" && (
              <div className="bg-[#041a2a]/60 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md">
                <div className="p-5 border-b border-white/10">
                  <h3 className="font-medium text-base text-white">Pending Verification Queue</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">Review candidate identity, resume, and experience.</p>
                </div>

                <div className="divide-y divide-white/5">
                  {pendingProfiles.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500 text-xs">
                      No pending profiles awaiting review.
                    </div>
                  ) : (
                    pendingProfiles.map((profile) => (
                      <div key={profile._id} className="p-6 flex flex-col gap-4 hover:bg-white/[0.02] transition-colors">
                        <div>
                          <h4 className="font-medium text-base text-white">{profile.name}</h4>
                          <p className="text-zinc-400 text-xs mt-0.5">{profile.email} • {profile.experienceLevel} • National ID: {profile.nationalId}</p>
                          
                          <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5 text-xs text-zinc-300 mt-3 space-y-2">
                            {profile.intro && <p><strong className="text-zinc-200">Intro:</strong> {profile.intro}</p>}
                            {profile.skills && <p><strong className="text-zinc-200">Skills:</strong> {profile.skills.join(", ")}</p>}
                            {profile.resumeUrl && (
                              <p>
                                <strong className="text-zinc-200">Resume:</strong>{" "}
                                <a href={profile.resumeUrl} target="_blank" rel="noreferrer" className="text-white hover:underline">
                                  View Resume PDF &rarr;
                                </a>
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end mt-4">
                            <div className="flex-1 w-full">
                              <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1">Feedback Note</label>
                              <textarea
                                value={reviewNotes}
                                onChange={(e) => setReviewNotes(e.target.value)}
                                placeholder="Add optional note for the candidate..."
                                className="w-full bg-white/[0.04] border border-white/10 rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-white/40 min-h-[60px]"
                              />
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleReview(profile._id, "approved")}
                                disabled={reviewingId === profile._id}
                                className="bg-white text-[#041826] hover:bg-zinc-200 font-medium px-4 py-2 rounded-xl text-xs transition-all"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReview(profile._id, "rejected")}
                                disabled={reviewingId === profile._id}
                                className="bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 font-medium px-4 py-2 rounded-xl text-xs transition-all"
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

            {activeTab === "forensics" && (
              <div className="bg-[#041a2a]/60 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md">
                <div className="p-5 border-b border-white/10">
                  <h3 className="font-medium text-base text-white">Forensic Session Reports</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">Automated telemetry analysis of completed sessions.</p>
                </div>
                
                <div className="divide-y divide-white/5">
                  {completedMeetings.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500 text-xs">No completed sessions found.</div>
                  ) : (
                    completedMeetings.map((meeting) => (
                      <div key={meeting._id} className="p-5 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                        <div>
                          <h4 className="font-medium text-sm text-white">
                            {meeting.candidateId?.name} with {meeting.interviewerId?.name}
                          </h4>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            {new Date(meeting.scheduledTime).toLocaleString()} • Job: {meeting.jobId || "N/A"}
                          </p>
                        </div>
                        
                        {meeting.forensicReport && !meeting.forensicReport.isProcessing && (
                          <button
                            onClick={() => {
                              setSelectedReport(meeting.forensicReport);
                              setShowReportModal(true);
                            }}
                            className="bg-white/[0.06] hover:bg-white/10 text-white border border-white/10 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all"
                          >
                            View Report
                          </button>
                        )}
                        {meeting.forensicReport?.isProcessing && (
                          <span className="text-xs text-amber-300 animate-pulse">Processing...</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="bg-[#041a2a]/60 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md">
                <div className="p-5 border-b border-white/10">
                  <h3 className="font-medium text-base text-white">Notifications</h3>
                </div>
                <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500 text-xs">No recent notifications.</div>
                  ) : (
                    notifications.map((notif) => (
                      <div key={notif._id} className="p-4 flex items-start gap-3 hover:bg-white/[0.02] transition-colors">
                        <div className="flex-1">
                          <p className="text-xs text-zinc-200">{notif.message}</p>
                          <span className="text-[10px] text-zinc-500 font-mono mt-1 block">
                            {new Date(notif.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Forensic Report Modal */}
      {showReportModal && selectedReport && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#041a2a] border border-white/10 rounded-2xl p-6 sm:p-8 max-w-xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowReportModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white text-base"
            >
              ✕
            </button>
            
            <h3 className="text-xl font-normal text-white mb-4" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
              Forensic Analysis Report
            </h3>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/[0.02] p-3 rounded-xl border border-white/10">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">Time Complexity</span>
                  <span className="text-sm font-mono text-white">{selectedReport.timeComplexity || "N/A"}</span>
                </div>
                <div className="bg-white/[0.02] p-3 rounded-xl border border-white/10">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">Space Complexity</span>
                  <span className="text-sm font-mono text-white">{selectedReport.spaceComplexity || "N/A"}</span>
                </div>
              </div>
              
              <div>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">Code Correctness</span>
                <p className="text-zinc-300 bg-white/[0.02] p-3 rounded-xl border border-white/10">
                  {selectedReport.codeCorrectness || "None recorded."}
                </p>
              </div>

              <div>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">Summary</span>
                <p className="text-zinc-300 bg-white/[0.02] p-3 rounded-xl border border-white/10 whitespace-pre-wrap">
                  {selectedReport.detailedSummary || "None recorded."}
                </p>
              </div>

              <div className="pt-2 text-center">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">AI Recommendation</span>
                <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-medium border ${
                  selectedReport.recommendation?.toLowerCase() === 'offer' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  selectedReport.recommendation?.toLowerCase() === 'reject' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                  'bg-amber-500/10 text-amber-300 border-amber-500/20'
                }`}>
                  {selectedReport.recommendation || "Pending"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
