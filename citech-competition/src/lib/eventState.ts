/**
 * Event state helpers — backed by Supabase comp_event_state table.
 * The dashboard subscribes to realtime changes; the admin writes updates.
 *
 * Exports the same TypeScript interfaces as the old localStorage version
 * so pages need minimal changes.
 */

export type TrackType = "A" | "B";
export type PositionType = 1 | 2;

export interface ParticipantResult {
  track: TrackType;
  position: PositionType;
}

export interface EventState {
  briefingReleased: boolean;
  submissionsOpen: boolean;
  resultsReleased: boolean;
  applicationsOpen: boolean;
  teamChangesOpen: boolean;
}

export const PRIZE_MAP: Record<PositionType, string> = {
  1: "$400 + Internship Interview",
  2: "$300 + Internship Interview",
};

/** Map DB snake_case → camelCase for component consumption */
export function mapEventState(row: {
  briefing_released: boolean;
  submissions_open: boolean;
  results_released: boolean;
  applications_open: boolean;
  team_changes_open: boolean;
}): EventState {
  return {
    briefingReleased: row.briefing_released,
    submissionsOpen: row.submissions_open,
    resultsReleased: row.results_released,
    applicationsOpen: row.applications_open,
    teamChangesOpen: row.team_changes_open,
  };
}

export const DEFAULT_EVENT_STATE: EventState = {
  briefingReleased: false,
  submissionsOpen: false,
  resultsReleased: false,
  applicationsOpen: true,
  teamChangesOpen: true,
};
