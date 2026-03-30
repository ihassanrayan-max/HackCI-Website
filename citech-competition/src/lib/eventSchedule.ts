/**
 * Single source of truth for Cognitive Innovation Competition 2026 schedule (America/Toronto).
 * Update dates here only when the schedule changes.
 */

/** Competition kickoff — April 2, 2026, 3:00 PM Eastern */
export const EVENT_START = new Date("2026-04-02T15:00:00-04:00");

/** Competition ends — April 9, 2026, 3:00 PM Eastern */
export const EVENT_END = new Date("2026-04-09T15:00:00-04:00");

/** Project submission deadline (same as event end for now; may diverge later) */
export const SUBMISSION_DEADLINE = new Date("2026-04-09T15:00:00-04:00");

export interface Milestone {
  label: string;
  date: Date;
}

/** Next countdown target for dashboard: event start, then submission deadline, then none. */
export function getNextMilestone(now: Date): Milestone | null {
  if (now < EVENT_START) {
    return { label: "Event Starts In", date: EVENT_START };
  }
  if (now < SUBMISSION_DEADLINE) {
    return { label: "Submission Deadline", date: SUBMISSION_DEADLINE };
  }
  return null;
}

export function getEventPhase(now: Date): "pre" | "active" | "ended" {
  if (now < EVENT_START) return "pre";
  if (now < EVENT_END) return "active";
  return "ended";
}
