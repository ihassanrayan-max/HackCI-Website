"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  ArrowLeft,
  Download,
  ShieldAlert,
  Activity,
  BookOpen,
  Upload,
  Trophy,
  Eye,
  EyeOff,
  ChevronDown,
  AlertCircle,
  X,
  Mail,
  GraduationCap,
  Calendar,
  ExternalLink,
  Lock,
  Unlock,
  Crown,
  Trash2,
  UserPlus,
  UserMinus,
  RefreshCw,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MagneticWrapper from "@/components/MagneticWrapper";
import { createClient } from "@/lib/supabase/client";
import {
  checkIsAdmin,
  getAllParticipants,
  updateParticipantStatus,
  getEventState,
  updateEventState,
  getAllResults,
  getAllSubmissions,
  upsertResult,
  clearResult,
  exportParticipantsCSV,
  participantUniversityLabel,
  getAllTeamsAdmin,
  getUnassignedParticipants,
  adminAddMember,
  adminChangeOwner,
  removeMember,
  disbandTeam,
  adminGetJoinRequestsForTeam,
  approveJoinRequest,
  denyJoinRequest,
  type CompParticipant,
  type CompResult,
  type CompSubmission,
  type CompTeam,
  type CompTeamMemberWithParticipant,
  type CompJoinRequestWithParticipant,
  type TrackType,
  type PositionType,
  type ParticipantStatus,
} from "@/lib/db";
import { mapEventState, DEFAULT_EVENT_STATE, type EventState, PRIZE_MAP } from "@/lib/eventState";

// ─── Sub-components ────────────────────────────────────────────────────────────

