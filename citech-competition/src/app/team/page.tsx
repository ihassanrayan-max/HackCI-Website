"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserPlus,
  LogOut,
  Trash2,
  Crown,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Pencil,
  X,
  Clock,
  RefreshCw,
  XCircle,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import MagneticWrapper from "@/components/MagneticWrapper";
import { createClient } from "@/lib/supabase/client";
import {
  getMyParticipant,
  getMyTeam,
  createTeam,
  disbandTeam,
  leaveTeam,
  removeMember,
  renameTeam,
  getTeamMembers,
  getAllTeams,
  getMyPendingRequests,
  requestToJoinTeam,
  getJoinRequestsForTeam,
  approveJoinRequest,
  denyJoinRequest,
  getEventState,
  type CompParticipant,
  type CompTeam,
  type CompTeamMemberWithParticipant,
  type CompTeamWithCount,
  type CompJoinRequestWithParticipant,
} from "@/lib/db";
import { DEFAULT_EVENT_STATE, mapEventState, type EventState } from "@/lib/eventState";

// ─── Small sub-components ─────────────────────────────────────────────────────

function MemberCard({
  member,
  isMe,
  isOwner: isMemberOwner,
  canKick,
  onKick,
  busy,
}: {
  member: CompTeamMemberWithParticipant;
  isMe: boolean;
  isOwner: boolean;
  canKick: boolean;
  onKick: () => void;
  busy: boolean;
}) {
  const memberName = member.comp_participants?.full_name?.trim() || "Unknown Participant";
  const memberInitial = memberName.charAt(0).toUpperCase();
  const profileHref = `/participants/${member.participant_id}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10, scale: 0.95 }}
      whileHover={{ scale: 1.01, x: 6 }}
      className="flex items-center justify-between p-5 bg-black/40 rounded-2xl border border-white/5 hover:border-cyan-500/20 transition-all group"
    >
      <Link href={profileHref} className="flex items-center gap-5 min-w-0 flex-1 interactive">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl select-none shrink-0 ${
            isMemberOwner
              ? "bg-gradient-to-br from-cyan-400 to-blue-600 text-black shadow-[0_0_20px_rgba(0,255,204,0.3)]"
              : "bg-zinc-800 border border-white/10 text-white"
          }`}
        >
          {memberInitial}
        </div>
        <div className="min-w-0">
          <div className="font-bold text-base flex items-center gap-2 flex-wrap">
            {memberName}
            {isMe && (
              <span className="text-[10px] font-black tracking-widest px-2 py-0.5 bg-white/10 rounded text-zinc-400">
                YOU
              </span>
            )}
            {isMemberOwner && (
              <Crown className="w-4 h-4 text-yellow-500 drop-shadow-[0_0_6px_rgba(234,179,8,0.9)]" />
            )}
          </div>
          <div className="text-xs text-zinc-500 font-mono mt-0.5">
            {isMemberOwner ? "TEAM LEADER" : "MEMBER"}
          </div>
        </div>
      </Link>
      {canKick && !isMe && (
        <button
          onClick={onKick}
          disabled={busy}
          title="Remove from team"
          className="p-2.5 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all opacity-0 group-hover:opacity-100 interactive border border-transparent hover:border-red-500/20 disabled:opacity-40 shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
}

function EmptySlot({ index }: { index: number }) {
  return (
    <motion.div
      key={index}
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.4 }}
      className="flex items-center gap-5 p-5 border border-dashed border-white/10 rounded-2xl bg-black/20"
    >
      <div className="w-12 h-12 rounded-xl border border-dashed border-white/20 flex items-center justify-center shrink-0">
        <div className="w-2 h-2 rounded-full bg-zinc-700 animate-pulse" />
      </div>
      <span className="text-zinc-600 font-mono text-xs tracking-[0.2em]">
        OPEN SLOT
      </span>
    </motion.div>
  );
}

