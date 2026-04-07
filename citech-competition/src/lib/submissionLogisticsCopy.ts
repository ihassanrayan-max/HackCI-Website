/**
 * Dashboard copy for submission logistics (Drive/ZIP) and schedule summary.
 * Dates align with citech-competition/src/lib/eventSchedule.ts (America/Toronto).
 */

export const LOGISTICS_SECTION_TITLE = "Deadlines and submission" as const;

export const SCHEDULE_SECTION_TITLE = "Schedule" as const;

export const SUBMIT_SECTION_TITLE = "How to submit" as const;

export const TIMELINE_INTRO =
  "All times are Eastern. Upload your materials through the competition website." as const;

export const TIMELINE_ITEMS = [
  {
    label: "Dropbox opens",
    when: "Wed Apr 8, 2026 · 9:00 AM",
  },
  {
    label: "Materials due",
    when: "Wed Apr 8, 2026 · 6:00 PM",
  },
  {
    label: "Live presentations",
    when: "Thu Apr 9, 2026 · 6:00 PM",
  },
] as const;

export const TIMELINE_NOTES = [
  "Submit the full package before the 6:00 PM deadline the same day the dropbox opens.",
  "Present to judges on Thursday evening; your demo happens during that session.",
] as const;

export const DRIVE_FOLDER_TITLE = "Google Drive link" as const;

export const DRIVE_FOLDER_BULLETS = [
  "Submit one folder link that includes everything listed above.",
  "Set sharing so anyone with the link can view.",
] as const;

export const ZIP_ON_DRIVE_TITLE = "ZIP file" as const;

/** Short hint under the dashboard submission field. */
export const SUBMISSION_PORTAL_HELPER =
  "Paste a Google Drive folder link (must be a drive.google.com address), shared for viewing. If you use a ZIP, upload it to Drive first, then share that link." as const;

export const ZIP_ON_DRIVE_BULLETS = [
  "You may upload one .zip to Drive and share that file, or put a zip inside a shared folder.",
  "Use clear file names so each part is easy to find.",
] as const;
