/**
 * Typed Supabase query helpers for all comp_* tables.
 * Import createClient from "@/lib/supabase/client" for client components,
 * or "@/lib/supabase/server" for server components / Route Handlers.
 *
 * These helpers are thin wrappers that centralise table names and types.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type ParticipantStatus = "pending" | "approved" | "rejected";
export type TrackType = "A" | "B";
export type PositionType = 1 | 2;

export interface CompParticipant {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  age: number;
  university: "otu" | "other";
  university_name: string | null;
  student_id: string | null;
  program: string;
  year_of_study: string;
  goals: string | null;
   linkedin_url: string | null;
   github_url: string | null;
   portfolio_url: string | null;
  status: ParticipantStatus;
  created_at: string;
  updated_at: string;
}

export interface CompEventState {
  id: 1;
  briefing_released: boolean;
  submissions_open: boolean;
  results_released: boolean;
  applications_open: boolean;
  team_changes_open: boolean;
  updated_at: string;
}

export interface CompSubmission {
  id: string;
  participant_id: string;
  drive_link: string;
  submitted_at: string;
  updated_at: string;
}

export interface CompResult {
  id: string;
  team_id: string;
  track: TrackType;
  position: PositionType;
  created_at: string;
  updated_at: string;
}

export interface CompTeam {
  id: string;
  name: string;
  code: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface CompTeamMember {
  id: string;
  team_id: string;
  participant_id: string;
  joined_at: string;
}

export interface CompTeamMemberWithParticipant extends CompTeamMember {
  comp_participants: Pick<CompParticipant, "id" | "full_name" | "email"> | null;
}

export type JoinRequestStatus = "pending" | "approved" | "denied";

export interface CompJoinRequest {
  id: string;
  team_id: string;
  participant_id: string;
  status: JoinRequestStatus;
  created_at: string;
  updated_at: string;
}

export interface CompJoinRequestWithParticipant extends CompJoinRequest {
  comp_participants: Pick<CompParticipant, "id" | "full_name" | "email"> | null;
}

export interface CompTeamWithCount extends CompTeam {
  member_count: number;
  owner_name: string;
}

// ─── Participant helpers ───────────────────────────────────────────────────────

export async function getMyParticipant(supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("comp_participants")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return data as CompParticipant | null;
}

export async function getAllParticipants(supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>) {
  const { data, error } = await supabase
    .from("comp_participants")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as CompParticipant[];
}

export async function insertParticipant(
  supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>,
  payload: Omit<CompParticipant, "id" | "status" | "created_at" | "updated_at">
) {
  const { data, error } = await supabase
    .from("comp_participants")
    .insert(payload)
    .select()
    .single();

  if (error) {
    // When applications are closed, RLS will reject inserts with a generic
    // permission error. Surface a friendlier message for the UI.
    if (error.code === "42501") {
      throw new Error("Applications are closed for this competition.");
    }
    throw error;
  }
  return data as CompParticipant;
}

export async function getParticipantById(
  supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>,
  participantId: string
): Promise<CompParticipant | null> {
  const { data } = await supabase
    .from("comp_participants")
    .select("*")
    .eq("id", participantId)
    .maybeSingle();

  return data as CompParticipant | null;
}

export async function updateMyParticipant(
  supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>,
  participantId: string,
  payload: Partial<Pick<CompParticipant, "full_name" | "age" | "university" | "university_name" | "student_id" | "program" | "year_of_study" | "goals" | "linkedin_url" | "github_url" | "portfolio_url">>
) {
  const { error } = await supabase
    .from("comp_participants")
    .update(payload)
    .eq("id", participantId);

  if (error) throw error;
}

export async function updateParticipantStatus(
  supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>,
  participantId: string,
  status: ParticipantStatus
) {
  const { error } = await supabase
    .from("comp_participants")
    .update({ status })
    .eq("id", participantId);

  if (error) throw error;
}

// ─── Event State helpers ───────────────────────────────────────────────────────

export async function getEventState(supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>) {
  const { data, error } = await supabase
    .from("comp_event_state")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) throw error;
  return data as CompEventState;
}

export async function updateEventState(
  supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>,
  updates: Partial<Pick<CompEventState, "briefing_released" | "submissions_open" | "results_released" | "applications_open" | "team_changes_open">>
) {
  const { error } = await supabase
    .from("comp_event_state")
    .update(updates)
    .eq("id", 1);

  if (error) throw error;
}

// ─── Submission helpers ────────────────────────────────────────────────────────

export async function getMySubmission(
  supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>,
  participantId: string
) {
  const { data } = await supabase
    .from("comp_submissions")
    .select("*")
    .eq("participant_id", participantId)
    .maybeSingle();

  return data as CompSubmission | null;
}

export async function getAllSubmissions(supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>) {
  const { data, error } = await supabase
    .from("comp_submissions")
    .select("*");

  if (error) throw error;
  return (data ?? []) as CompSubmission[];
}

export async function upsertSubmission(
  supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>,
  participantId: string,
  driveLink: string
) {
  const { data, error } = await supabase
    .from("comp_submissions")
    .upsert(
      { participant_id: participantId, drive_link: driveLink, submitted_at: new Date().toISOString() },
      { onConflict: "participant_id" }
    )
    .select()
    .single();

  if (error) throw error;
  return data as CompSubmission;
}

// ─── Results helpers ───────────────────────────────────────────────────────────

export async function getMyResult(
  supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>,
  participantId: string
) {
  const { data: membership } = await supabase
    .from("comp_team_members")
    .select("team_id")
    .eq("participant_id", participantId)
    .maybeSingle();

  if (!membership?.team_id) return null;

  const { data } = await supabase
    .from("comp_results")
    .select("*")
    .eq("team_id", membership.team_id)
    .maybeSingle();

  return data as CompResult | null;
}

export async function getAllResults(supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>) {
  const { data, error } = await supabase
    .from("comp_results")
    .select("*");

  if (error) throw error;
  return (data ?? []) as CompResult[];
}

export async function upsertResult(
  supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>,
  teamId: string,
  track: TrackType,
  position: PositionType
) {
  // Remove any existing result for this track+position slot first
  await supabase
    .from("comp_results")
    .delete()
    .eq("track", track)
    .eq("position", position);

  const { data, error } = await supabase
    .from("comp_results")
    .upsert(
      { team_id: teamId, track, position },
      { onConflict: "team_id" }
    )
    .select()
    .single();

  if (error) throw error;
  return data as CompResult;
}

export async function clearResult(
  supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>,
  teamId: string
) {
  const { error } = await supabase
    .from("comp_results")
    .delete()
    .eq("team_id", teamId);

  if (error) throw error;
}

// ─── Team helpers ──────────────────────────────────────────────────────────────

export function generateTeamCode(): string {
  return "CIT-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function getMyTeam(
  supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>,
  participantId: string
): Promise<{ team: CompTeam; members: CompTeamMemberWithParticipant[] } | null> {
  // Find membership
  const { data: membership } = await supabase
    .from("comp_team_members")
    .select("team_id")
    .eq("participant_id", participantId)
    .maybeSingle();

  if (!membership) return null;

  const { data: team } = await supabase
    .from("comp_teams")
    .select("*")
    .eq("id", membership.team_id)
    .maybeSingle();

  if (!team) return null;

  const { data: members } = await supabase
    .from("comp_team_members")
    .select("*, comp_participants(id, full_name, email)")
    .eq("team_id", team.id);

  return {
    team: team as CompTeam,
    members: (members ?? []) as CompTeamMemberWithParticipant[],
  };
}

export async function createTeam(
  supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>,
  ownerId: string,
  name: string
): Promise<CompTeam> {
  let team: CompTeam | null = null;

  // Retry with a new code on unique conflict
  for (let i = 0; i < 5; i++) {
    const code = generateTeamCode();
    const { data, error } = await supabase
      .from("comp_teams")
      .insert({ name, code, owner_id: ownerId })
      .select()
      .single();

    if (!error) {
      team = data as CompTeam;
      break;
    }
    if (error.code === "42501") {
      throw new Error("Team forming has been locked by the organisers.");
    }
    if (error.code !== "23505") throw error;
  }

  if (!team) throw new Error("Failed to create team after retries.");

  // Add owner as first member
  const { error: memberError } = await supabase
    .from("comp_team_members")
    .insert({ team_id: team.id, participant_id: ownerId });

  if (memberError) {
    if (memberError.code === "42501") {
      throw new Error("Team forming has been locked by the organisers.");
    }
    throw memberError;
  }
  return team;
}

export async function joinTeam(
  supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>,
  participantId: string,
  code: string
): Promise<CompTeam> {
  const { data: team } = await supabase
    .from("comp_teams")
    .select("*")
    .eq("code", code.toUpperCase())
    .maybeSingle();

  if (!team) throw new Error("Team not found. Check your invite code.");

  const { error } = await supabase
    .from("comp_team_members")
    .insert({ team_id: team.id, participant_id: participantId });

  if (error) {
    if (error.code === "42501") {
      throw new Error("Team forming has been locked by the organisers.");
    }
    if (error.message?.includes("Team is full")) throw new Error("Team is full (max 4 members).");
    if (error.code === "23505") throw new Error("You are already in a team.");
    throw error;
  }

  return team as CompTeam;
}

export async function disbandTeam(
  supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>,
  teamId: string
) {
  const { error } = await supabase
    .from("comp_teams")
    .delete()
    .eq("id", teamId);

  if (error) throw error;
}

export async function leaveTeam(
  supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>,
  participantId: string
) {
  const { error } = await supabase
    .from("comp_team_members")
    .delete()
    .eq("participant_id", participantId);
  if (error) {
    if (error.code === "42501") {
      throw new Error("Team forming has been locked by the organisers.");
    }
    throw error;
  }
}

export async function removeMember(
  supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>,
  participantId: string
) {
  const { error } = await supabase
    .from("comp_team_members")
    .delete()
    .eq("participant_id", participantId);
  if (error) {
    if (error.code === "42501") {
      throw new Error("Team forming has been locked by the organisers.");
    }
    throw error;
  }
}

export async function renameTeam(
  supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>,
  teamId: string,
  name: string
): Promise<CompTeam> {
  const { data, error } = await supabase
    .from("comp_teams")
    .update({ name })
    .eq("id", teamId)
    .select()
    .single();

  if (error) throw error;
  return data as CompTeam;
}

export async function getTeamMembers(
  supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>,
  teamId: string
): Promise<CompTeamMemberWithParticipant[]> {
  const { data } = await supabase
    .from("comp_team_members")
    .select("*, comp_participants(id, full_name, email)")
    .eq("team_id", teamId);

  return (data ?? []) as CompTeamMemberWithParticipant[];
}

// ─── Browse & Join-Request helpers ──────────────────────────────────────────────

export async function getAllTeams(
  supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>
): Promise<CompTeamWithCount[]> {
  const { data: teams, error: teamsErr } = await supabase
    .from("comp_teams")
    .select("*, comp_team_members(id), owner:comp_participants!owner_id(full_name)")
    .order("created_at", { ascending: false });

  if (teamsErr) throw teamsErr;

  return (teams ?? []).map((t: any) => ({
    ...t,
    member_count: Array.isArray(t.comp_team_members) ? t.comp_team_members.length : 0,
    owner_name: t.owner?.full_name ?? "Unknown",
    comp_team_members: undefined,
    owner: undefined,
  })) as CompTeamWithCount[];
}

export async function requestToJoinTeam(
  supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>,
  participantId: string,
  teamId: string
): Promise<CompJoinRequest> {
  const { data, error } = await supabase
    .from("comp_join_requests")
    .insert({ team_id: teamId, participant_id: participantId, status: "pending" })
    .select()
    .single();

  if (error) {
    if (error.code === "42501") {
      throw new Error("Team forming has been locked by the organisers.");
    }
    if (error.code === "23505") {
      const existing = await getMyJoinRequestForTeam(supabase, participantId, teamId);
      if (existing) {
        if (existing.status === "pending") {
          throw new Error("You already have a pending request for this team. The captain will see it in their Join Requests.");
        }
        if (existing.status === "approved") {
          // Participant has an approved request for this team. Check whether they
          // are still actually a member; if they left (no membership row), allow
          // them to re-request by flipping back to pending.
          const { data: memberRow, error: memberCheckErr } = await supabase
            .from("comp_team_members")
            .select("id")
            .eq("team_id", teamId)
            .eq("participant_id", participantId)
            .maybeSingle();

          if (memberCheckErr) {
            throw new Error("Could not verify your team membership. Please refresh the page and try again.");
          }

          if (memberRow) {
            throw new Error("You're already in this team. Refresh the page to see your team.");
          }

          const { data: updated, error: updateErr } = await supabase
            .from("comp_join_requests")
            .update({ status: "pending" })
            .eq("id", existing.id)
            .select()
            .single();

          if (updateErr) {
            throw new Error("Failed to send join request. Please try again.");
          }

          return updated as CompJoinRequest;
        }
        if (existing.status === "denied") {
          throw new Error("Your previous request to this team was rejected. You can't request again.");
        }
      }
      throw new Error("You already have a request for this team. Check your Team Hub.");
    }
    if (error.code === "PGRST205") {
      throw new Error(
        "Request to join is not available yet. The database migration for join requests has not been applied. " +
        "Ask an admin to run the SQL in citech-competition/supabase/migrations/add_join_requests.sql in the Supabase SQL Editor."
      );
    }
    throw error;
  }
  return data as CompJoinRequest;
}

export async function getMyPendingRequests(
  supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>,
  participantId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("comp_join_requests")
    .select("team_id")
    .eq("participant_id", participantId)
    .eq("status", "pending");

  if (error && error.code === "PGRST205") {
    return [];
  }
  return (data ?? []).map((r: any) => r.team_id);
}

/** Get the current user's existing join request for a team, if any (for re-request / 23505 handling). */
export async function getMyJoinRequestForTeam(
  supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>,
  participantId: string,
  teamId: string
): Promise<CompJoinRequest | null> {
  const { data, error } = await supabase
    .from("comp_join_requests")
    .select("id, team_id, participant_id, status, created_at, updated_at")
    .eq("participant_id", participantId)
    .eq("team_id", teamId)
    .maybeSingle();

  if (error || !data) return null;
  return data as CompJoinRequest;
}

