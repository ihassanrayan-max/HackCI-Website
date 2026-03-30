"use client";

import { useState, useEffect } from "react";
import { Code, CheckCircle2 } from "lucide-react";
import { getEventPhase, getNextMilestone } from "@/lib/eventSchedule";
import { computeCountdown } from "@/hooks/useCountdown";

const pad = (n: number) => String(n).padStart(2, "0");

export default function EventCountdown() {
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const milestone = getNextMilestone(now);
  const phase = getEventPhase(now);

  if (phase === "pre") {
    return (
      <div className="flex h-full min-h-[180px] flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/20">
            <Code className="h-6 w-6 text-cyan-400" />
          </div>
          <span className="rounded bg-cyan-400/10 px-2 py-1 font-mono text-xs text-cyan-400">PRE-EVENT</span>
        </div>
        <div>
          <h3 className="mb-1 text-xl font-black text-zinc-200">Competition not started</h3>
          <p className="text-sm text-zinc-500">Event timing details unlock after opening ceremony.</p>
        </div>
      </div>
    );
  }

  if (!milestone) {
    return (
      <div className="flex h-full min-h-[180px] flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/20">
            <CheckCircle2 className="h-6 w-6 text-cyan-400" />
          </div>
          <span className="rounded bg-cyan-400/10 px-2 py-1 font-mono text-xs text-cyan-400">APR 2–9</span>
        </div>
        <div>
          <h3 className="mb-1 text-xl font-black text-zinc-200">Competition complete</h3>
          <p className="text-sm text-zinc-500">The event window has ended.</p>
        </div>
      </div>
    );
  }

  const { days, hours, minutes, seconds } = computeCountdown(milestone.date, now);

  const units = [
    { value: pad(days), label: "D" },
    { value: pad(hours), label: "H" },
    { value: pad(minutes), label: "M" },
    { value: pad(seconds), label: "S" },
  ];

  return (
    <div className="flex h-full min-h-[180px] flex-col justify-between gap-4">
      <div className="flex justify-between items-start">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/20">
          <Code className="h-6 w-6 text-cyan-400" />
        </div>
        <span className="rounded bg-cyan-400/10 px-2 py-1 font-mono text-xs text-cyan-400">APR 2–9</span>
      </div>
      <div className="flex flex-1 flex-col justify-end gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{milestone.label}</p>
        <div className="grid grid-cols-4 gap-1.5">
          {units.map((u) => (
            <div
              key={u.label}
              className="rounded-xl border border-white/10 bg-black/30 px-1 py-2 text-center"
            >
              <div className="font-mono text-lg font-bold tabular-nums text-cyan-400 sm:text-xl">
                {u.value}
              </div>
              <div className="text-[10px] font-medium text-zinc-500">{u.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