function ControlButton({
  active,
  onActivate,
  onDeactivate,
  icon: Icon,
  label,
  description,
  color,
  loading,
}: {
  active: boolean;
  onActivate: () => Promise<void>;
  onDeactivate: () => Promise<void>;
  icon: React.ElementType;
  label: string;
  description: string;
  color: "cyan" | "blue" | "yellow";
  loading?: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const [confirmingOff, setConfirmingOff] = useState(false);
  const [busy, setBusy] = useState(false);

  const colorMap = {
    cyan:   { active: "bg-cyan-500/10 border-cyan-500/40 text-cyan-400",   btn: "bg-cyan-500 hover:bg-cyan-400 text-black",   dot: "bg-cyan-400"   },
    blue:   { active: "bg-blue-500/10 border-blue-500/40 text-blue-400",   btn: "bg-blue-500 hover:bg-blue-400 text-white",   dot: "bg-blue-400"   },
    yellow: { active: "bg-yellow-500/10 border-yellow-500/40 text-yellow-400", btn: "bg-yellow-500 hover:bg-yellow-400 text-black", dot: "bg-yellow-400" },
  };
  const c = colorMap[color];

  const handleConfirmOn = async () => {
    setBusy(true);
    await onActivate();
    setBusy(false);
    setConfirming(false);
  };

  const handleConfirmOff = async () => {
    setBusy(true);
    await onDeactivate();
    setBusy(false);
    setConfirmingOff(false);
  };

  return (
    <div className={`border rounded-2xl p-5 transition-all duration-300 ${active ? c.active : "bg-white/[0.02] border-white/10"}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${active ? `${c.active}` : "bg-white/[0.03] border-white/10"}`}>
            <Icon className={`w-5 h-5 ${active ? "" : "text-zinc-500"}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-sm">{label}</p>
              {active && <div className={`w-1.5 h-1.5 rounded-full ${c.dot} animate-pulse`} />}
            </div>
            <p className="text-zinc-500 text-xs mt-0.5">{description}</p>
          </div>
        </div>

        <div className="shrink-0">
          {!active ? (
            confirming ? (
              <div className="flex items-center gap-2">
                <button onClick={() => setConfirming(false)} className="px-3 py-1.5 rounded-xl text-xs border border-white/10 hover:bg-white/5 transition-colors">Cancel</button>
                <button onClick={handleConfirmOn} disabled={busy} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${c.btn} transition-colors disabled:opacity-50`}>
                  {busy ? "..." : "Confirm"}
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirming(true)} disabled={loading} className="px-4 py-1.5 rounded-xl text-xs font-bold border border-white/10 hover:bg-white/5 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                <Lock className="w-3 h-3" /> Activate
              </button>
            )
          ) : (
            confirmingOff ? (
              <div className="flex items-center gap-2">
                <button onClick={() => setConfirmingOff(false)} className="px-3 py-1.5 rounded-xl text-xs border border-white/10 hover:bg-white/5 transition-colors">Cancel</button>
                <button onClick={handleConfirmOff} disabled={busy} className="px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-700 hover:bg-zinc-600 text-white transition-colors disabled:opacity-50">
                  {busy ? "..." : "Disable"}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-3 py-1 rounded-full border border-current opacity-70">LIVE</span>
                <button onClick={() => setConfirmingOff(true)} disabled={loading} className="px-3 py-1.5 rounded-xl text-xs border border-white/10 hover:bg-white/5 transition-colors disabled:opacity-50 flex items-center gap-1.5 text-zinc-400">
                  <Unlock className="w-3 h-3" /> Disable
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function ResultDropdown({
  entityId,
  currentResult,
  onAssign,
  onClear,
  disabled,
}: {
  entityId: string;
  currentResult: CompResult | null;
  onAssign: (id: string, track: TrackType, position: PositionType) => Promise<void>;
  onClear: (id: string) => Promise<void>;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (disabled) {
    return (
      <span className="text-xs text-zinc-600 font-mono px-3 py-1.5 rounded-xl border border-white/5 bg-white/[0.02]">
        —
      </span>
    );
  }

  const options: { track: TrackType; position: PositionType; label: string }[] = [
    { track: "A", position: 1, label: "Track A — 1st Place" },
    { track: "A", position: 2, label: "Track A — 2nd Place" },
    { track: "B", position: 1, label: "Track B — 1st Place" },
    { track: "B", position: 2, label: "Track B — 2nd Place" },
  ];

  const currentLabel = currentResult
    ? `Track ${currentResult.track} — ${currentResult.position === 1 ? "1st" : "2nd"}`
    : "Assign result";

  const handleAssign = async (track: TrackType, position: PositionType) => {
    setBusy(true);
    await onAssign(entityId, track, position);
    setBusy(false);
    setOpen(false);
  };

  const handleClear = async () => {
    setBusy(true);
    await onClear(entityId);
    setBusy(false);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={busy}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs border transition-all disabled:opacity-50 ${
          currentResult ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-400 font-bold" : "border-white/10 text-zinc-400 hover:bg-white/5"
        }`}
      >
        {busy ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> : currentResult ? "🏆 " : null}
        {currentLabel}
        <ChevronDown className="w-3 h-3" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            className="absolute right-0 top-full mt-2 w-52 bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50"
          >
            {options.map((opt) => (
              <button
                key={`${opt.track}-${opt.position}`}
                onClick={() => handleAssign(opt.track, opt.position)}
                className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition-colors text-zinc-300 hover:text-white"
              >
                {opt.label}
                <div className="text-xs text-zinc-500 mt-0.5">{PRIZE_MAP[opt.position]}</div>
              </button>
            ))}
            {currentResult && (
              <>
                <div className="border-t border-white/10" />
                <button onClick={handleClear} className="w-full text-left px-4 py-3 text-sm hover:bg-red-500/10 text-red-400 transition-colors">
                  Clear result
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Participant Detail Slide-Over ──────────────────────────────────────────────

/** Suggested filename for resume download from public storage URL. */
function resumeFileNameFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname.split("/").pop() ?? "resume";
    const decoded = decodeURIComponent(path);
    return decoded || "resume.pdf";
  } catch {
    return "resume.pdf";
  }
}

function ParticipantDetail({
  participant,
  submission,
  result,
  onClose,
  onStatusChange,
}: {
  participant: CompParticipant;
  submission: CompSubmission | null;
  result: CompResult | null;
  onClose: () => void;
  onStatusChange: (id: string, status: ParticipantStatus) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  const handleStatus = async (status: ParticipantStatus) => {
    setBusy(true);
    await onStatusChange(participant.id, status);
    setBusy(false);
  };

  const universityLabel = participantUniversityLabel(participant);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-end"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="relative z-10 w-full max-w-lg h-full bg-[#0a0a0a] border-l border-white/10 overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/10 px-8 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black tracking-tighter">{participant.full_name}</h2>
            <p className="text-zinc-500 text-sm font-mono mt-0.5">{participant.email}</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-8 space-y-6">

          {/* Status */}
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black tracking-widest uppercase
              ${participant.status === "approved" ? "bg-green-500/10 text-green-400 border border-green-500/20"
              : participant.status === "rejected" ? "bg-red-500/10 text-red-400 border border-red-500/20"
              : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"}`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${participant.status === "approved" ? "bg-green-400" : participant.status === "rejected" ? "bg-red-400" : "bg-yellow-400 animate-pulse"}`} />
              {participant.status}
            </span>
            <div className="flex items-center gap-2">
              {participant.status !== "approved" && (
                <button
                  onClick={() => handleStatus("approved")}
                  disabled={busy}
                  className="interactive p-2 text-zinc-500 hover:text-green-400 hover:bg-green-400/10 rounded-xl transition-all border border-transparent hover:border-green-400/20 disabled:opacity-50"
                  title="Approve"
                >
                  <CheckCircle2 className="w-5 h-5" />
                </button>
              )}
              {participant.status !== "rejected" && (
                <button
                  onClick={() => handleStatus("rejected")}
                  disabled={busy}
                  className="interactive p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all border border-transparent hover:border-red-400/20 disabled:opacity-50"
                  title="Reject"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Profile details */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Profile</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1">
                  <GraduationCap className="w-3.5 h-3.5" /> University
                </div>
                <p className="text-white font-medium">{universityLabel}</p>
                {participant.student_id && (
                  <p className="text-zinc-500 text-xs font-mono mt-0.5">ID: {participant.student_id}</p>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1">
                  <Activity className="w-3.5 h-3.5" /> Program
                </div>
                <p className="text-white font-medium">{participant.program}</p>
                <p className="text-zinc-500 text-xs mt-0.5">Year {participant.year_of_study}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1">
                  <Mail className="w-3.5 h-3.5" /> Age
                </div>
                <p className="text-white font-medium">{participant.age}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1">
                  <Calendar className="w-3.5 h-3.5" /> Registered
                </div>
                <p className="text-white font-medium">{new Date(participant.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Application (registration form) */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Application</h3>
            <div>
              <p className="text-zinc-500 text-xs mb-2">Goals</p>
              <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                {participant.goals?.trim() ? participant.goals : "—"}
              </p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs mb-2">Dietary restrictions</p>
              <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                {participant.dietary_restrictions?.trim() ? participant.dietary_restrictions : "—"}
              </p>
            </div>
          </div>

          {/* Professional links */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 space-y-3">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Links</h3>
            <div className="space-y-2 text-sm">
              {[
                { label: "LinkedIn", url: participant.linkedin_url },
                { label: "GitHub", url: participant.github_url },
                { label: "Portfolio", url: participant.portfolio_url },
              ].map(({ label, url }) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <span className="text-zinc-500 text-xs">{label}</span>
                  {url?.trim() ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium truncate"
                    >
                      {url}
                    </a>
                  ) : (
                    <span className="text-zinc-600">Not provided</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Resume (uploaded at registration) */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 space-y-3">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" />
              Resume
            </h3>
            {participant.resume_url?.trim() ? (
              <div className="flex flex-wrap gap-2">
                <a
                  href={participant.resume_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 text-sm font-medium transition-colors"
                >
                  <ExternalLink className="w-4 h-4 shrink-0" />
                  Open / view
                </a>
                <a
                  href={participant.resume_url}
                  download={resumeFileNameFromUrl(participant.resume_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10 text-sm font-medium transition-colors"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  Download
                </a>
              </div>
            ) : (
              <p className="text-zinc-600 text-sm">No resume on file.</p>
            )}
          </div>

          {/* Hackathon submission (Drive) — separate from application resume */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 space-y-3">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Hackathon submission</h3>
            <p className="text-zinc-600 text-xs -mt-1">Project deliverable (Google Drive link), not the registration resume.</p>
            {submission ? (
              <div className="space-y-2">
                <a
                  href={submission.drive_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors text-sm font-medium"
                >
                  <ExternalLink className="w-4 h-4 shrink-0" />
                  <span className="truncate">{submission.drive_link}</span>
                </a>
                <p className="text-zinc-600 text-xs font-mono">
                  Submitted {new Date(submission.submitted_at).toLocaleString()}
                </p>
              </div>
            ) : (
              <p className="text-zinc-600 text-sm">No submission yet.</p>
            )}
          </div>

          {/* Team result (read-only; assign in Teams tab) */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 space-y-3">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Team result</h3>
            <p className="text-zinc-400 text-sm">
              {result
                ? `Track ${result.track} — ${result.position === 1 ? "1st Place" : "2nd Place"} (${PRIZE_MAP[result.position as 1 | 2]})`
                : "No result assigned for this participant's team. Assign in Teams tab."}
            </p>
          </div>

        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Admin Teams Tab ─────────────────────────────────────────────────────────────

function AdminTeamsTab({
  teams,
  unassignedParticipants,
  selectedTeamId,
  teamJoinRequests,
  teamSearchTerm,
  setTeamSearchTerm,
  teamBusy,
  teamError,
  setTeamError,
  addMemberTeamId,
  setAddMemberTeamId,
  addMemberParticipantId,
  setAddMemberParticipantId,
  onSelectTeam,
  onCloseTeam,
  onAddMember,
  onRemoveMember,
  onChangeOwner,
  onDisband,
  onApproveRequest,
  onDenyRequest,
  results,
  onAssignResult,
  onClearResult,
}: {
  teams: { team: CompTeam; members: CompTeamMemberWithParticipant[]; owner_name: string }[];
  unassignedParticipants: CompParticipant[];
  selectedTeamId: string | null;
  teamJoinRequests: CompJoinRequestWithParticipant[];
  teamSearchTerm: string;
  setTeamSearchTerm: (v: string) => void;
  teamBusy: boolean;
  teamError: string | null;
  setTeamError: (v: string | null) => void;
  addMemberTeamId: string | null;
  setAddMemberTeamId: (v: string | null) => void;
  addMemberParticipantId: string;
  setAddMemberParticipantId: (v: string) => void;
  onSelectTeam: (teamId: string) => void;
  onCloseTeam: () => void;
  onAddMember: (teamId: string, participantId: string) => Promise<void>;
  onRemoveMember: (participantId: string) => Promise<void>;
  onChangeOwner: (teamId: string, newOwnerId: string) => Promise<void>;
  onDisband: (teamId: string) => Promise<void>;
  onApproveRequest: (req: CompJoinRequestWithParticipant) => Promise<void>;
  onDenyRequest: (req: CompJoinRequestWithParticipant) => Promise<void>;
  results: CompResult[];
  onAssignResult: (teamId: string, track: TrackType, position: PositionType) => Promise<void>;
  onClearResult: (teamId: string) => Promise<void>;
}) {
  const [addMemberSearchQuery, setAddMemberSearchQuery] = useState("");
  const closeAddMemberModal = () => {
    setAddMemberTeamId(null);
    setAddMemberParticipantId("");
    setAddMemberSearchQuery("");
  };
  useEffect(() => {
    if (!addMemberTeamId) setAddMemberSearchQuery("");
  }, [addMemberTeamId]);
  const fullTeams = teams.filter((t) => t.members.length >= 4).length;
  const totalMembers = teams.reduce((sum, t) => sum + t.members.length, 0);

  const teamSearchQ = teamSearchTerm.trim().toLowerCase();
  const filteredTeams = !teamSearchQ ? teams : teams.filter((t) =>
    (t.team.name ?? "").toLowerCase().includes(teamSearchQ) ||
    (t.owner_name ?? "").toLowerCase().includes(teamSearchQ)
  );

  const selectedTeamData = selectedTeamId ? teams.find((t) => t.team.id === selectedTeamId) : null;

  return (
    <>
      {/* Team Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: "TOTAL TEAMS", value: teams.length, Icon: Users, color: "text-cyan-400", border: "border-cyan-500/20", bg: "from-cyan-500/10 to-transparent" },
          { label: "FULL TEAMS", value: fullTeams, Icon: CheckCircle2, color: "text-green-400", border: "border-green-500/20", bg: "from-green-500/10 to-transparent" },
          { label: "UNASSIGNED", value: unassignedParticipants.length, Icon: UserPlus, color: "text-yellow-400", border: "border-yellow-500/20", bg: "from-yellow-500/10 to-transparent" },
        ].map(({ label, value, Icon, color, border, bg }) => (
          <div key={label} className={`border ${border} rounded-2xl p-6 relative overflow-hidden group bg-gradient-to-br ${bg}`}>
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Icon className="w-24 h-24" />
            </div>
            <div className={`font-mono text-xs mb-4 ${color}`}>{label}</div>
            <div className={`text-5xl font-black ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Error Banner */}
      <AnimatePresence>
        {teamError && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-3 px-5 py-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm flex-1">{teamError}</p>
              <button onClick={() => setTeamError(null)} className="text-xs underline opacity-60 hover:opacity-100 transition-opacity shrink-0">Dismiss</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search + Add Member */}
      <div className="bg-white/[0.02] border border-white/10 rounded-[2rem] p-6 flex flex-col md:flex-row gap-6 justify-between items-center backdrop-blur-md">
        <div className="relative w-full md:max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-red-400 transition-colors" />
          <input
            type="text"
            placeholder="Search teams..."
            value={teamSearchTerm}
            onChange={(e) => setTeamSearchTerm(e.target.value)}
            className="w-full bg-black border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-red-500/50 focus:bg-white/[0.02] transition-all font-mono"
          />
        </div>
        <div className="text-xs font-mono text-zinc-500">
          {totalMembers} placed / {unassignedParticipants.length} unassigned
        </div>
      </div>

      {/* Teams Table */}
      <div className="bg-black border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="p-6 font-mono text-xs text-zinc-500 tracking-widest">TEAM NAME</th>
                <th className="p-6 font-mono text-xs text-zinc-500 tracking-widest">OWNER</th>
                <th className="p-6 font-mono text-xs text-zinc-500 tracking-widest">MEMBERS</th>
                <th className="p-6 font-mono text-xs text-zinc-500 tracking-widest">RESULT</th>
                <th className="p-6 font-mono text-xs text-zinc-500 tracking-widest text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredTeams.map(({ team, members, owner_name }) => {
                  const teamResult = results.find((r) => r.team_id === team.id) ?? null;
                  return (
                  <motion.tr
                    key={team.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group cursor-pointer"
                    onClick={() => onSelectTeam(team.id)}
                  >
                    <td className="p-6">
                      <div className="font-bold text-base">{team.name}</div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2 text-sm">
                        <Crown className="w-3.5 h-3.5 text-yellow-500" />
                        <span className="text-zinc-300">{owner_name}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className={`text-xs font-mono px-2.5 py-1 rounded-full border ${
                        members.length >= 4
                          ? "border-green-500/20 text-green-400 bg-green-500/10"
                          : "border-white/10 text-zinc-400 bg-white/5"
                      }`}>
                        {members.length} / 4
                      </span>
                    </td>
                    <td className="p-6" onClick={(e) => e.stopPropagation()}>
                      <ResultDropdown
                        entityId={team.id}
                        currentResult={teamResult}
                        onAssign={onAssignResult}
                        onClear={onClearResult}
                      />
                    </td>
                    <td className="p-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-3 opacity-50 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onSelectTeam(team.id)}
                          className="interactive p-2 text-zinc-500 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-xl transition-all border border-transparent hover:border-cyan-400/20"
                          title="View team"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        {members.length < 4 && (
                          <button
                            onClick={() => setAddMemberTeamId(team.id)}
                            className="interactive p-2 text-zinc-500 hover:text-green-400 hover:bg-green-400/10 rounded-xl transition-all border border-transparent hover:border-green-400/20"
                            title="Add member"
                          >
                            <UserPlus className="w-5 h-5" />
                          </button>
                        )}
                        <AdminDisbandButton teamId={team.id} onDisband={onDisband} busy={teamBusy} />
                      </div>
                    </td>
                  </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
          {filteredTeams.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-20 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 border border-white/10 rounded-2xl flex items-center justify-center mb-4 bg-white/5">
                <Users className="w-6 h-6 text-zinc-600" />
              </div>
              <div className="text-xl font-bold mb-2">No Teams</div>
              <div className="text-zinc-500 font-mono text-sm">{teamSearchTerm ? "NO MATCHES" : "NO TEAMS CREATED YET"}</div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Add Member Modal */}
      <AnimatePresence>
        {addMemberTeamId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={(e) => { if (e.target === e.currentTarget) closeAddMemberModal(); }}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeAddMemberModal} />
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="relative z-10 bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black tracking-tighter">Add Member to Team</h3>
                <button onClick={closeAddMemberModal} className="w-8 h-8 rounded-xl border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/5 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-zinc-500 text-sm mb-4">
                Team: <span className="text-white font-bold">{teams.find((t) => t.team.id === addMemberTeamId)?.team.name ?? "Unknown"}</span>
              </p>
              {unassignedParticipants.length > 0 ? (
                <>
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      value={addMemberSearchQuery}
                      onChange={(e) => setAddMemberSearchQuery(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-red-500/50 font-mono text-sm"
                    />
                  </div>
                  {(() => {
                    const pickerQ = addMemberSearchQuery.trim().toLowerCase();
                    const pickerFiltered = !pickerQ ? unassignedParticipants : unassignedParticipants.filter((p) =>
                      (p.full_name ?? "").toLowerCase().includes(pickerQ) ||
                      (p.email ?? "").toLowerCase().includes(pickerQ) ||
                      (p.program ?? "").toLowerCase().includes(pickerQ)
                    );
                    return (
                      <>
                        <div className="max-h-60 overflow-y-auto border border-white/10 rounded-xl mb-2 divide-y divide-white/5">
                          {pickerFiltered.length > 0 ? (
                            pickerFiltered.map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => setAddMemberParticipantId(p.id)}
                                className={`w-full text-left px-4 py-3 transition-colors ${addMemberParticipantId === p.id ? "bg-cyan-500/20 border-l-2 border-l-cyan-400" : "hover:bg-white/5"}`}
                              >
                                <span className="font-medium text-sm block">{p.full_name}</span>
                                <span className="text-zinc-500 text-xs">{p.email}</span>
                              </button>
                            ))
                          ) : (
                            <p className="text-center py-6 text-zinc-600 text-sm">No matches</p>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 mb-3">
                          {pickerQ ? `${pickerFiltered.length} matches` : `${unassignedParticipants.length} unassigned — type to filter`}
                        </p>
                      </>
                    );
                  })()}
                  <button
                    onClick={() => addMemberParticipantId && handleAdminAddMemberFromModal(addMemberTeamId, addMemberParticipantId)}
                    disabled={!addMemberParticipantId || teamBusy}
                    className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {teamBusy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                    Add to Team
                  </button>
                </>
              ) : (
                <p className="text-zinc-600 text-sm text-center py-4">All approved participants are already assigned to a team.</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Team Detail Slide-Over */}
      <AnimatePresence>
        {selectedTeamData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-end"
            onClick={(e) => { if (e.target === e.currentTarget) onCloseTeam(); }}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCloseTeam} />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative z-10 w-full max-w-lg h-full bg-[#0a0a0a] border-l border-white/10 overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/10 px-8 py-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black tracking-tighter">{selectedTeamData.team.name}</h2>
                  <p className="text-zinc-500 text-sm font-mono mt-0.5">{selectedTeamData.members.length}/4 members</p>
                </div>
                <button onClick={onCloseTeam} className="w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/5 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-8 space-y-6">

                {/* Result */}
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 space-y-4">
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Result</h3>
                  <div className="flex items-center justify-between">
                    <p className="text-zinc-400 text-sm">
                      {(results.find((r) => r.team_id === selectedTeamData.team.id) ?? null)
                        ? (() => {
                            const res = results.find((r) => r.team_id === selectedTeamData.team.id)!;
                            return `Track ${res.track} — ${res.position === 1 ? "1st Place" : "2nd Place"} (${PRIZE_MAP[res.position as 1 | 2]})`;
                          })()
                        : "No result assigned"}
                    </p>
                    <ResultDropdown
                      entityId={selectedTeamData.team.id}
                      currentResult={results.find((r) => r.team_id === selectedTeamData.team.id) ?? null}
                      onAssign={onAssignResult}
                      onClear={onClearResult}
                    />
                  </div>
                </div>

                {/* Members */}
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 space-y-4">
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Members</h3>
                  <div className="space-y-3">
                    {selectedTeamData.members.map((member) => {
                      const name = member.comp_participants?.full_name?.trim() || "Unknown";
                      const isOwner = member.participant_id === selectedTeamData.team.owner_id;
                      return (
                        <div key={member.id} className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold select-none ${isOwner ? "bg-gradient-to-br from-cyan-400 to-blue-600 text-black" : "bg-zinc-800 border border-white/10 text-white"}`}>
                              {name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-bold flex items-center gap-1.5">
                                {name}
                                {isOwner && <Crown className="w-3.5 h-3.5 text-yellow-500" />}
                              </p>
                              <p className="text-xs text-zinc-500 font-mono">{member.comp_participants?.email ?? ""}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {!isOwner && (
                              <button
                                onClick={() => onChangeOwner(selectedTeamData.team.id, member.participant_id)}
                                disabled={teamBusy}
                                title="Make team leader"
                                className="p-1.5 text-zinc-600 hover:text-yellow-400 hover:bg-yellow-400/10 rounded-lg transition-all disabled:opacity-40"
                              >
                                <Crown className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => onRemoveMember(member.participant_id)}
                              disabled={teamBusy}
                              title="Remove from team"
                              className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all disabled:opacity-40"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Quick add member */}
                  {selectedTeamData.members.length < 4 && unassignedParticipants.length > 0 && (
                    <button
                      onClick={() => setAddMemberTeamId(selectedTeamData.team.id)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-white/10 rounded-xl text-xs text-zinc-500 hover:text-cyan-400 hover:border-cyan-500/30 transition-all"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Add Member
                    </button>
                  )}
                </div>

                {/* Pending Join Requests */}
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Pending Requests</h3>
                    {teamJoinRequests.length > 0 && (
                      <span className="text-xs font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded-full">{teamJoinRequests.length}</span>
                    )}
                  </div>
                  {teamJoinRequests.length > 0 ? (
                    <div className="space-y-2">
                      {teamJoinRequests.map((req) => {
                        const reqName = req.comp_participants?.full_name?.trim() || "Unknown";
                        return (
                          <div key={req.id} className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
                            <div>
                              <p className="text-sm font-bold">{reqName}</p>
                              <p className="text-xs text-zinc-500 font-mono">{req.comp_participants?.email ?? ""}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => onApproveRequest(req)}
                                disabled={teamBusy || selectedTeamData.members.length >= 4}
                                title="Approve"
                                className="p-1.5 text-zinc-500 hover:text-green-400 hover:bg-green-400/10 rounded-lg transition-all disabled:opacity-40"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onDenyRequest(req)}
                                disabled={teamBusy}
                                title="Deny"
                                className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all disabled:opacity-40"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-zinc-600 text-sm text-center py-2">No pending join requests.</p>
                  )}
                </div>

                {/* Disband */}
                <div className="pt-4 border-t border-white/5">
                  <AdminDisbandButton teamId={selectedTeamData.team.id} onDisband={onDisband} busy={teamBusy} />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  function handleAdminAddMemberFromModal(teamId: string, participantId: string) {
    onAddMember(teamId, participantId);
  }
}

function AdminDisbandButton({ teamId, onDisband, busy }: { teamId: string; onDisband: (id: string) => Promise<void>; busy: boolean }) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-400">Disband?</span>
        <button onClick={() => setConfirming(false)} className="px-2 py-1 rounded-lg text-xs border border-white/10 hover:bg-white/5 transition-colors">No</button>
        <button
          onClick={() => { onDisband(teamId); setConfirming(false); }}
          disabled={busy}
          className="px-2 py-1 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-50"
        >
          {busy ? <RefreshCw className="w-3 h-3 animate-spin inline" /> : "Yes"}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={(e) => { e.stopPropagation(); setConfirming(true); }}
      disabled={busy}
      className="interactive p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all border border-transparent hover:border-red-400/20 disabled:opacity-40"
      title="Disband team"
    >
      <Trash2 className="w-5 h-5" />
    </button>
  );
}

// ─── Admin Login Screen ─────────────────────────────────────────────────────────

function AdminLoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: username, password });
    if (signInError) {
      setError("Invalid credentials. Please try again.");
      setIsLoading(false);
      return;
    }
    const isAdmin = await checkIsAdmin(supabase);
    if (!isAdmin) {
      await supabase.auth.signOut();
      setError("This account does not have admin privileges.");
      setIsLoading(false);
      return;
    }
    onSuccess();
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center px-6">
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/5 rounded-full blur-[120px] pointer-events-none" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="text-center mb-10">
          <div className="relative inline-flex items-center justify-center w-16 h-16 mb-6">
            <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping" />
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
              <ShieldAlert className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <h1 className="text-3xl font-black tracking-tighter mb-2">Admin Panel</h1>
          <p className="text-zinc-500 text-sm font-mono">Sign in to continue</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <label className="absolute left-4 top-2 text-xs text-zinc-500 pointer-events-none">Email</label>
            <input
              type="email"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(""); }}
              required
              autoComplete="email"
              className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-4 pt-6 pb-3 text-white focus:outline-none focus:border-red-500/50 transition-all font-mono"
            />
          </div>
          <div className="relative">
            <label className="absolute left-4 top-2 text-xs text-zinc-500 pointer-events-none">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              required
              autoComplete="current-password"
              className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-4 pt-6 pb-3 pr-12 text-white focus:outline-none focus:border-red-500/50 transition-all font-mono"
            />
            <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>
          <button type="submit" disabled={isLoading} className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-colors flex items-center justify-center gap-3">
            {isLoading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Signing in...</> : <><Lock className="w-4 h-4" />Sign In</>}
          </button>
        </form>
        <div className="mt-8 text-center">
          <Link href="/" className="text-zinc-600 hover:text-zinc-400 transition-colors text-sm">← Return to site</Link>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Admin Page ────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  const [activeTab, setActiveTab] = useState<"participants" | "teams">("participants");

  const [participants, setParticipants] = useState<CompParticipant[]>([]);
  const [results, setResults] = useState<CompResult[]>([]);
  const [submissions, setSubmissions] = useState<CompSubmission[]>([]);
  const [eventState, setLocalEventState] = useState<EventState>(DEFAULT_EVENT_STATE);
  const [dataLoading, setDataLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Detail view
  const [selectedParticipant, setSelectedParticipant] = useState<CompParticipant | null>(null);

  // Teams tab state
  const [adminTeams, setAdminTeams] = useState<{ team: CompTeam; members: CompTeamMemberWithParticipant[]; owner_name: string }[]>([]);
  const [unassignedParticipants, setUnassignedParticipants] = useState<CompParticipant[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [teamJoinRequests, setTeamJoinRequests] = useState<CompJoinRequestWithParticipant[]>([]);
  const [teamSearchTerm, setTeamSearchTerm] = useState("");
  const [teamBusy, setTeamBusy] = useState(false);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [addMemberTeamId, setAddMemberTeamId] = useState<string | null>(null);
  const [addMemberParticipantId, setAddMemberParticipantId] = useState("");

  // Check auth on mount
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setAuthLoading(false); return; }
      const admin = await checkIsAdmin(supabase);
      if (admin) setIsAuthenticated(true);
      setAuthLoading(false);
    });
  }, []);

  // Load data once authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    const supabase = createClient();

    async function load() {
      const [ps, es, rs, subs, teams, unassigned] = await Promise.all([
        getAllParticipants(supabase),
        getEventState(supabase).catch(() => null),
        getAllResults(supabase),
        getAllSubmissions(supabase).catch(() => []),
        getAllTeamsAdmin(supabase).catch(() => []),
        getUnassignedParticipants(supabase).catch(() => []),
      ]);
      setParticipants(ps);
      if (es) setLocalEventState(mapEventState(es));
      setResults(rs);
      setSubmissions(subs);
      setAdminTeams(teams);
      setUnassignedParticipants(unassigned);
      setDataLoading(false);
    }

    load();
  }, [isAuthenticated]);

  const handleLogout = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleStatusChange = async (id: string, status: ParticipantStatus) => {
    const supabase = createClient();
    await updateParticipantStatus(supabase, id, status);
    setParticipants((ps) => ps.map((p) => (p.id === id ? { ...p, status } : p)));
    // Update selected participant if open
    setSelectedParticipant((sp) => sp?.id === id ? { ...sp, status } : sp);
  };

  const handleToggleControl = async (
    key: "briefing_released" | "submissions_open" | "results_released" | "applications_open" | "team_changes_open",
    value: boolean
  ) => {
    const supabase = createClient();
    await updateEventState(supabase, { [key]: value });
    setLocalEventState((s) => ({
      ...s,
      briefingReleased: key === "briefing_released" ? value : s.briefingReleased,
      submissionsOpen: key === "submissions_open" ? value : s.submissionsOpen,
      resultsReleased: key === "results_released" ? value : s.resultsReleased,
      applicationsOpen: key === "applications_open" ? value : s.applicationsOpen,
      teamChangesOpen: key === "team_changes_open" ? value : s.teamChangesOpen,
    }));
  };

  const handleAssignResult = async (teamId: string, track: TrackType, position: PositionType) => {
    const supabase = createClient();
    const newResult = await upsertResult(supabase, teamId, track, position);
    setResults((rs) => {
      const filtered = rs.filter(
        (r) => r.team_id !== teamId && !(r.track === track && r.position === position)
      );
      return [...filtered, newResult];
    });
  };

  const handleClearResult = async (teamId: string) => {
    const supabase = createClient();
    await clearResult(supabase, teamId);
    setResults((rs) => rs.filter((r) => r.team_id !== teamId));
  };

  const handleExport = () => {
    const csv = exportParticipantsCSV(participants);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `citech-participants-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Team management handlers ──────────────────────────────────────────────

  const refreshTeamsData = async () => {
    const supabase = createClient();
    const [teams, unassigned] = await Promise.all([
      getAllTeamsAdmin(supabase).catch(() => []),
      getUnassignedParticipants(supabase).catch(() => []),
    ]);
    setAdminTeams(teams);
    setUnassignedParticipants(unassigned);
  };

  const handleAdminAddMember = async (teamId: string, participantId: string) => {
    setTeamBusy(true);
    setTeamError(null);
    try {
      const supabase = createClient();
      await adminAddMember(supabase, teamId, participantId);
      await refreshTeamsData();
      setAddMemberTeamId(null);
      setAddMemberParticipantId("");
    } catch (err: any) {
      setTeamError(err?.message ?? "Failed to add member.");
    } finally {
      setTeamBusy(false);
    }
  };

  const handleAdminRemoveMember = async (participantId: string) => {
    setTeamBusy(true);
    setTeamError(null);
    try {
      const supabase = createClient();
      await removeMember(supabase, participantId);
      await refreshTeamsData();
      if (selectedTeamId) {
        const reqs = await adminGetJoinRequestsForTeam(supabase, selectedTeamId);
        setTeamJoinRequests(reqs);
      }
    } catch (err: any) {
      setTeamError(err?.message ?? "Failed to remove member.");
    } finally {
      setTeamBusy(false);
    }
  };

  const handleAdminChangeOwner = async (teamId: string, newOwnerId: string) => {
    setTeamBusy(true);
    setTeamError(null);
    try {
      const supabase = createClient();
      await adminChangeOwner(supabase, teamId, newOwnerId);
      await refreshTeamsData();
    } catch (err: any) {
      setTeamError(err?.message ?? "Failed to change owner.");
    } finally {
      setTeamBusy(false);
    }
  };

  const handleAdminDisband = async (teamId: string) => {
    setTeamBusy(true);
    setTeamError(null);
    try {
      const supabase = createClient();
      await disbandTeam(supabase, teamId);
      setSelectedTeamId(null);
      setTeamJoinRequests([]);
      await refreshTeamsData();
    } catch (err: any) {
      setTeamError(err?.message ?? "Failed to disband team.");
    } finally {
      setTeamBusy(false);
    }
  };

  const handleSelectTeamForDetail = async (teamId: string) => {
    setSelectedTeamId(teamId);
    setTeamError(null);
    const supabase = createClient();
    const reqs = await adminGetJoinRequestsForTeam(supabase, teamId).catch(() => []);
    setTeamJoinRequests(reqs);
  };

  const handleAdminApproveRequest = async (req: CompJoinRequestWithParticipant) => {
    setTeamBusy(true);
    setTeamError(null);
    try {
      const supabase = createClient();
      await approveJoinRequest(supabase, req.id, req.team_id, req.participant_id);
      await refreshTeamsData();
      const reqs = await adminGetJoinRequestsForTeam(supabase, req.team_id);
      setTeamJoinRequests(reqs);
    } catch (err: any) {
      setTeamError(err?.message ?? "Failed to approve request.");
    } finally {
      setTeamBusy(false);
    }
  };

  const handleAdminDenyRequest = async (req: CompJoinRequestWithParticipant) => {
    setTeamBusy(true);
    setTeamError(null);
    try {
      const supabase = createClient();
      await denyJoinRequest(supabase, req.id);
      const reqs = await adminGetJoinRequestsForTeam(supabase, req.team_id);
      setTeamJoinRequests(reqs);
    } catch (err: any) {
      setTeamError(err?.message ?? "Failed to deny request.");
    } finally {
      setTeamBusy(false);
    }
  };

  const searchQ = searchTerm.trim().toLowerCase();
  const filteredParticipants = participants.filter((p) => {
    const matchesSearch = !searchQ ||
      (p.full_name ?? "").toLowerCase().includes(searchQ) ||
      (p.email ?? "").toLowerCase().includes(searchQ) ||
      (p.program ?? "").toLowerCase().includes(searchQ) ||
      (p.university === "otu" ? "ontario tech" : (p.university_name ?? "")).toLowerCase().includes(searchQ);
    const matchesFilter = filterStatus === "all" || p.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: participants.length,
    approved: participants.filter((p) => p.status === "approved").length,
    pending: participants.filter((p) => p.status === "pending").length,
  };

  if (authLoading || signingOut) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLoginScreen onSuccess={() => setIsAuthenticated(true)} />;
  }

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const selectedSubmission = selectedParticipant
    ? (submissions.find((s) => s.participant_id === selectedParticipant.id) ?? null)
    : null;
  const selectedParticipantTeamId = selectedParticipant && adminTeams.length > 0
    ? (adminTeams.find((t) => t.members.some((m) => m.participant_id === selectedParticipant.id))?.team.id ?? null)
    : null;
  const selectedResult = selectedParticipant && selectedParticipantTeamId
    ? (results.find((r) => r.team_id === selectedParticipantTeamId) ?? null)
    : null;

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-red-500/30">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[300px] bg-red-500/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Navigation */}
      <nav className="border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <MagneticWrapper>
              <Link href="/" className="interactive w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors text-zinc-400 hover:text-white">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </MagneticWrapper>
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-8 h-8">
                <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping" />
                <ShieldAlert className="w-5 h-5 text-red-500 relative z-10" />
              </div>
              <span className="font-black text-xl tracking-tighter uppercase text-white">Admin</span>
            </div>
          </div>
          <MagneticWrapper>
            <button onClick={handleLogout} className="interactive flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium">
              <Lock className="w-4 h-4" />
              Sign Out
            </button>
          </MagneticWrapper>
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto px-6 py-12 space-y-8">

        {/* Header & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-2">
            <h1 className="text-4xl font-black tracking-tighter">Overview</h1>
            <p className="text-zinc-400 font-mono text-sm">Live data</p>
          </div>
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { label: "TOTAL APPLICANTS", value: stats.total, Icon: Users, color: "text-white", border: "border-white/10", bg: "bg-white/[0.02]" },
              { label: "APPROVED", value: stats.approved, Icon: CheckCircle2, color: "text-green-400", border: "border-green-500/20", bg: "from-green-500/10 to-transparent" },
              { label: "PENDING", value: stats.pending, Icon: Activity, color: "text-yellow-400", border: "border-yellow-500/20", bg: "from-yellow-500/10 to-transparent" },
            ].map(({ label, value, Icon, color, border, bg }) => (
              <div key={label} className={`border ${border} rounded-2xl p-6 relative overflow-hidden group bg-gradient-to-br ${bg}`}>
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Icon className="w-24 h-24" />
                </div>
                <div className={`font-mono text-xs mb-4 ${color === "text-white" ? "text-zinc-500" : color}`}>{label}</div>
                <div className={`text-5xl font-black ${color}`}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Event Lifecycle Controls */}
        <div className="bg-white/[0.02] border border-white/10 rounded-[2rem] p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            <h2 className="font-black text-lg uppercase tracking-wider">Event Controls</h2>
            <span className="text-xs font-mono text-zinc-500 bg-white/[0.03] px-2 py-1 rounded">ADMIN ONLY</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ControlButton
              active={eventState.briefingReleased}
              onActivate={() => handleToggleControl("briefing_released", true)}
              onDeactivate={() => handleToggleControl("briefing_released", false)}
              icon={BookOpen}
              label="Release Briefing"
              description="Reveal tracks, themes & judging criteria to all participants"
              color="cyan"
            />
            <ControlButton
              active={eventState.submissionsOpen}
              onActivate={() => handleToggleControl("submissions_open", true)}
              onDeactivate={() => handleToggleControl("submissions_open", false)}
              icon={Upload}
              label="Open Submissions"
              description="Allow participants to submit their Google Drive links"
              color="blue"
            />
            <ControlButton
              active={eventState.resultsReleased}
              onActivate={() => handleToggleControl("results_released", true)}
              onDeactivate={() => handleToggleControl("results_released", false)}
              icon={Trophy}
              label="Release Results"
              description="Publish assigned results to each participant's dashboard"
              color="yellow"
            />
            <ControlButton
              active={eventState.applicationsOpen}
              onActivate={() => handleToggleControl("applications_open", true)}
              onDeactivate={() => handleToggleControl("applications_open", false)}
              icon={Users}
              label="Applications Open"
              description="Control whether new participants can register for this competition"
              color="cyan"
            />
            <ControlButton
              active={eventState.teamChangesOpen}
              onActivate={() => handleToggleControl("team_changes_open", true)}
              onDeactivate={() => handleToggleControl("team_changes_open", false)}
              icon={Activity}
              label="Team Changes"
              description="Freeze or unlock team creation, joining, leaving, and roster changes"
              color="blue"
            />
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-white/[0.02] border border-white/10 rounded-2xl p-1.5 w-fit">
          {(["participants", "teams"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${
                activeTab === tab
                  ? "bg-white text-black"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab === "participants" ? (
                <span className="flex items-center gap-2"><Users className="w-4 h-4" />Participants</span>
              ) : (
                <span className="flex items-center gap-2"><Users className="w-4 h-4" />Teams</span>
              )}
            </button>
          ))}
        </div>

        {activeTab === "participants" ? (
          <>
            {/* Controls Bar */}
            <div className="bg-white/[0.02] border border-white/10 rounded-[2rem] p-6 flex flex-col md:flex-row gap-6 justify-between items-center backdrop-blur-md">
              <div className="relative w-full md:max-w-md group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-red-400 transition-colors" />
                <input
                  type="text"
                  placeholder="Search participants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-red-500/50 focus:bg-white/[0.02] transition-all font-mono"
                />
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="relative group flex-1 md:flex-none">
                  <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full md:w-auto bg-black border border-white/10 rounded-xl pl-12 pr-10 py-4 text-white focus:outline-none focus:border-red-500/50 appearance-none font-mono text-sm cursor-pointer"
                  >
                    <option value="all">ALL STATUS</option>
                    <option value="pending">PENDING</option>
                    <option value="approved">APPROVED</option>
                    <option value="rejected">REJECTED</option>
                  </select>
                </div>
                <MagneticWrapper>
                  <button onClick={handleExport} className="interactive flex items-center justify-center gap-2 bg-white text-black px-6 py-4 rounded-xl hover:bg-zinc-200 transition-all font-bold text-sm uppercase tracking-wider">
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                </MagneticWrapper>
              </div>
            </div>

            {/* Participant Table */}
            <div className="bg-black border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.02]">
                      <th className="p-6 font-mono text-xs text-zinc-500 tracking-widest">NAME</th>
                      <th className="p-6 font-mono text-xs text-zinc-500 tracking-widest">UNIVERSITY</th>
                      <th className="p-6 font-mono text-xs text-zinc-500 tracking-widest">PROGRAM</th>
                      <th className="p-6 font-mono text-xs text-zinc-500 tracking-widest">STATUS</th>
                      <th className="p-6 font-mono text-xs text-zinc-500 tracking-widest">RESULT</th>
                      <th className="p-6 font-mono text-xs text-zinc-500 tracking-widest text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {filteredParticipants.map((p) => {
                        const participantTeamId = adminTeams.find((t) => t.members.some((m) => m.participant_id === p.id))?.team.id ?? null;
                        const result = participantTeamId ? (results.find((r) => r.team_id === participantTeamId) ?? null) : null;
                        return (
                          <motion.tr
                            key={p.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group cursor-pointer"
                            onClick={() => setSelectedParticipant(p)}
                          >
                            <td className="p-6">
                              <div className="font-bold text-base">{p.full_name}</div>
                              <div className="text-sm text-zinc-500 font-mono">{p.email}</div>
                            </td>
                            <td className="p-6">
                              <div className="inline-flex items-center px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-sm text-zinc-300">
                                {p.university === "otu" ? "OTU" : p.university_name ?? "Other"}
                              </div>
                            </td>
                            <td className="p-6">
                              <span className="font-mono text-sm text-zinc-400">{p.program}</span>
                              <div className="text-xs text-zinc-600 mt-0.5">Year {p.year_of_study}</div>
                            </td>
                            <td className="p-6">
                              <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black tracking-widest uppercase
                                ${p.status === "approved" ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                : p.status === "rejected" ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"}`}
                              >
                                <div className={`w-1.5 h-1.5 rounded-full ${p.status === "approved" ? "bg-green-400" : p.status === "rejected" ? "bg-red-400" : "bg-yellow-400 animate-pulse"}`} />
                                {p.status}
                              </span>
                            </td>
                            <td className="p-6">
                              <span className="text-xs text-zinc-400 font-mono">
                                {result ? `Track ${result.track} — ${result.position === 1 ? "1st" : "2nd"}` : "—"}
                              </span>
                            </td>
                            <td className="p-6 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-3 opacity-50 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => setSelectedParticipant(p)}
                                  className="interactive p-2 text-zinc-500 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-xl transition-all border border-transparent hover:border-cyan-400/20"
                                  title="View details"
                                >
                                  <Eye className="w-5 h-5" />
                                </button>
                                {p.status !== "approved" && (
                                  <button onClick={() => handleStatusChange(p.id, "approved")} className="interactive p-2 text-zinc-500 hover:text-green-400 hover:bg-green-400/10 rounded-xl transition-all border border-transparent hover:border-green-400/20" title="Approve">
                                    <CheckCircle2 className="w-5 h-5" />
                                  </button>
                                )}
                                {p.status !== "rejected" && (
                                  <button onClick={() => handleStatusChange(p.id, "rejected")} className="interactive p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all border border-transparent hover:border-red-400/20" title="Reject">
                                    <XCircle className="w-5 h-5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
                {filteredParticipants.length === 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-20 text-center flex flex-col items-center justify-center">
                    <div className="w-16 h-16 border border-white/10 rounded-2xl flex items-center justify-center mb-4 bg-white/5">
                      <Search className="w-6 h-6 text-zinc-600" />
                    </div>
                    <div className="text-xl font-bold mb-2">No Records Found</div>
                    <div className="text-zinc-500 font-mono text-sm">Try adjusting your search filters</div>
                  </motion.div>
                )}
              </div>
            </div>
          </>
        ) : (
          /* ── Teams Tab ── */
          <AdminTeamsTab
            teams={adminTeams}
            unassignedParticipants={unassignedParticipants}
            selectedTeamId={selectedTeamId}
            teamJoinRequests={teamJoinRequests}
            teamSearchTerm={teamSearchTerm}
            setTeamSearchTerm={setTeamSearchTerm}
            teamBusy={teamBusy}
            teamError={teamError}
            setTeamError={setTeamError}
            addMemberTeamId={addMemberTeamId}
            setAddMemberTeamId={setAddMemberTeamId}
            addMemberParticipantId={addMemberParticipantId}
            setAddMemberParticipantId={setAddMemberParticipantId}
            onSelectTeam={handleSelectTeamForDetail}
            onCloseTeam={() => { setSelectedTeamId(null); setTeamJoinRequests([]); }}
            onAddMember={handleAdminAddMember}
            onRemoveMember={handleAdminRemoveMember}
            onChangeOwner={handleAdminChangeOwner}
            onDisband={handleAdminDisband}
            onApproveRequest={handleAdminApproveRequest}
            onDenyRequest={handleAdminDenyRequest}
            results={results}
            onAssignResult={handleAssignResult}
            onClearResult={handleClearResult}
          />
        )}

      </main>

      {/* Participant Detail Slide-Over */}
      <AnimatePresence>
        {selectedParticipant && (
          <ParticipantDetail
            participant={selectedParticipant}
            submission={selectedSubmission}
            result={selectedResult}
            onClose={() => setSelectedParticipant(null)}
            onStatusChange={handleStatusChange}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
