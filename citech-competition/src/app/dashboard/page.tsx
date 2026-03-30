"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  Upload,
  Trophy,
  Users,
  LogOut,
  Medal,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MagneticWrapper from "@/components/MagneticWrapper";
import EventCountdown from "@/components/EventCountdown";
import { BrandLogo } from "@/components/Brand";
import { createClient } from "@/lib/supabase/client";
import {
  getMyParticipant,
  getMySubmission,
  getMyResult,
  upsertSubmission,
  checkIsAdmin,
  type CompParticipant,
  type CompSubmission,
  type CompResult,
} from "@/lib/db";
import {
  mapEventState,
  DEFAULT_EVENT_STATE,
  type EventState,
  PRIZE_MAP,
} from "@/lib/eventState";

export default function DashboardPage() {
  const router = useRouter();
  const [participant, setParticipant] = useState<CompParticipant | null>(null);
  const [submission, setSubmission] = useState<CompSubmission | null>(null);
  const [result, setResult] = useState<CompResult | null>(null);
  const [eventState, setEventState] = useState<EventState>(DEFAULT_EVENT_STATE);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  const [submissionLink, setSubmissionLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState("");

  useEffect(() => {
    const supabase = createClient();

    async function loadData() {
      const p = await getMyParticipant(supabase);
      if (!p) {
        const isAdmin = await checkIsAdmin(supabase);
        router.push(isAdmin ? "/admin" : "/");
        return;
      }
      setParticipant(p);

      const { data: es } = await supabase
        .from("comp_event_state")
        .select("*")
        .eq("id", 1)
        .single();
      if (es) setEventState(mapEventState(es));

      const sub = await getMySubmission(supabase, p.id);
      if (sub) {
        setSubmission(sub);
        setSubmissionLink(sub.drive_link);
      }

      const res = await getMyResult(supabase, p.id);
      if (res) setResult(res);

      setLoading(false);
    }

    loadData();

    const channel = supabase
      .channel("comp_event_state_changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "comp_event_state", filter: "id=eq.1" },
        (payload) => {
          if (payload.new) setEventState(mapEventState(payload.new as any));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [router]);

  const handleSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submissionLink.includes("drive.google.com")) {
      setSubmissionError("Please provide a valid Google Drive link.");
      return;
    }
    if (!participant) return;
    setSubmissionError("");
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const sub = await upsertSubmission(supabase, participant.id, submissionLink);
      setSubmission(sub);
    } catch (err: any) {
      setSubmissionError(err?.message ?? "Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const bentoVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: "spring" as const, damping: 20, stiffness: 100 },
    },
  };

  // Results tile: show to everyone when results are released; otherwise show when they have a submission (pending)
  const showResultsTile =
    eventState.resultsReleased || (!eventState.resultsReleased && submission !== null);

  if (loading || signingOut) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/10 blur-[150px] pointer-events-none" />

      {/* Top Navigation */}
      <nav className="border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link
            href="/"
            className="interactive group/logo"
          >
            <BrandLogo className="transition-transform group-hover/logo:scale-[1.03]" markClassName="w-10 h-10 text-cyan-400" textClassName="text-xl font-black tracking-tighter text-white" />
          </Link>
          <div className="flex items-center gap-4">
            {eventState.teamChangesOpen && (
              <MagneticWrapper>
                <Link
                  href="/team"
                  className="interactive px-5 py-2.5 rounded-full border border-white/10 hover:bg-white/5 transition-colors flex items-center gap-2 text-sm font-medium"
                >
                  <Users className="w-4 h-4" />
                  Team Hub
                </Link>
              </MagneticWrapper>
            )}
            <MagneticWrapper>
              <button
                onClick={handleSignOut}
                className="interactive w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-colors text-zinc-400"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </MagneticWrapper>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tighter mb-4">
            Welcome back,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              {participant?.full_name?.split(" ")[0] ?? "Participant"}
            </span>
          </h1>
          <p className="text-base sm:text-xl text-zinc-400 font-light">Your dashboard for the Cognitive Innovation Competition 2026.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:auto-rows-[240px]">

          {/* Application status */}
          <motion.div
            variants={bentoVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1 }}
            className="md:col-span-2 lg:col-span-3 row-span-1 bg-white/[0.02] border border-white/10 rounded-3xl p-8 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
               {participant?.status === "approved" ? <CheckCircle2 className="w-32 h-32 text-cyan-400" /> : participant?.status === "rejected" ? <AlertCircle className="w-32 h-32 text-red-500" /> : <Clock className="w-32 h-32 text-yellow-400" />}
            </div>

            <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${participant?.status === 'approved' ? 'bg-cyan-400' : participant?.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-400 animate-pulse'}`} />
              Application Status
            </h2>
            <div className={`rounded-2xl border p-6 flex flex-col sm:flex-row items-start gap-5 relative z-10 backdrop-blur-sm ${
              participant?.status === 'approved' 
                ? 'bg-cyan-500/10 border-cyan-500/20' 
                : participant?.status === 'rejected'
                ? 'bg-red-500/10 border-red-500/20'
                : 'bg-yellow-500/10 border-yellow-500/20'
            }`}>
              <div className={`mt-1 shrink-0 p-3 rounded-2xl ${
                participant?.status === 'approved' 
                  ? 'bg-cyan-500/20 text-cyan-400' 
                  : participant?.status === 'rejected'
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-yellow-500/20 text-yellow-400'
              }`}>
                 {participant?.status === "approved" ? <CheckCircle2 className="w-6 h-6" /> : participant?.status === "rejected" ? <AlertCircle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
              </div>
              <div>
                <p className={`text-lg font-bold mb-2 ${
                  participant?.status === 'approved' ? 'text-cyan-400' : participant?.status === 'rejected' ? 'text-red-400' : 'text-yellow-400'
                }`}>
                  {participant?.status === "approved"
                    ? "Approved"
                    : participant?.status === "rejected"
                    ? "Not Accepted"
                    : "Under Review"}
                </p>
                <p className="text-sm text-zinc-300 leading-relaxed max-w-2xl">
                  {participant?.status === "approved"
                    ? "Your application is approved. You can now continue with the competition dashboard actions."
                    : participant?.status === "rejected"
                    ? "Thank you for applying. Unfortunately your application was not accepted this time."
                    : "Your application is currently under review. You will be notified once your application has been approved."}
                </p>
              </div>
            </div>
          </motion.div>

          {participant?.status === "approved" && (
            <>
              {/* Event Date — 1 col */}
              <motion.div
                variants={bentoVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.2 }}
                className="col-span-1 row-span-1 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/20 rounded-3xl p-8 flex flex-col"
              >
                <EventCountdown />
              </motion.div>

              {/* Submission Portal — only shown when submissions are open OR participant already submitted */}
          <AnimatePresence>
            {(eventState.submissionsOpen || submission) && (
              <motion.div
                key="submission-tile"
                variants={bentoVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                transition={{ delay: 0.4 }}
                className="md:col-span-2 lg:col-span-2 row-span-1 bg-white/[0.02] border border-white/10 rounded-3xl p-8 flex flex-col justify-center relative overflow-hidden group"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Upload className="w-5 h-5 text-zinc-400" />
                    Submission Portal
                  </h2>
                  {submission && (
                    <span className="text-xs font-mono text-green-400 bg-green-400/10 border border-green-400/20 px-3 py-1 rounded-full">
                      RECEIVED
                    </span>
                  )}
                </div>

                {submission && !isSubmitting ? (
                  <div className="flex flex-col items-center justify-center flex-1">
                    <div className="flex items-center gap-4 bg-green-500/10 border border-green-500/20 w-full p-4 rounded-2xl">
                      <CheckCircle2 className="w-6 h-6 text-green-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-green-400 font-medium truncate">Submission received successfully</p>
                        <p className="text-xs text-zinc-500 font-mono truncate">{submission.drive_link}</p>
                      </div>
                      {eventState.submissionsOpen && (
                        <button
                          onClick={() => setSubmission(null)}
                          className="text-xs text-zinc-400 hover:text-white transition-colors underline shrink-0"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <form onSubmit={handleSubmission} className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="url"
                        required
                        value={submissionLink}
                        onChange={(e) => { setSubmissionLink(e.target.value); setSubmissionError(""); }}
                        className="flex-1 bg-black border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:border-cyan-500 focus:bg-white/[0.02] transition-all text-sm"
                        placeholder="Paste public Google Drive link..."
                      />
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="interactive flex items-center justify-center gap-2 bg-white text-black font-bold px-6 py-3.5 sm:py-0 rounded-2xl hover:bg-cyan-400 hover:scale-105 transition-all text-sm shrink-0 disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        Submit
                      </button>
                    </form>
                    {submissionError && (
                      <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-red-400 text-xs px-1">
                        {submissionError}
                      </motion.p>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

              {/* Results Tile — shown based on submission + results state */}
          <AnimatePresence>
            {showResultsTile && (
              <motion.div
                key="results-tile"
                variants={bentoVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                transition={{ delay: 0.5 }}
                className="md:col-span-2 lg:col-span-2 row-span-1 bg-zinc-900 border border-yellow-500/30 rounded-3xl p-8 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-cyan-500/10 pointer-events-none" />
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className="flex items-center gap-3 mb-4">
                    <Trophy className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]" />
                    <h2 className="text-xl font-black tracking-tight uppercase">Your Results</h2>
                  </div>

                  {/* Results released + has result = show placement + contact message */}
                  {eventState.resultsReleased && result ? (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                      <div className="bg-black/50 backdrop-blur-md rounded-2xl p-5 border border-white/10 flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center shrink-0">
                          <Medal className="w-7 h-7 text-yellow-400" />
                        </div>
                        <div>
                          <div className="text-xs text-zinc-500 font-mono mb-1">
                            TRACK {result.track} — {result.position === 1 ? "1ST PLACE" : "2ND PLACE"}
                          </div>
                          <div className="text-xl font-black text-white">
                            {result.position === 1 ? "🥇 Winner" : "🥈 Runner-up"}
                          </div>
                          <div className="text-cyan-400 text-sm font-medium mt-1">
                            {PRIZE_MAP[result.position as 1 | 2]}
                          </div>
                        </div>
                      </div>
                      <p className="text-zinc-400 text-sm">
                        You will be contacted on the email you signed up with for your rewards/prizes.
                      </p>
                    </motion.div>
                  ) : eventState.resultsReleased && !result ? (
                    /* Results released but no result — team was not selected */
                    <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center">
                      <div className="text-4xl">🎯</div>
                      <p className="text-zinc-400 text-sm max-w-xs">
                        Thank you for participating. Unfortunately, your team was not selected as a winner this time. We hope to see you again!
                      </p>
                    </div>
                  ) : (
                    /* Results not yet released but submitted — pending */
                    <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center">
                        <Clock className="w-6 h-6 text-yellow-400/70 animate-pulse" />
                      </div>
                      <p className="text-zinc-400 text-sm max-w-xs">
                        Your submission is in. Results are being finalized — check back soon.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
            </>
          )}

        </div>
      </main>
    </div>
  );
}
