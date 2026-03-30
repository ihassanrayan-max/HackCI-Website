import { SCHEDULE } from "@/lib/eventSchedule";

export interface AdminOverrides {
  applicationsOpenOverride: boolean | null;
  briefingReleasedOverride: boolean | null;
  submissionsOpenOverride: boolean | null;
  teamChangesOpenOverride: boolean | null;
  resultsReleased: boolean;
}

export interface EffectiveEventState {
  applicationsOpen: boolean;
  eventStarted: boolean;
  briefingReleased: boolean;
  submissionsOpen: boolean;
  resultsReleased: boolean;
  teamChangesOpen: boolean;
}

export function computeEffectiveState(
  now: Date,
  overrides: AdminOverrides
): EffectiveEventState {
  const eventStarted = now >= SCHEDULE.EVENT_START;
  const applicationsOpenBySchedule = now < SCHEDULE.APPLICATIONS_CLOSE;
  const teamChangesOpenBySchedule =
    now >= SCHEDULE.EVENT_START && now <= SCHEDULE.TEAM_CHANGES_CLOSE;
  const submissionsOpenBySchedule =
    now >= SCHEDULE.SUBMISSIONS_OPEN && now < SCHEDULE.SUBMISSIONS_CLOSE;

  return {
    applicationsOpen:
      overrides.applicationsOpenOverride ?? applicationsOpenBySchedule,
    eventStarted,
    briefingReleased: eventStarted && (overrides.briefingReleasedOverride ?? false),
    submissionsOpen:
      overrides.submissionsOpenOverride ?? submissionsOpenBySchedule,
    resultsReleased: overrides.resultsReleased,
    teamChangesOpen:
      overrides.teamChangesOpenOverride ?? teamChangesOpenBySchedule,
  };
}