function TeamBrowseCard({
  team,
  isPending,
  disabled,
  onRequest,
  busy,
}: {
  team: CompTeamWithCount;
  isPending: boolean;
  disabled: boolean;
  onRequest: () => void;
  busy: boolean;
}) {
  const isFull = team.member_count >= 4;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 flex flex-col gap-4 hover:border-white/20 transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-lg tracking-tight truncate">{team.name}</h3>
          <div className="flex items-center gap-2 mt-1.5">
            <Crown className="w-3 h-3 text-yellow-500" />
            <span className="text-xs text-zinc-500 truncate">{team.owner_name}</span>
          </div>
        </div>
        <span className={`text-xs font-mono px-2.5 py-1 rounded-full border shrink-0 ${
          isFull
            ? "border-zinc-700 text-zinc-600 bg-zinc-900"
            : "border-cyan-500/20 text-cyan-400 bg-cyan-500/10"
        }`}>
          {team.member_count}/4
        </span>
      </div>

      {isFull ? (
        <div className="flex items-center justify-center gap-2 py-2.5 text-zinc-600 text-xs font-mono">
          <CheckCircle2 className="w-3.5 h-3.5" />
          TEAM FULL
        </div>
      ) : isPending ? (
        <div className="flex items-center justify-center gap-2 py-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400 text-xs font-bold">
          <Clock className="w-3.5 h-3.5" />
          Request Pending
        </div>
      ) : (
        <button
          onClick={onRequest}
          disabled={busy || disabled}
          className="interactive w-full flex items-center justify-center gap-2 py-2.5 bg-white/[0.05] border border-white/10 text-white font-bold text-sm rounded-xl hover:bg-cyan-500/10 hover:border-cyan-500/30 hover:text-cyan-400 transition-all disabled:opacity-40 disabled:pointer-events-none"
        >
          <UserPlus className="w-4 h-4" />
          Request to Join
        </button>
      )}
    </motion.div>
  );
}

