"use client";

import { motion } from "framer-motion";
import { FileText, FolderInput, Scale } from "lucide-react";
import {
  EVALUATION_FORM_TITLE,
  EVALUATION_SCALE,
  EVALUATION_SCORE_SECTION_TITLE,
  FINAL_SUBMISSION_TITLE,
  JUDGING_CRITERIA,
  SUBMISSION_REQUIREMENTS,
} from "@/lib/submissionJudgingContent";
import {
  DRIVE_FOLDER_BULLETS,
  DRIVE_FOLDER_TITLE,
  LOGISTICS_SECTION_TITLE,
  SCHEDULE_SECTION_TITLE,
  SUBMIT_SECTION_TITLE,
  TIMELINE_INTRO,
  TIMELINE_ITEMS,
  TIMELINE_NOTES,
  ZIP_ON_DRIVE_BULLETS,
  ZIP_ON_DRIVE_TITLE,
} from "@/lib/submissionLogisticsCopy";

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, damping: 22, stiffness: 120 },
  },
};

function Checklist({ items, compact }: { items: readonly string[]; compact?: boolean }) {
  return (
    <ul
      className={`border-l border-zinc-700/60 pl-3 ${compact ? "mt-2 space-y-1.5" : "mt-3 space-y-2"}`}
    >
      {items.map((line) => (
        <li key={line} className="text-[12px] leading-relaxed text-zinc-400 lg:text-[13px]">
          {line}
        </li>
      ))}
    </ul>
  );
}

/** Deadlines + submission — tuned for the narrow third column in the unified row. */
function LogisticsColumn() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-start gap-3 border-b border-white/[0.06] pb-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-600/40 bg-zinc-900/80">
          <FolderInput className="h-4 w-4 text-zinc-300" aria-hidden />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight text-white">
            {LOGISTICS_SECTION_TITLE}
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500 sm:text-sm">{TIMELINE_INTRO}</p>
        </div>
      </div>

      <div className="mt-5 flex min-h-0 flex-1 flex-col gap-5">
        <div>
          <h3 className="text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-600">
            {SCHEDULE_SECTION_TITLE}
          </h3>
          <ul className="mt-3 space-y-2">
            {TIMELINE_ITEMS.map((item) => (
              <li
                key={item.label}
                className="rounded-lg border border-white/[0.06] bg-black/25 px-3 py-2.5"
              >
                <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                  {item.label}
                </p>
                <p className="mt-1 text-xs font-medium leading-snug text-zinc-200">{item.when}</p>
              </li>
            ))}
          </ul>
          <ul className="mt-3 space-y-2 text-xs leading-relaxed text-zinc-500">
            {TIMELINE_NOTES.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>

        <div className="border-t border-white/[0.06] pt-5">
          <h3 className="text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-600">
            {SUBMIT_SECTION_TITLE}
          </h3>
          <div className="mt-3 space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-zinc-200">{DRIVE_FOLDER_TITLE}</h4>
              <Checklist items={DRIVE_FOLDER_BULLETS} compact />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-zinc-200">{ZIP_ON_DRIVE_TITLE}</h4>
              <Checklist items={ZIP_ON_DRIVE_BULLETS} compact />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ParticipantSubmissionGuidance() {
  return (
    <motion.section
      variants={sectionVariants}
      initial="hidden"
      animate="visible"
      transition={{ delay: 0.55 }}
      className="mt-10"
      aria-label="Final submission deliverables and evaluation criteria"
    >
      {/* One surface: three panes read as a single module on wide screens; stack on small. */}
      <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-zinc-950/40 backdrop-blur-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 lg:items-stretch">
          {/* Final submission — widest pane for body copy */}
          <div className="border-b border-white/[0.08] p-6 sm:p-7 lg:col-span-5 lg:border-b-0 lg:border-r">
            <div className="flex items-start gap-3 border-b border-white/[0.06] pb-5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-600/40 bg-zinc-900/80">
                <FileText className="h-4 w-4 text-zinc-300" aria-hidden />
              </div>
              <h2 className="pt-1 text-base font-semibold tracking-tight text-white sm:text-lg">
                {FINAL_SUBMISSION_TITLE}
              </h2>
            </div>
            <dl className="mt-5 space-y-4 sm:space-y-5">
              {SUBMISSION_REQUIREMENTS.map((row) => (
                <div key={row.title}>
                  <dt className="text-sm font-semibold text-zinc-200">{row.title}</dt>
                  <dd className="mt-1 text-sm leading-relaxed text-zinc-400">{row.text}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Evaluation */}
          <div className="relative border-b border-white/[0.08] p-6 sm:p-7 lg:col-span-4 lg:border-b-0 lg:border-r">
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-blue-950/25 to-transparent lg:h-32"
              aria-hidden
            />
            <div className="relative z-10 flex h-full min-h-0 flex-col">
              <div className="flex items-start gap-3 border-b border-white/[0.06] pb-5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-600/40 bg-zinc-900/80">
                  <Scale className="h-4 w-4 text-zinc-300" aria-hidden />
                </div>
                <div className="min-w-0 pt-0.5">
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500">
                    {EVALUATION_FORM_TITLE}
                  </p>
                  <h2 className="mt-0.5 text-base font-semibold tracking-tight text-white sm:text-lg">
                    {EVALUATION_SCORE_SECTION_TITLE}
                  </h2>
                </div>
              </div>

              <div className="mt-5 min-h-0 flex-1">
                <div className="overflow-x-auto rounded-xl border border-white/[0.06] bg-black/30">
                  <table className="w-full min-w-[220px] text-left text-[12px] lg:text-[13px]">
                    <thead>
                      <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                        <th scope="col" className="px-3 py-2.5 font-medium text-zinc-300">
                          Criterion
                        </th>
                        <th scope="col" className="px-3 py-2.5 text-right font-medium text-zinc-300">
                          Max
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {JUDGING_CRITERIA.map((row) => (
                        <tr key={row.label} className="border-b border-white/[0.04] last:border-b-0">
                          <td className="px-3 py-2 text-zinc-400">{row.label}</td>
                          <td className="px-3 py-2 text-right font-mono text-zinc-300">{row.max}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-[10px] font-medium uppercase tracking-wider text-zinc-600">
                  Scale (per criterion)
                </p>
                <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-zinc-500">
                  {EVALUATION_SCALE.map((row) => (
                    <li key={row.band}>
                      <span className="text-zinc-400">{row.band}</span>{" "}
                      <span className="font-mono text-zinc-600">{row.range}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Deadlines & submission */}
          <div className="p-6 sm:p-7 lg:col-span-3 lg:py-7">
            <LogisticsColumn />
          </div>
        </div>
      </div>
    </motion.section>
  );
}
