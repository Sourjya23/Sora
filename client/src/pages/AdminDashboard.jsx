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

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}` };
      const [statsRes, usersRes, profilesRes] = await Promise.all([
        API.get("/admin/stats", { headers }),
        API.get("/admin/users", { headers }),
        API.get("/profile/pending-profiles", { headers })
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setPendingProfiles(profilesRes.data);
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
      alert(`Profile ${status} successfully!`);
      setPendingProfiles(pendingProfiles.filter(p => p._id !== id));
      setReviewNotes("");
      fetchData(); // refresh stats
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
    <div className="min-h-screen bg-transparent text-white flex flex-col font-sans" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-[30px] h-[30px] rounded-[8px] bg-white flex items-center justify-center overflow-hidden">
              <img src="/Sora_Favicon.jpg" alt="Sora Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-[20px] font-extrabold text-white tracking-[-0.01em]">Sora</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-xs bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-[0_0_15px_rgba(251,191,36,0.2)]">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              Founder's Table
            </span>
            <button onClick={handleSignOut} className="text-xs bg-white/5 backdrop-blur-lg hover:bg-white/10 border border-white/10 text-zinc-300 px-4 py-2 rounded-xl transition-all">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">
            Admin Dashboard
          </h2>
          <p className="text-zinc-400 text-sm mt-1">
            Global site metrics, user management, and ultimate evaluation power.
          </p>
        </div>

        <div className="flex space-x-4 mb-6 border-b border-white/10 pb-1">
          <button
            onClick={() => setActiveTab("analytics")}
            className={`pb-2 px-1 text-sm font-semibold transition-colors border-b-2 ${activeTab === "analytics" ? "border-amber-400 text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}
          >
            Analytics Overview
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`pb-2 px-1 text-sm font-semibold transition-colors border-b-2 ${activeTab === "users" ? "border-amber-400 text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}
          >
            Registered Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab("evaluations")}
            className={`pb-2 px-1 text-sm font-semibold transition-colors border-b-2 ${activeTab === "evaluations" ? "border-amber-400 text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}
          >
            Pending Evaluations ({pendingProfiles.length})
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-zinc-400">Loading master database...</div>
        ) : (
          <>
            {activeTab === "analytics" && stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md flex flex-col justify-between">
                  <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Total Site Visits</span>
                  <div className="text-5xl font-extrabold text-white">{stats.siteMetrics?.totalVisits || 0}</div>
                  <div className="text-xs text-emerald-400 mt-2 flex items-center gap-1">Global Traffic</div>
                </div>
                
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md flex flex-col justify-between">
                  <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Registered Visits</span>
                  <div className="text-5xl font-extrabold text-white">{stats.siteMetrics?.registeredVisits || 0}</div>
                  <div className="text-xs text-blue-400 mt-2 flex items-center gap-1">Logged In Traffic</div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md flex flex-col justify-between">
                  <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Total Users</span>
                  <div className="text-5xl font-extrabold text-white">{stats.totalUsers}</div>
                  <div className="text-xs text-amber-400 mt-2 flex items-center gap-1">
                    {stats.candidateUsers} Candidates, {stats.interviewerUsers} Interviewers
                  </div>
                </div>

                <div className="bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30 rounded-3xl p-6 backdrop-blur-md flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute -inset-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 opacity-20 blur-2xl group-hover:opacity-40 transition duration-1000"></div>
                  <span className="text-violet-300 text-xs font-bold uppercase tracking-wider mb-2 relative z-10">Total Profile Views</span>
                  <div className="text-5xl font-extrabold text-white relative z-10">{stats.totalProfileViews}</div>
                  <div className="text-xs text-violet-200 mt-2 relative z-10">Across all candidates</div>
                </div>
              </div>
            )}

            {activeTab === "users" && (
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl overflow-hidden">
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
                  <h3 className="font-semibold text-lg text-white">Master User Directory</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-zinc-300">
                    <thead className="bg-white/5 text-xs uppercase text-zinc-400 font-bold border-b border-white/10">
                      <tr>
                        <th className="px-6 py-4">Name</th>
                        <th className="px-6 py-4">Email</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4">Verification Status</th>
                        <th className="px-6 py-4 text-center">Profile Views</th>
                        <th className="px-6 py-4 text-right">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {users.map((u) => (
                        <tr key={u._id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 font-medium text-white">{u.name}</td>
                          <td className="px-6 py-4">{u.email}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase border ${
                              u.role === 'admin' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                              u.role === 'interviewer' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                              'bg-zinc-800 text-zinc-300 border-zinc-700'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {u.role === 'candidate' ? (
                              <span className={`flex items-center gap-1.5 ${
                                u.profileStatus === 'approved' ? 'text-emerald-400' :
                                u.profileStatus === 'pending' ? 'text-amber-400' :
                                u.profileStatus === 'rejected' ? 'text-rose-400' : 'text-zinc-500'
                              }`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                {u.profileStatus ? u.profileStatus.charAt(0).toUpperCase() + u.profileStatus.slice(1) : "Incomplete"}
                              </span>
                            ) : (
                              <span className="text-zinc-600">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center font-mono">
                            {u.role === 'candidate' ? (u.profileViews || 0) : "-"}
                          </td>
                          <td className="px-6 py-4 text-right text-xs text-zinc-500">
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
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl overflow-hidden">
                <div className="p-6 border-b border-white/10 bg-amber-500/5">
                  <h3 className="font-semibold text-lg text-amber-400">Founder's Evaluation Panel</h3>
                  <p className="text-xs text-zinc-400 mt-1">Only you have the authority to verify and approve candidates for the platform.</p>
                </div>

                <div className="divide-y divide-white/5">
                  {pendingProfiles.length === 0 ? (
                    <div className="p-12 text-center text-zinc-400">
                      <p>No pending profiles to verify. You're all caught up!</p>
                    </div>
                  ) : (
                    pendingProfiles.map((profile) => (
                      <div key={profile._id} className="p-8 flex flex-col gap-6 hover:bg-white/5 transition-colors">
                        <div>
                          <h4 className="font-bold text-2xl text-white mb-1">{profile.name}</h4>
                          <p className="text-amber-400/80 text-sm mb-4 font-mono">{profile.email} • {profile.experienceLevel} • ID: {profile.nationalId}</p>
                          
                          <div className="bg-black/40 backdrop-blur-lg p-5 rounded-2xl border border-white/5 text-sm mb-6">
                            <p className="mb-3 text-zinc-300"><strong className="text-white">Intro:</strong> {profile.intro}</p>
                            <p className="mb-3 text-zinc-300"><strong className="text-white">Skills:</strong> {profile.skills?.join(", ")}</p>
                            {profile.resumeUrl && (
                              <p className="mb-3">
                                <strong className="text-white">Resume:</strong> <a href={profile.resumeUrl} target="_blank" rel="noreferrer" className="text-amber-400 hover:underline">View PDF File &rarr;</a>
                              </p>
                            )}
                            {profile.projects?.length > 0 && (
                              <div className="mt-2">
                                <strong className="text-white">Projects:</strong>
                                <ul className="list-disc pl-5 mt-2 space-y-1.5 text-zinc-300">
                                  {profile.projects.map((proj, i) => (
                                    <li key={i}><a href={proj.link} target="_blank" rel="noreferrer" className="text-amber-400 hover:underline">{proj.title}</a> - {proj.description}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                            <div className="flex-1 w-full">
                              <label className="block text-xs font-bold text-amber-500/70 mb-1.5 uppercase tracking-wider">Evaluation Notes (Sent to Candidate)</label>
                              <textarea
                                value={reviewNotes}
                                onChange={(e) => setReviewNotes(e.target.value)}
                                placeholder="Add official founder feedback for approval or rejection..."
                                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-sm text-zinc-200 outline-none focus:border-amber-500/50 min-h-[80px]"
                              />
                            </div>
                            <div className="flex space-x-3 w-full sm:w-auto">
                              <button
                                onClick={() => handleReview(profile._id, "approved")}
                                disabled={reviewingId === profile._id}
                                className="flex-1 sm:flex-none bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]"
                              >
                                Approve & Verify
                              </button>
                              <button
                                onClick={() => handleReview(profile._id, "rejected")}
                                disabled={reviewingId === profile._id}
                                className="flex-1 sm:flex-none bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30 font-bold px-6 py-3 rounded-xl text-sm transition-all"
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
          </>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;
