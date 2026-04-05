/**
 * Verbatim copy from organizer materials (email deliverables + evaluation form).
 * Do not add content here that is not from those sources.
 */

export const FINAL_SUBMISSION_TITLE = "Final submission" as const;

/** Top-level deliverable: report / ppt with nested items (from organizer email). */
export const DELIVERABLE_REPORT_PPT = {
  title: "Report / ppt about the solution",
  includes: [
    "Brief background literature of existing solutions",
    "Proposed solution details",
    "Design",
    "Case studies",
    "Demo",
    "Results analysis",
    "Conclusions",
  ],
} as const;

export const DELIVERABLE_DEMO_SYSTEM = "Simple demo system" as const;

export const DELIVERABLE_SHORT_VIDEO_OPTIONAL = "Short video (optional)" as const;

export const EVALUATION_FORM_TITLE = "Evaluation Form" as const;

/** Header from the evaluation form (full mark 50). */
export const EVALUATION_SCORE_SECTION_TITLE =
  "Evaluation Content and Score (Full mark: 50)" as const;

export const JUDGING_CRITERIA = [
  { label: "Originality", max: 10 },
  { label: "Applicability", max: 10 },
  { label: "Technical Merit", max: 10 },
  { label: "Present", max: 10 },
  { label: "Impacts", max: 10 },
] as const;

/** Qualitative scale under the evaluation form header (per-category 10-point scale). */
export const EVALUATION_SCALE = [
  { band: "Poor", range: "1-3" },
  { band: "Fair", range: "4-6" },
  { band: "Good", range: "7-8" },
  { band: "Excellent", range: "9-10" },
] as const;