export async function getJoinRequestsForTeam(
  supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>,
  teamId: string
): Promise<CompJoinRequestWithParticipant[]> {
  const { data, error } = await supabase
    .from("comp_join_requests")
    .select("*, comp_participants(id, full_name, email)")
    .eq("team_id", teamId)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[getJoinRequestsForTeam]", error);
    throw error;
  }
  return (data ?? []) as CompJoinRequestWithParticipant[];
}

export async function approveJoinRequest(
  supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>,
  requestId: string,
  teamId: string,
  participantId: string
) {
  const { error: updateErr } = await supabase
    .from("comp_join_requests")
    .update({ status: "approved" })
    .eq("id", requestId);
  if (updateErr) {
    if (updateErr.code === "42501") {
      throw new Error("Team forming has been locked by the organisers.");
    }
    throw updateErr;
  }
  const { error: memberErr } = await supabase
    .from("comp_team_members")
    .insert({ team_id: teamId, participant_id: participantId });

  if (memberErr) {
    if (memberErr.code === "42501") {
      throw new Error("Team forming has been locked by the organisers.");
    }
    if (memberErr.message?.includes("Team is full")) throw new Error("Team is full (max 4 members).");
    if (memberErr.code === "23505") throw new Error("This participant is already in a team.");
    throw memberErr;
  }
}