function JoinRequestCard({
  request,
  onApprove,
  onDeny,
  busy,
}: {
  request: CompJoinRequestWithParticipant;
  onApprove: () => void;
  onDeny: () => void;
  busy: boolean;
}) {
  const name = request.comp_participants?.full_name?.trim() || "Unknown";
  const initial = name.charAt(0).toUpperCase();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10, scale: 0.95 }}
      className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5 hover:border-yellow-500/20 transition-all group"
    >
      <Link href={`/participants/${request.participant_id}`} className="flex items-center gap-4 min-w-0 flex-1 interactive">
        <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center font-bold text-yellow-400 select-none shrink-0">
          {initial}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-sm">{name}</p>
          <p className="text-xs text-zinc-500 font-mono">{request.comp_participants?.email ?? ""}</p>
        </div>
      </Link>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onApprove}
          disabled={busy}
          title="Approve"
          className="interactive p-2 text-zinc-500 hover:text-green-400 hover:bg-green-400/10 rounded-xl transition-all border border-transparent hover:border-green-400/20 disabled:opacity-40"
        >
          <CheckCircle2 className="w-5 h-5" />
        </button>
        <button
          onClick={onDeny}
          disabled={busy}
          title="Deny"
          className="interactive p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all border border-transparent hover:border-red-400/20 disabled:opacity-40"
        >
          <XCircle className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function TeamHubPage() {
  const router = useRouter();
  const [participant, setParticipant] = useState<CompParticipant | null>(null);
  const [team, setTeam] = useState<CompTeam | null>(null);
  const [members, setMembers] = useState<CompTeamMemberWithParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Create flow
  const [teamNameInput, setTeamNameInput] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Browse teams
  const [allTeams, setAllTeams] = useState<CompTeamWithCount[]>([]);
  const [pendingTeamIds, setPendingTeamIds] = useState<Set<string>>(new Set());
  const [teamSearch, setTeamSearch] = useState("");

  // Join requests (for team owner)
  const [joinRequests, setJoinRequests] = useState<CompJoinRequestWithParticipant[]>([]);

  // Inline rename
  const [renaming, setRenaming] = useState(false);
  const [renameInput, setRenameInput] = useState("");
  const renameRef = useRef<HTMLInputElement>(null);

  const [eventState, setEventState] = useState<EventState>(DEFAULT_EVENT_STATE);

  const isOwner = !!(team && participant && team.owner_id === participant.id);
  const emptySlots = Math.max(0, 4 - members.length);
  const notApproved = participant?.status !== "approved";
  const teamChangesLocked = !eventState.teamChangesOpen;

  // ── Load initial data ─────────────────────────────────────────────────────

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      try {
        const p = await getMyParticipant(supabase);
        if (!p) { router.push("/register"); return; }
        setParticipant(p);

        try {
          const es = await getEventState(supabase);
          setEventState(mapEventState(es));
        } catch {
          // If event state can't be loaded, fall back to defaults (unlocked).
        }

        const teamData = await getMyTeam(supabase, p.id);
        if (teamData) {
          setTeam(teamData.team);
          setMembers(teamData.members);
          setRenameInput(teamData.team.name);

          if (teamData.team.owner_id === p.id) {
            const reqs = await getJoinRequestsForTeam(supabase, teamData.team.id);
            setJoinRequests(reqs);
          }
        } else {
          const [teams, pending] = await Promise.all([
            getAllTeams(supabase),
            getMyPendingRequests(supabase, p.id),
          ]);
          setAllTeams(teams);
          setPendingTeamIds(new Set(pending));
        }
      } catch (err: any) {
        setActionError(err?.message ?? "Failed to load Team Hub.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router]);

  // ── Realtime: subscribe to roster + join request changes ──────────

  useEffect(() => {
    if (!team || !participant) return;
    const supabase = createClient();

    const channel = supabase
      .channel(`team-hub-${team.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comp_team_members",
          filter: `team_id=eq.${team.id}`,
        },
        async () => {
          const fresh = await getTeamMembers(supabase, team.id);
          setMembers(fresh);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "comp_teams",
          filter: `id=eq.${team.id}`,
        },
        (payload) => {
          if (payload.new) setTeam((t) => t ? { ...t, ...(payload.new as Partial<CompTeam>) } : t);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comp_join_requests",
          filter: `team_id=eq.${team.id}`,
        },
        async () => {
          if (team.owner_id === participant.id) {
            const reqs = await getJoinRequestsForTeam(supabase, team.id);
            setJoinRequests(reqs);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [team?.id, participant]);

  // ── Realtime: subscribe to global event state (locks) ─────────────

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("comp_event_state_team_hub")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "comp_event_state", filter: "id=eq.1" },
        (payload) => {
          if (payload.new) {
            setEventState(mapEventState(payload.new as any));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!loading && teamChangesLocked) {
      router.push("/dashboard");
    }
  }, [loading, teamChangesLocked, router]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const clearError = () => setActionError(null);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!participant || teamChangesLocked) return;
    const name = teamNameInput.trim() || "Team Innovators";
    setBusy(true);
    clearError();
    try {
      const supabase = createClient();
      const newTeam = await createTeam(supabase, participant.id, name);
      setTeam(newTeam);
      setRenameInput(newTeam.name);
      const teamData = await getMyTeam(supabase, participant.id);
      if (teamData) setMembers(teamData.members);
    } catch (err: any) {
      const msg: string = err?.message ?? "";
      if (msg.toLowerCase().includes("approved")) {
        setActionError("Your application must be approved before you can create or join a team.");
      } else {
        setActionError(msg || "Failed to create team.");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleRequestToJoin = async (teamId: string) => {
    if (!participant || teamChangesLocked) return;
    setBusy(true);
    clearError();
    try {
      const supabase = createClient();
      await requestToJoinTeam(supabase, participant.id, teamId);
      setPendingTeamIds((prev) => new Set([...prev, teamId]));
    } catch (err: any) {
      setActionError(err?.message ?? "Failed to send join request.");
    } finally {
      setBusy(false);
    }
  };

  const handleApproveRequest = async (request: CompJoinRequestWithParticipant) => {
    if (!team) return;
    if (teamChangesLocked) {
      setActionError("Team forming has been locked by the organisers.");
      return;
    }
    setBusy(true);
    clearError();
    try {
      const supabase = createClient();
      await approveJoinRequest(supabase, request.id, request.team_id, request.participant_id);
      setJoinRequests((rs) => rs.filter((r) => r.id !== request.id));
      const fresh = await getTeamMembers(supabase, team.id);
      setMembers(fresh);
    } catch (err: any) {
      setActionError(err?.message ?? "Failed to approve request.");
    } finally {
      setBusy(false);
    }
  };

  const handleDenyRequest = async (request: CompJoinRequestWithParticipant) => {
    setBusy(true);
    clearError();
    try {
      const supabase = createClient();
      await denyJoinRequest(supabase, request.id);
      setJoinRequests((rs) => rs.filter((r) => r.id !== request.id));
    } catch (err: any) {
      setActionError(err?.message ?? "Failed to deny request.");
    } finally {
      setBusy(false);
    }
  };

  const handleDisband = async () => {
    if (!team || teamChangesLocked) return;
    setBusy(true);
    clearError();
    try {
      const supabase = createClient();
      await disbandTeam(supabase, team.id);
      setTeam(null);
      setMembers([]);
      setJoinRequests([]);
    } catch (err: any) {
      setActionError(err?.message ?? "Failed to disband team.");
    } finally {
      setBusy(false);
    }
  };

  const handleLeave = async () => {
    if (!participant || teamChangesLocked) return;
    setBusy(true);
    clearError();
    try {
      const supabase = createClient();
      await leaveTeam(supabase, participant.id);
      setTeam(null);
      setMembers([]);
    } catch (err: any) {
      setActionError(err?.message ?? "Failed to leave team.");
    } finally {
      setBusy(false);
    }
  };

  const handleKickMember = async (memberParticipantId: string) => {
    if (teamChangesLocked) return;
    setBusy(true);
    clearError();
    try {
      const supabase = createClient();
      await removeMember(supabase, memberParticipantId);
      setMembers((ms) => ms.filter((m) => m.participant_id !== memberParticipantId));
    } catch (err: any) {
      setActionError(err?.message ?? "Failed to remove member.");
    } finally {
      setBusy(false);
    }
  };

  const handleRename = async () => {
    if (!team || !renameInput.trim() || renameInput === team.name) {
      setRenaming(false);
      return;
    }
    setBusy(true);
    clearError();
    try {
      const supabase = createClient();
      const updated = await renameTeam(supabase, team.id, renameInput.trim());
      setTeam(updated);
    } catch (err: any) {
      setActionError(err?.message ?? "Failed to rename team.");
      setRenameInput(team.name);
    } finally {
      setBusy(false);
      setRenaming(false);
    }
  };

  const startRename = () => {
    if (teamChangesLocked) return;
    setRenaming(true);
    setTimeout(() => renameRef.current?.focus(), 50);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (teamChangesLocked) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filteredTeams = allTeams.filter((t) =>
    t.name.toLowerCase().includes(teamSearch.toLowerCase()) ||
    t.owner_name.toLowerCase().includes(teamSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Ambient glow */}
      <div className="fixed top-[15%] right-[-15%] w-[50%] h-[50%] rounded-full bg-blue-500/8 blur-[130px] pointer-events-none" />
      <div className="fixed bottom-[10%] left-[-10%] w-[35%] h-[35%] rounded-full bg-cyan-500/6 blur-[120px] pointer-events-none" />

      {/* Navigation */}
      <nav className="border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <MagneticWrapper>
            <Link
              href="/dashboard"
              className="interactive flex items-center gap-3 text-zinc-400 hover:text-white transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </div>
              <span className="font-bold text-xl tracking-tighter text-white">Team Hub</span>
            </Link>
          </MagneticWrapper>

          {team && (
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-zinc-500">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              {members.length} / 4 MEMBERS
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-14">

        {/* Error Banner */}
        <AnimatePresence>
          {actionError && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="flex items-center gap-3 px-5 py-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-sm flex-1">{actionError}</p>
                <button
                  onClick={clearError}
                  className="text-xs underline opacity-60 hover:opacity-100 transition-opacity shrink-0"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

              {/* Approval / lock gate */}
              <AnimatePresence>
                {notApproved && !team && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 flex items-start gap-4 px-6 py-5 bg-yellow-500/8 border border-yellow-500/20 rounded-2xl text-yellow-400"
                  >
                    <Clock className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-sm mb-0.5">Application Pending Approval</p>
                      <p className="text-xs text-yellow-400/70">
                        You will be able to create or join a team once your application is approved by the organisers.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

        <AnimatePresence mode="wait">
          {/* ── No team: Create + Browse ── */}
          {!team ? (
            <motion.div
              key="no-team"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, filter: "blur(8px)" }}
              transition={{ duration: 0.4 }}
              className="space-y-10"
            >
              {/* Create Card */}
              <div className={`bg-white/[0.02] border border-white/10 rounded-[2rem] p-6 sm:p-10 flex flex-col items-center text-center relative overflow-hidden group transition-opacity max-w-lg mx-auto ${(notApproved || teamChangesLocked) ? "opacity-50 pointer-events-none" : ""}`}>
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-cyan-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="w-20 h-20 bg-cyan-400/10 rounded-3xl flex items-center justify-center mb-8 border border-cyan-400/20 rotate-[-8deg] group-hover:rotate-0 transition-transform duration-500">
                  <Users className="w-10 h-10 text-cyan-400" />
                </div>
                <h2 className="text-3xl font-bold mb-3">Create a Team</h2>
                <p className="text-zinc-400 font-light mb-8">Create a new team and others can request to join you.</p>

                <form onSubmit={handleCreateTeam} className="w-full mt-auto space-y-4">
                  <AnimatePresence>
                    {showCreateForm && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <input
                          type="text"
                          value={teamNameInput}
                          onChange={(e) => setTeamNameInput(e.target.value)}
                          placeholder="Team name (optional)"
                          maxLength={40}
                          className="w-full bg-black border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:border-cyan-500 transition-colors text-center font-medium mb-1"
                          autoFocus
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {!showCreateForm ? (
                    <MagneticWrapper className="w-full">
                      <button
                        type="button"
                        onClick={() => setShowCreateForm(true)}
                        className="interactive w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-cyan-400 hover:scale-[1.02] transition-all"
                      >
                        Create Team
                      </button>
                    </MagneticWrapper>
                  ) : (
                    <MagneticWrapper className="w-full">
                      <button
                        type="submit"
                        disabled={busy}
                        className="interactive w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-cyan-400 hover:scale-[1.02] transition-all disabled:opacity-50"
                      >
                        {busy ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                            Creating...
                          </span>
                        ) : "Create Team"}
                      </button>
                    </MagneticWrapper>
                  )}
                </form>
              </div>

              {/* Browse Teams */}
              <div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <h2 className="text-2xl font-bold tracking-tight">Browse Teams</h2>
                  {allTeams.length > 3 && (
                    <div className="relative group w-full sm:w-auto">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-cyan-400 transition-colors" />
                      <input
                        type="text"
                        value={teamSearch}
                        onChange={(e) => setTeamSearch(e.target.value)}
                        placeholder="Search teams..."
                        className="w-full sm:w-64 bg-black border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors font-mono"
                      />
                    </div>
                  )}
                </div>

                {filteredTeams.length > 0 ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTeams.map((t) => (
                      <TeamBrowseCard
                        key={t.id}
                        team={t}
                        isPending={pendingTeamIds.has(t.id)}
                        disabled={notApproved || teamChangesLocked}
                        onRequest={() => handleRequestToJoin(t.id)}
                        busy={busy}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 text-zinc-600">
                    <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-mono text-sm">
                      {teamSearch ? "No teams match your search." : "No teams created yet. Be the first!"}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

          ) : (
            /* ── Has team: Team View ── */
            <motion.div
              key="has-team"
              initial={{ opacity: 0, scale: 0.96, filter: "blur(8px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0)" }}
              transition={{ type: "spring", damping: 22, stiffness: 120 }}
              className="space-y-6"
            >
              {/* Team Header Card */}
              <div className="bg-white/[0.02] border border-white/10 rounded-[2rem] p-8 md:p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-cyan-500/15 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/4" />

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                  <div className="flex-1 min-w-0">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs text-zinc-400 mb-5 font-mono">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      TEAM ACTIVE
                    </div>

                    {/* Team name — editable by owner */}
                    {renaming ? (
                      <div className="flex items-center gap-3 mb-4">
                        <input
                          ref={renameRef}
                          type="text"
                          value={renameInput}
                          onChange={(e) => setRenameInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRename();
                            if (e.key === "Escape") { setRenaming(false); setRenameInput(team.name); }
                          }}
                          maxLength={40}
                          className="text-3xl md:text-4xl font-black tracking-tighter bg-transparent border-b-2 border-cyan-400 focus:outline-none text-white w-full"
                        />
                        <button onClick={handleRename} disabled={busy} className="text-cyan-400 hover:text-cyan-300 transition-colors shrink-0">
                          <CheckCircle2 className="w-6 h-6" />
                        </button>
                        <button onClick={() => { setRenaming(false); setRenameInput(team.name); }} className="text-zinc-500 hover:text-white transition-colors shrink-0">
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 mb-4 group/name">
                        <h1 className="text-3xl md:text-5xl font-black tracking-tighter break-words">{team.name}</h1>
                        {isOwner && (
                          <button
                            onClick={startRename}
                            title="Rename team"
                            className="opacity-60 sm:opacity-0 sm:group-hover/name:opacity-100 transition-opacity text-zinc-600 hover:text-zinc-300 interactive shrink-0"
                          >
                            <Pencil className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Danger zone */}
                  <div className="flex flex-col gap-3 shrink-0">
                    {isOwner ? (
                      <DisbandButton onDisband={handleDisband} busy={busy} />
                    ) : (
                      <LeaveButton onLeave={handleLeave} busy={busy} />
                    )}
                  </div>
                </div>
              </div>

              {/* Roster Card */}
              <div className="bg-white/[0.02] border border-white/10 rounded-[2rem] p-8 md:p-10">
                <div className="flex items-center justify-between mb-7">
                  <h2 className="text-2xl font-bold tracking-tight">Roster</h2>
                  <span className="text-xs font-mono text-zinc-500 bg-black px-3 py-1 rounded-full border border-white/5">
                    {members.length} / 4
                  </span>
                </div>

                <div className="space-y-3">
                  <AnimatePresence initial={false}>
                    {members.map((member) => (
                      <MemberCard
                        key={member.id}
                        member={member}
                        isMe={member.participant_id === participant?.id}
                        isOwner={team.owner_id === member.participant_id}
                        canKick={isOwner}
                        onKick={() => handleKickMember(member.participant_id)}
                        busy={busy}
                      />
                    ))}
                  </AnimatePresence>

                  {Array.from({ length: emptySlots }).map((_, i) => (
                    <EmptySlot key={i} index={i} />
                  ))}
                </div>

                {members.length >= 4 && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl text-cyan-400 text-sm font-medium"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Team roster is full — ready to compete!
                  </motion.div>
                )}
              </div>

              {/* Pending Join Requests — owner only, team not full */}
              {isOwner && (
                <div className="bg-white/[0.02] border border-white/10 rounded-[2rem] p-8 md:p-10">
                  <div className="flex items-center gap-3 mb-6">
                    <h2 className="text-2xl font-bold tracking-tight">Join Requests</h2>
                    {joinRequests.length > 0 && (
                      <span className="text-xs font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2.5 py-0.5 rounded-full">
                        {joinRequests.length}
                      </span>
                    )}
                  </div>

                  {joinRequests.length > 0 ? (
                    <div className="space-y-3">
                      <AnimatePresence initial={false}>
                        {joinRequests.map((req) => (
                          <JoinRequestCard
                            key={req.id}
                            request={req}
                            onApprove={() => handleApproveRequest(req)}
                            onDeny={() => handleDenyRequest(req)}
                            busy={busy}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <p className="text-zinc-600 text-sm font-mono text-center py-6">
                      No pending requests. Participants can find your team in the Team Hub.
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// ─── Confirm-before-act buttons ───────────────────────────────────────────────

function DisbandButton({ onDisband, busy }: { onDisband: () => void; busy: boolean }) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-400">Are you sure?</span>
        <button
          onClick={() => setConfirming(false)}
          className="px-3 py-1.5 rounded-xl text-xs border border-white/10 hover:bg-white/5 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onDisband}
          disabled={busy}
          className="px-4 py-1.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-50"
        >
          {busy ? <RefreshCw className="w-3 h-3 animate-spin inline" /> : "Disband"}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      disabled={busy}
      className="interactive flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50"
    >
      <Trash2 className="w-4 h-4" />
      Disband Team
    </button>
  );
}

function LeaveButton({ onLeave, busy }: { onLeave: () => void; busy: boolean }) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-400">Leave team?</span>
        <button
          onClick={() => setConfirming(false)}
          className="px-3 py-1.5 rounded-xl text-xs border border-white/10 hover:bg-white/5 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onLeave}
          disabled={busy}
          className="px-4 py-1.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-50"
        >
          {busy ? <RefreshCw className="w-3 h-3 animate-spin inline" /> : "Leave"}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      disabled={busy}
      className="interactive flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50"
    >
      <LogOut className="w-4 h-4" />
      Leave Team
    </button>
  );
}
