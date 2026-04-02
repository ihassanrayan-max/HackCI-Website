import Link from "next/link";
import { redirect } from "next/navigation";
import type { ComponentType } from "react";
import { ArrowLeft, BookOpen, ClipboardCheck, ShieldCheck, Trophy } from "lucide-react";
import { BrandLogo } from "@/components/Brand";
import { BRIEFING_CHALLENGES, COMPETITION_BRIEFING } from "@/lib/briefingContent";
import { checkIsAdmin, getEventState, getMyParticipant } from "@/lib/db";
import { mapEventState } from "@/lib/eventState";
import { createClient } from "@/lib/supabase/server";

function BriefingSection({
  icon: Icon,
  label,
  items,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  items: readonly string[] | string[];
}) {
  return (
    <div className="rounded-[1.75rem] border border-white/8 bg-black/30 p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
          <Icon className="h-4 w-4 text-cyan-400" />
        </div>
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.22em] text-zinc-500">{label}</p>
        </div>
      </div>
      <ul className="space-y-3 text-sm leading-6 text-zinc-300">
        {items.map((item) => (
          <li key={item} className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function BriefingPage() {
  const supabase = await createClient();
  const [participant, isAdmin, rawEventState] = await Promise.all([
    getMyParticipant(supabase),
    checkIsAdmin(supabase),
    getEventState(supabase),
  ]);

  if (!participant && !isAdmin) {
    redirect("/");
  }

  if (!isAdmin && participant?.status !== "approved") {
    redirect("/dashboard");
  }

  const eventState = mapEventState(rawEventState);

  if (!isAdmin && !eventState.briefingReleased) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="fixed left-[-10%] top-[-10%] h-[38rem] w-[38rem] rounded-full bg-cyan-500/10 blur-[160px] pointer-events-none" />
      <div className="fixed bottom-[-15%] right-[-10%] h-[34rem] w-[34rem] rounded-full bg-blue-500/10 blur-[150px] pointer-events-none" />

      <nav className="sticky top-0 z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="interactive group/logo">
            <BrandLogo
              className="transition-transform group-hover/logo:scale-[1.03]"
              markClassName="h-10 w-10 text-cyan-400"
              textClassName="text-xl font-black tracking-tighter text-white"
            />
          </Link>

          <div className="flex items-center gap-3">
            {eventState.teamChangesOpen && participant && (
              <Link
                href="/team"
                className="interactive hidden items-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5 hover:text-white sm:flex"
              >
                Team Hub
              </Link>
            )}
            <Link
              href="/dashboard"
              className="interactive inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-sm font-medium transition-colors hover:bg-white/5"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-12 sm:py-16">
        <section className="mb-10 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.02] p-8 sm:p-10">
          <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-cyan-400 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
            </span>
            {isAdmin && !eventState.briefingReleased ? "Admin Preview" : "Briefing Live"}
          </div>

          <p className="mb-4 text-xs font-mono uppercase tracking-[0.28em] text-zinc-500">
            {COMPETITION_BRIEFING.eyebrow}
          </p>
          <h1 className="max-w-4xl text-4xl font-black tracking-tighter sm:text-6xl">
            {COMPETITION_BRIEFING.title.split("Competition 2026")[0]}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Competition 2026
            </span>
          </h1>

          <div className="mt-8 flex flex-wrap gap-3 text-xs font-mono uppercase tracking-[0.2em] text-zinc-400">
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
              {BRIEFING_CHALLENGES.length} challenge streams
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
              {COMPETITION_BRIEFING.timelineLabel}: {COMPETITION_BRIEFING.timelineValue}
            </span>
          </div>
        </section>

        <section className="space-y-8">
          {BRIEFING_CHALLENGES.map((challenge, index) => (
            <article
              key={challenge.id}
              className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.02] p-8 sm:p-10"
            >
              <div className="mb-8 max-w-4xl">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-xs font-mono uppercase tracking-[0.22em] text-cyan-400">
                    Challenge {index + 1}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-mono uppercase tracking-[0.22em] text-zinc-400">
                    {challenge.category}
                  </span>
                </div>
                <h2 className="text-3xl font-black tracking-tight sm:text-4xl">{challenge.title}</h2>
                <p className="mt-4 max-w-3xl text-base leading-8 text-zinc-100">{challenge.summary}</p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <BriefingSection icon={Trophy} label="Awards" items={challenge.awards} />
                <BriefingSection icon={ShieldCheck} label="Interview and payment" items={challenge.notes} />
              </div>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.02] p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                <ClipboardCheck className="h-5 w-5 text-cyan-400" />
              </div>
              <p className="text-xs font-mono uppercase tracking-[0.22em] text-zinc-500">Submission</p>
              <p className="mt-3 text-base leading-8 text-zinc-100">
                Demonstrate a developed solution with test scenarios.
              </p>
            </div>

            <Link
              href="/dashboard"
              className="interactive inline-flex items-center gap-2 self-start rounded-full bg-white px-6 py-3 text-sm font-bold text-black transition-all hover:scale-[1.02] hover:bg-cyan-400"
            >
              <BookOpen className="h-4 w-4" />
              Return to Dashboard
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
