/**
 * Single source of truth for Cognitive Innovation Competition 2026 schedule (America/Toronto).
 * Update dates here only when the schedule changes.
 */

const TORONTO: Intl.DateTimeFormatOptions = { timeZone: "America/Toronto" };

/** Competition kickoff — April 2, 2026, 3:00 PM Eastern */
export const EVENT_START = new Date("2026-04-02T15:00:00-04:00");

/** After live presentations (same evening, Eastern) */
export const EVENT_END = new Date("2026-04-09T21:00:00-04:00");

/** Submission dropbox opens — April 8, 2026, 9:00 AM Eastern */
export const SUBMISSION_DROPBOX_OPENS = new Date("2026-04-08T09:00:00-04:00");

/** All components due via competition website — April 8, 2026, 6:00 PM Eastern */
export const SUBMISSION_DEADLINE = new Date("2026-04-08T18:00:00-04:00");

/** Live presentations — April 9, 2026, 6:00 PM Eastern */
export const LIVE_PRESENTATIONS = new Date("2026-04-09T18:00:00-04:00");

export interface Milestone {
  label: string;
  date: Date;
}

const monthDay = new Intl.DateTimeFormat("en-US", {
  ...TORONTO,
  month: "short",
  day: "numeric",
});

/** Short label for countdown badge (e.g. APR 8). */
export function formatMilestoneDay(date: Date): string {
  return monthDay.format(date).toUpperCase().replace(",", "");
}

/** Range chip when no upcoming milestone (e.g. APR 2 – APR 9). */
export function formatScheduleRangeChip(): string {
  const a = formatMilestoneDay(EVENT_START);
  const b = formatMilestoneDay(EVENT_END);
  return `${a} – ${b}`;
}

/**
 * Next countdown target for dashboard: event start, then dropbox, submission deadline,
 * live presentations; then none.
 */
export function getNextMilestone(now: Date): Milestone | null {
  if (now < EVENT_START) {
    return { label: "Event starts in", date: EVENT_START };
  }
  if (now < SUBMISSION_DROPBOX_OPENS) {
    return { label: "Submission dropbox opens", date: SUBMISSION_DROPBOX_OPENS };
  }
  if (now < SUBMISSION_DEADLINE) {
    return { label: "Submission deadline", date: SUBMISSION_DEADLINE };
  }
  if (now < LIVE_PRESENTATIONS) {
    return { label: "Live presentations", date: LIVE_PRESENTATIONS };
  }
  return null;
}

export function getEventPhase(now: Date): "pre" | "active" | "ended" {
  if (now < EVENT_START) return "pre";
  if (now < EVENT_END) return "active";
  return "ended";
}
