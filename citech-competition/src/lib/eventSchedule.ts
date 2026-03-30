/**
 * Central lifecycle schedule for the 2026 competition.
 * All dates are specified in Eastern local time for Oshawa (America/Toronto).
 */
export const COMPETITION_TIMEZONE = "America/Toronto";

export const SCHEDULE = {
  APPLICATIONS_CLOSE: new Date("2026-04-01T00:00:00-04:00"),
  OPENING_CEREMONY_START: new Date("2026-04-02T18:00:00-04:00"),
  OPENING_CEREMONY_END: new Date("2026-04-02T21:30:00-04:00"),
  EVENT_START: new Date("2026-04-02T21:30:00-04:00"),
  TEAM_CHANGES_CLOSE: new Date("2026-04-02T23:59:00-04:00"),
  SUBMISSIONS_OPEN: new Date("2026-04-06T12:00:00-04:00"),
  SUBMISSIONS_CLOSE: new Date("2026-04-09T10:00:00-04:00"),
  CLOSING_CEREMONY_START: new Date("2026-04-09T15:00:00-04:00"),
  CLOSING_CEREMONY_END: new Date("2026-04-09T18:00:00-04:00"),
} as const;

export interface Milestone {
  label: string;
  date: Date;
}

/**
 * Countdown targets for participant UI.
 * Keep this generic before event start so detailed internal schedule isn't exposed.
 */
export function getNextMilestone(now: Date): Milestone | null {
  if (now < SCHEDULE.EVENT_START) {
    return { label: "Event Starts In", date: SCHEDULE.EVENT_START };
  }
  if (now < SCHEDULE.SUBMISSIONS_OPEN) {
    return { label: "Submissions Open In", date: SCHEDULE.SUBMISSIONS_OPEN };
  }
  if (now < SCHEDULE.SUBMISSIONS_CLOSE) {
    return { label: "Submission Deadline", date: SCHEDULE.SUBMISSIONS_CLOSE };
  }
  if (now < SCHEDULE.CLOSING_CEREMONY_START) {
    return { label: "Closing Ceremony In", date: SCHEDULE.CLOSING_CEREMONY_START };
  }
  if (now < SCHEDULE.CLOSING_CEREMONY_END) {
    return { label: "Closing Ceremony Ends In", date: SCHEDULE.CLOSING_CEREMONY_END };
  }
  return null;
}

export function getEventPhase(now: Date): "pre" | "active" | "ended" {
  if (now < SCHEDULE.EVENT_START) return "pre";
  if (now < SCHEDULE.CLOSING_CEREMONY_END) return "active";
  return "ended";
}
