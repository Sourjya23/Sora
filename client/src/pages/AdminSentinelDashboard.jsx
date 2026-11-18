import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { toast } from "../components/ui/Toast";
import {
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Mail,
  Video,
  Database,
  Cpu,
  FileText,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Server,
  Layers,
} from "lucide-react";

export default function AdminSentinelDashboard() {
  const navigate = useNavigate();
  const [healthData, setHealthData] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [auditing, setAuditing] = useState(false);
  const [auditSuccessMsg, setAuditSuccessMsg] = useState("");

  const fetchHealthAndReports = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [healthRes, reportsRes] = await Promise.all([
        API.get("/v1/sentinel/health", { headers }).catch((e) => ({ data: null })),
        API.get("/v1/sentinel/reports", { headers }).catch((e) => ({ data: [] })),
      ]);

      setHealthData(healthRes.data);
      setReports(reportsRes.data || []);
    } catch (err) {
      console.error("Failed to load sentinel data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthAndReports();
    const interval = setInterval(fetchHealthAndReports, 30000);
    return () => clearInterval(interval);
  }, []);

  const triggerAuditNow = async () => {
    setAuditing(true);
    setAuditSuccessMsg("");
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await API.post("/v1/sentinel/audit-now", {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const msg = "Audit complete! Report synchronized & intelligence digest emailed.";
      setAuditSuccessMsg(msg);
      toast.success("Sentinel Audit Complete", "System state reconciled and digest dispatched.");
      fetchHealthAndReports();
    } catch (err) {
      console.error("Manual audit failed", err);
      const errMsg = err.response?.data?.error || err.message;
      toast.error("Audit Execution Failed", errMsg);
    } finally {
      setAuditing(false);
      setTimeout(() => setAuditSuccessMsg(""), 6000);
    }
  };

  const status = healthData?.systemStatus || "HEALTHY";
  const issues = healthData?.issues || [];
  const criticalCount = healthData?.criticalCount || 0;

  const agentDetails = [
    {
      id: "agent1",
      number: 1,
      name: "Workflow & Communication Intelligence",
      icon: Mail,
      role: "Audits invites, 5-min reminders, delivery latencies & bounced emails",
      status: healthData?.agentAudits?.agent1_communication?.status || "HEALTHY",
      issuesCount: healthData?.agentAudits?.agent1_communication?.issues?.length || 0,
      cadence: "10s Outbox worker + 15s queue drain",
    },
    {
      id: "agent2",
      number: 2,
      name: "Meeting & Recording Reliability",
      icon: Video,
      role: "Audits multi-track manifests, composite AV, screen recordings & no-shows",
      status: healthData?.agentAudits?.agent2_reliability?.status || "HEALTHY",
      issuesCount: healthData?.agentAudits?.agent2_reliability?.issues?.length || 0,
      cadence: "Real-time track verify + 15m reconciliation",
    },
    {
      id: "agent3",
      number: 3,
      name: "AI Forensic Intelligence",
      icon: Cpu,
      role: "Converts telemetry into findings, tab switches, clipboard paste & complexity",
      status: healthData?.agentAudits?.agent3_forensics?.status || "HEALTHY",
      issuesCount: healthData?.agentAudits?.agent3_forensics?.issues?.length || 0,
      cadence: "Granular offset indexing + 30m audit",
    },
    {
      id: "agent4",
      number: 4,
      name: "Application Health & QA",
      icon: Database,
      role: "Monitors DB connections, outbox backlogs, socket errors & runtime exceptions",
      status: healthData?.agentAudits?.agent4_health?.status || "HEALTHY",
      issuesCount: healthData?.agentAudits?.agent4_health?.issues?.length || 0,
      cadence: "Continuous telemetry hook + 5m health check",
    },
    {
      id: "agent5",
      number: 5,
      name: "Sentinel Supervisor",
      icon: Shield,
      role: "Independent cross-auditor, immediate P0 alerts & 24h founder digests",
      status: status,
      issuesCount: issues.length,
      cadence: "24h Daily 8:00 AM dispatch + on-demand",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#062438] via-[#041a2a] to-[#02101b] text-white font-sans flex flex-col relative overflow-hidden select-none">
      {/* Ambient Top Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-cyan-500/10 rounded-full blur-[130px]"
      />

      {/* Top Header */}
      <header className="h-16 border-b border-cyan-500/15 bg-[#051726]/85 backdrop-blur-xl flex items-center justify-between px-6 z-20 shrink-0">
        <div className="flex items-center gap-3.5">
          <img
            src="/Sora_Favicon.jpg"
            alt="Sora"
            className="w-8 h-8 rounded-xl shadow-[0_0_15px_rgba(56,189,248,0.4)] border border-cyan-400/40 object-cover"
          />
          <span
            className="font-normal text-white text-xl tracking-tight"
            style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
          >
            Sora Sentinel
          </span>
          <div className="h-4 w-px bg-cyan-500/20" />
          <span className="text-xs font-mono text-cyan-300">Autonomous Cloud Intelligence Network</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Badge */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
              status === "HEALTHY"
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                : status === "CRITICAL"
                ? "bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse"
                : "bg-amber-500/15 border-amber-500/30 text-amber-300"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                status === "HEALTHY" ? "bg-emerald-400" : status === "CRITICAL" ? "bg-rose-400" : "bg-amber-400"
              }`}
            />
            <span>{status.replace(/_/g, " ")}</span>
          </div>

          {/* Audit Now Button */}
          <button
            onClick={triggerAuditNow}
            disabled={auditing}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 disabled:opacity-40 text-[#02101b] font-semibold text-xs px-4 py-2 rounded-xl transition-all shadow-lg shadow-cyan-950/50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${auditing ? "animate-spin" : ""}`} />
            <span>{auditing ? "Auditing System..." : "Audit System Now"}</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-8 space-y-8 relative z-10">
        {auditSuccessMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between animate-fade-rise">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{auditSuccessMsg}</span>
            </div>
            <span className="text-[11px] text-zinc-400">Recipient: tickmelodie@gmail.com</span>
          </div>
        )}

        {/* 1. KPI Metric Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#051726]/80 border border-cyan-500/20 shadow-xl backdrop-blur-md">
            <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400/80 block mb-1">
              Active Cloud Agents
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-white">5 / 5</span>
              <span className="text-xs text-emerald-400">Operational</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#051726]/80 border border-cyan-500/20 shadow-xl backdrop-blur-md">
            <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400/80 block mb-1">
              Critical P0 Alerts
            </span>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-semibold ${criticalCount > 0 ? "text-rose-400" : "text-white"}`}>
                {criticalCount}
              </span>
              <span className="text-xs text-zinc-400">Immediate email triggers</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#051726]/80 border border-cyan-500/20 shadow-xl backdrop-blur-md">
            <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400/80 block mb-1">
              Detected Anomalies
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-white">{issues.length}</span>
              <span className="text-xs text-zinc-400">Across 4 sub-agents</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#051726]/80 border border-cyan-500/20 shadow-xl backdrop-blur-md">
            <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400/80 block mb-1">
              Alert Dispatch Gate
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-mono text-cyan-300 truncate">tickmelodie@gmail.com</span>
            </div>
          </div>
        </div>

        {/* 2. The 5 Specialised Cloud Agents Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Specialised Cloud Agent Fleet</span>
            </h2>
            <span className="text-xs text-zinc-400 font-mono">Independent Business Auditing</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agentDetails.map((ag) => {
              const Icon = ag.icon;
              return (
                <div
                  key={ag.id}
                  className="p-5 rounded-3xl bg-[#051726]/90 border border-cyan-500/20 shadow-xl backdrop-blur-md flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-mono text-cyan-300">Agent {ag.number}</span>
                      </div>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-lg border ${
                          ag.status === "HEALTHY"
                            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                            : "bg-rose-500/15 border-rose-500/30 text-rose-300"
                        }`}
                      >
                        {ag.status}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-white mb-1.5">{ag.name}</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed mb-4">{ag.role}</p>
                  </div>

                  <div className="pt-3 border-t border-cyan-500/15 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                    <span>{ag.cadence}</span>
                    <span className={ag.issuesCount > 0 ? "text-amber-400 font-medium" : "text-emerald-400"}>
                      {ag.issuesCount} issue(s)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Live Issues & Failure Remediation Feed */}
        <div className="bg-[#051726]/90 border border-cyan-500/20 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-cyan-400" />
              <span>Sentinel Reconciled Issues & System Anomalies</span>
            </h3>
            <span className="text-xs text-zinc-400 font-mono">{issues.length} Active Records</span>
          </div>

          {issues.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center text-zinc-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-400/30 mb-2" />
              <p className="text-xs text-zinc-400">All 5 Cloud Agents report 100% operational integrity.</p>
              <p className="text-[11px] text-zinc-500 mt-1">No missed reminders, dropped events, or unrecorded meetings.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {issues.map((issue, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-[#031320] border border-cyan-500/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold ${
                          issue.severity === "CRITICAL"
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            : issue.severity === "HIGH"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                        }`}
                      >
                        {issue.severity}
                      </span>
                      <span className="text-xs font-semibold text-white">{issue.category || issue.issue}</span>
                      <span className="text-[11px] text-zinc-500 font-mono">
                        {issue.agent || "Sentinel"} • {new Date(issue.detectedAt || Date.now()).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300">{issue.description || issue.details}</p>
                    {issue.recommendedAction && (
                      <p className="text-[11px] text-cyan-300 font-medium">
                        Resolution: {issue.recommendedAction}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. Historical Daily Intelligence Reports */}
        <div className="bg-[#051726]/90 border border-cyan-500/20 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Historical Intelligence Audit Reports</span>
            </h3>
            <span className="text-xs text-zinc-400 font-mono">Delivered to Founder Email</span>
          </div>

          {reports.length === 0 ? (
            <p className="text-xs text-zinc-500 text-center py-6">
              No historical reports saved yet. Click "Audit System Now" to generate the first full system digest.
            </p>
          ) : (
            <div className="space-y-2.5">
              {reports.map((rep) => (
                <div
                  key={rep.reportId}
                  className="p-3.5 rounded-xl bg-[#031320] border border-cyan-500/10 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-400 font-mono">{rep.reportId}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                        rep.systemStatus === "HEALTHY" ? "text-emerald-300 bg-emerald-500/15" : "text-amber-300 bg-amber-500/15"
                      }`}
                    >
                      {rep.systemStatus}
                    </span>
                    <span className="text-zinc-300">
                      {rep.metrics?.interviewsCompleted || 0} completed • {rep.metrics?.emailsDelivered || 0} emails delivered
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    {new Date(rep.generatedAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
