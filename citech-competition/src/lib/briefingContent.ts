/**
 * Official challenge copy — paste matches organizer text verbatim where noted.
 */

export interface BriefingChallenge {
  id: string;
  title: string;
  /** Uppercase pill label (layout only). */
  category: string;
  /** Main description — exact paste from the official brief. */
  summary: string;
  awards: string[];
  notes: string[];
}

export const COMPETITION_BRIEFING = {
  eyebrow: "Official Competition Briefing",
  title: "Challenge Briefs for the Cognitive Innovation Competition 2026",
  timelineLabel: "Design Window",
  timelineValue: "April 2-9, 2026",
} as const;

/** Shared lines that apply to each challenge stream (exact paste). */
export const BRIEFING_SHARED_AWARD_LINES = [
  "Design team 1: $400",
  "Design team 2: $300",
] as const;

export const BRIEFING_SHARED_NOTES = [
  "Interview with the winning teams.",
  "The payment will be for the design work during this period.",
] as const;

export const BRIEFING_CHALLENGES: BriefingChallenge[] = [
  {
    id: "control-room-design",
    title: "AI for digital control room design with human performance considerations",
    category: "DIGITAL CONTROL ROOM + HUMAN PERFORMANCE",
    summary:
      "Design new techniques, methods, and automated systems to improve human performance with control room design for nuclear power plants using digital twins, including enhanced human monitoring and decision support functions. Demonstrate a developed solution with test scenarios.",
    awards: [...BRIEFING_SHARED_AWARD_LINES],
    notes: [...BRIEFING_SHARED_NOTES],
  },
  {
    id: "resilient-infrastructure",
    title: "AI for resilient interconnected infrastructures",
    category: "INFRASTRUCTURE RESILIENCE + HYBRID ENERGY SYSTEMS",
    summary:
      "Design new techniques, methods, and automated systems to enhance resiliency of interconnected infrastructures including energy systems. The proposed solution will demonstrate physical system model of interconnected infrastructures with hybrid energy system and show evaluation of resiliency based on selected case study and scenarios.",
    awards: [...BRIEFING_SHARED_AWARD_LINES],
    notes: [...BRIEFING_SHARED_NOTES],
  },
];