export async function denyJoinRequest(
  supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>,
  requestId: string
) {
  const { error } = await supabase
    .from("comp_join_requests")
    .update({ status: "denied" })
    .eq("id", requestId);

  if (error) throw error;
}

export async function cancelJoinRequest(
  supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>,
  requestId: string
) {
  const { error } = await supabase
    .from("comp_join_requests")
    .delete()
    .eq("id", requestId);

  if (error) throw error;
}

// ─── Admin helpers ─────────────────────────────────────────────────────────────

export async function checkIsAdmin(supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("comp_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return data !== null;
}

// ─── Admin Team helpers ─────────────────────────────────────────────────────────

export async function getAllTeamsAdmin(
  supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>
): Promise<{ team: CompTeam; members: CompTeamMemberWithParticipant[]; owner_name: string }[]> {
  const { data: teams, error } = await supabase
    .from("comp_teams")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const result: { team: CompTeam; members: CompTeamMemberWithParticipant[]; owner_name: string }[] = [];

  for (const t of (teams ?? [])) {
    const { data: members } = await supabase
      .from("comp_team_members")
      .select("*, comp_participants(id, full_name, email)")
      .eq("team_id", t.id);

    const ownerMember = (members ?? []).find((m: any) => m.participant_id === t.owner_id);
    const ownerName = (ownerMember as any)?.comp_participants?.full_name ?? "Unknown";

    result.push({
      team: t as CompTeam,
      members: (members ?? []) as CompTeamMemberWithParticipant[],
      owner_name: ownerName,
    });
  }

  return result;
}

export async function adminAddMember(
  supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>,
  teamId: string,
  participantId: string
) {
  const { error } = await supabase
    .from("comp_team_members")
    .insert({ team_id: teamId, participant_id: participantId });

  if (error) {
    if (error.message?.includes("Team is full")) throw new Error("Team is full (max 4 members).");
    if (error.code === "23505") throw new Error("This participant is already in a team.");
    throw error;
  }
}

export async function adminChangeOwner(
  supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>,
  teamId: string,
  newOwnerId: string
) {
  const { error } = await supabase
    .from("comp_teams")
    .update({ owner_id: newOwnerId })
    .eq("id", teamId);

  if (error) throw error;
}

export async function getUnassignedParticipants(
  supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>
): Promise<CompParticipant[]> {
  const { data: allMembers } = await supabase
    .from("comp_team_members")
    .select("participant_id");

  const assignedIds = new Set((allMembers ?? []).map((m: any) => m.participant_id));

  const { data: participants, error } = await supabase
    .from("comp_participants")
    .select("*")
    .eq("status", "approved")
    .order("full_name", { ascending: true });

  if (error) throw error;

  return (participants ?? []).filter((p: any) => !assignedIds.has(p.id)) as CompParticipant[];
}

export async function adminGetJoinRequestsForTeam(
  supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>,
  teamId: string
): Promise<CompJoinRequestWithParticipant[]> {
  const { data } = await supabase
    .from("comp_join_requests")
    .select("*, comp_participants(id, full_name, email)")
    .eq("team_id", teamId)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  return (data ?? []) as CompJoinRequestWithParticipant[];
}

export function exportParticipantsCSV(participants: CompParticipant[]): string {
  const headers = [
    "Name",
    "Email",
    "Age",
    "University",
    "Student ID",
    "Program",
    "Year of Study",
    "Goals",
    "LinkedIn",
    "GitHub",
    "Portfolio",
    "Status",
    "Registered At",
  ];
  const rows = participants.map((p) => [
    p.full_name,
    p.email,
    p.age,
    p.university === "otu" ? "Ontario Tech University" : p.university_name ?? "Other",
    p.student_id ?? "",
    p.program,
    p.year_of_study,
    (p.goals ?? "").replace(/,/g, ";"),
    p.linkedin_url ?? "",
    p.github_url ?? "",
    p.portfolio_url ?? "",
    p.status,
    p.created_at,
  ]);

  return [headers, ...rows].map((r) => r.join(",")).join("\n");
}
