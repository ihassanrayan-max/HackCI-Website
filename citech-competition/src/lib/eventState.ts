/**
 * Event state helpers — backed by Supabase comp_event_state table.
 * The UI consumes computed "effective state" (schedule + admin overrides).
 */

import { computeEffectiveState, type AdminOverrides, type EffectiveEventState } from "@/lib/eventLifecycle";

export type TrackType = "A" | "B";
export type PositionType = 1 | 2;

export interface ParticipantResult {
  track: TrackType;
  position: PositionType;
}

export type EventState = EffectiveEventState;

export interface EventStateRow {
  briefing_released_override: boolean | null;
  submissions_open_override: boolean | null;
  results_released: boolean;
  applications_open_override: boolean | null;
  team_changes_open_override: boolean | null;
}

export const PRIZE_MAP: Record<PositionType, string> = {
  1: "$400 + Internship Interview",
  2: "$300 + Internship Interview",
};

/** Map DB row to explicit admin overrides. */
export function mapAdminOverrides(row: EventStateRow): AdminOverrides {
  return {
    applicationsOpenOverride: row.applications_open_override,
    briefingReleasedOverride: row.briefing_released_override,
    submissionsOpenOverride: row.submissions_open_override,
    teamChangesOpenOverride: row.team_changes_open_override,
    resultsReleased: row.results_released,
  };
}

/** Map DB row to effective lifecycle state for participant-facing behavior. */
export function mapEventState(row: EventStateRow, now: Date = new Date()): EventState {
  return computeEffectiveState(now, mapAdminOverrides(row));
}

export const DEFAULT_EVENT_STATE: EventState = {
  applicationsOpen: false,
  eventStarted: false,
  briefingReleased: false,
  submissionsOpen: false,
  resultsReleased: false,
  teamChangesOpen: false,
};
