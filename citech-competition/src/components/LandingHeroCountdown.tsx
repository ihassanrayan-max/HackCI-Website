"use client";

import { motion } from "framer-motion";
import { Calendar, PartyPopper } from "lucide-react";
import { EVENT_START, getEventPhase } from "@/lib/eventSchedule";
import { useCountdown } from "@/hooks/useCountdown";

const pad = (n: number) => String(n).padStart(2, "0");

export default function LandingHeroCountdown() {
  const { days, hours, minutes, seconds, isExpired } = useCountdown(EVENT_START);
  const phase = getEventPhase(new Date());

  if (isExpired) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="mt-10 w-full max-w-xl"
      >
        <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5 backdrop-blur-md flex items-center gap-4">
          {phase === "active" ? (
            <>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10">
                <Calendar className="h-6 w-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-cyan-400">Event in progress</p>
                <p className="text-sm text-zinc-400">The competition is underway — good luck!</p>
              </div>
            </>
          ) : (
            <>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-zinc-600 bg-zinc-900">
                <PartyPopper className="h-6 w-6 text-zinc-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-300">Event ended</p>
                <p className="text-sm text-zinc-500">Thanks for visiting Cognitive Innovation Competition 2026.</p>
              </div>
            </>
          )}
        </div>
      </motion.div>
    );
  }

  const units = [
    { value: pad(days), label: "Days" },
    { value: pad(hours), label: "Hours" },
    { value: pad(minutes), label: "Mins" },
    { value: pad(seconds), label: "Secs" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
      className="mt-10 w-full max-w-2xl"
    >
      <p className="mb-4 text-xs font-mono uppercase tracking-[0.2em] text-zinc-500">
        Until competition starts
      </p>
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {units.map((u) => (
          <div
            key={u.label}
            className="rounded-2xl border border-white/10 bg-white/5 px-2 py-4 text-center backdrop-blur-md sm:px-4 sm:py-5"
          >
            <div className="font-mono text-2xl font-bold tabular-nums text-cyan-400 sm:text-3xl md:text-4xl">
              {u.value}
            </div>
            <div className="mt-1 text-[10px] font-medium uppercase tracking-wider text-zinc-500 sm:text-xs">
              {u.label}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
