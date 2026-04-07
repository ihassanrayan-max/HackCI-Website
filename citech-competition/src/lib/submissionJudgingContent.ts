/**
 * Submission requirements — text as provided by organizers.
 */

export const FINAL_SUBMISSION_TITLE = "Final submission" as const;

export type SubmissionRequirement = {
  title: string;
  text: string;
};

export const SUBMISSION_REQUIREMENTS: readonly SubmissionRequirement[] = [
  {
    title: "Title Page",
    text: "Include team name, all team members, and the selected topic",
  },
  {
    title: "Report",
    text: "Present your proposed solution, system design (including diagrams or flowcharts if applicable), relevant case studies, results analysis, and conclusion",
  },
  {
    title: "PowerPoint Slides",
    text: "Submit the slides to be used for the live presentation (no script required)",
  },
  {
    title: "Source Code (if applicable)",
    text: "Include with clear instructions for execution (e.g., via a GitHub repository)",
  },
  {
    title: "Data (if applicable)",
    text: "Provide any collected data in CSV format",
  },
  {
    title: "Optional",
    text: "Include a short video demonstrating your system",
  },
] as const;

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
