"use client";

import { motion } from "framer-motion";
import { FileText, Scale } from "lucide-react";
import {
  DELIVERABLE_DEMO_SYSTEM,
  DELIVERABLE_REPORT_PPT,
  DELIVERABLE_SHORT_VIDEO_OPTIONAL,
  EVALUATION_FORM_TITLE,
  EVALUATION_SCALE,
  EVALUATION_SCORE_SECTION_TITLE,
  FINAL_SUBMISSION_TITLE,
  JUDGING_CRITERIA,
} from "@/lib/submissionJudgingContent";

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, damping: 22, stiffness: 120 },
  },
};

export default function ParticipantSubmissionGuidance() {
  return (
    <motion.section
      variants={sectionVariants}
      initial="hidden"
      animate="visible"
      transition={{ delay: 0.55 }}
      className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2"
      aria-label="Final submission deliverables and evaluation criteria"
    >
      {/* Deliverables */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-500/25 bg-cyan-500/10">
            <FileText className="h-5 w-5 text-cyan-400" aria-hidden />
          </div>
          <h2 className="text-xl font-bold tracking-tight">
            {FINAL_SUBMISSION_TITLE}
          </h2>
        </div>

        <ul className="space-y-5 text-sm leading-relaxed text-zinc-300">
          <li>
            <span className="font-semibold text-white">{DELIVERABLE_REPORT_PPT.title}</span>
            {DELIVERABLE_REPORT_PPT.includes.length > 0 && (
              <>
                <span className="text-zinc-500">, including:</span>
                <ul className="mt-3 list-disc space-y-2 pl-5 marker:text-cyan-400/70">
                  {DELIVERABLE_REPORT_PPT.includes.map((line) => (
                    <li key={line} className="text-zinc-300">
                      {line}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </li>
          <li className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
            {DELIVERABLE_DEMO_SYSTEM}
          </li>
          <li className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
            {DELIVERABLE_SHORT_VIDEO_OPTIONAL}
          </li>
        </ul>
      </div>

      {/* Judging criteria */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-8">
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-blue-600/15 via-blue-500/5 to-transparent"
          aria-hidden
        />
        <svg
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 w-full text-blue-400/25"
          viewBox="0 0 1440 48"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            fill="currentColor"
            d="M0,32 C180,8 360,40 540,24 C720,8 900,36 1080,28 C1260,20 1380,12 1440,16 L1440,48 L0,48 Z"
          />
        </svg>

        <div className="relative z-10">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-500/25 bg-blue-500/10">
              <Scale className="h-5 w-5 text-blue-400" aria-hidden />
            </div>
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-500">
                {EVALUATION_FORM_TITLE}
              </p>
              <h2 className="text-lg font-bold tracking-tight text-white sm:text-xl">
                {EVALUATION_SCORE_SECTION_TITLE}
              </h2>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/30">
            <table className="w-full min-w-[280px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03]">
                  <th scope="col" className="px-4 py-3 font-semibold text-zinc-200">
                    Criterion
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold text-zinc-200">
                    Max
                  </th>
                </tr>
              </thead>
              <tbody>
                {JUDGING_CRITERIA.map((row) => (
                  <tr
                    key={row.label}
                    className="border-b border-white/5 last:border-b-0"
                  >
                    <td className="px-4 py-3 text-zinc-300">
                      {row.label} ({row.max})
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-cyan-400/90">
                      {row.max}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-400 sm:text-sm">
            {EVALUATION_SCALE.map((row) => (
              <li key={row.band}>
                <span className="text-zinc-200">{row.band}:</span>{" "}
                <span className="font-mono text-zinc-400">{row.range}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.section>
  );
}
