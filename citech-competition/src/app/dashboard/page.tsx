"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  Upload,
  Trophy,
  Users,
  User,
  LogOut,
  Code,
  ChevronRight,
  Activity,
  BookOpen,
  Sparkles,
  Medal,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MagneticWrapper from "@/components/MagneticWrapper";
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

const BASIC_RULES = [
  "All work must be original and created during the competition week",
  "Teams may have up to 4 members",
  "Submissions must include a public Google Drive link",
  "Both tracks are open to all participants regardless of university",
  "Judges' decisions are final",
  "Code plagiarism results in immediate disqualification",
];

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
        router.push(isAdmin ? "/admin" : "/register");
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

  const getStepStatus = (step: number) => {
    if (step === 1) return participant ? "completed" : "active";
    if (step === 2) return participant?.status === "approved" ? "completed" : participant?.status === "rejected" ? "rejected" : "active";
    if (step === 3) return eventState.briefingReleased ? "completed" : "active";
    if (step === 4) return submission ? "completed" : eventState.submissionsOpen ? "active" : "pending";
    return "pending";
  };

  const steps = [
    { id: 1, label: "Registered" },
    { id: 2, label: "Approved" },
    { id: 3, label: "Event Started" },
    { id: 4, label: "Submitted" },
  ];

  const progressWidth = submission
    ? "100%"
    : eventState.submissionsOpen
    ? "75%"
    : eventState.briefingReleased
    ? "66%"
    : participant?.status === "approved"
    ? "33%"
    : "10%";

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
          <Link href="/" className="font-bold text-2xl tracking-tighter flex items-center gap-3 interactive group">
            <div className="w-8 h-8 rounded-full bg-cyan-400 group-hover:scale-110 transition-transform" />
            CITech Portal
          </Link>
          <div className="flex items-center gap-4">
            <MagneticWrapper>
              <Link
                href="/profile"
                className="interactive px-5 py-2.5 rounded-full border border-white/10 hover:bg-white/5 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <User className="w-4 h-4" />
                Profile
              </Link>
            </MagneticWrapper>
            <MagneticWrapper>
              <Link
                href="/team"
                className="interactive px-5 py-2.5 rounded-full border border-white/10 hover:bg-white/5 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <Users className="w-4 h-4" />
                Team Hub
              </Link>
            </MagneticWrapper>
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
          <p className="text-base sm:text-xl text-zinc-400 font-light">Your command center for the CITech 2026 competition.</p>
        </motion.div>

        {/* Status banner if pending/rejected */}
        {participant?.status === "pending" && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex items-center gap-3 px-5 py-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl text-yellow-400"
          >
            <Clock className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-bold text-sm">Application Under Review</p>
              <p className="text-xs text-yellow-400/70">You will be notified once your application is approved.</p>
            </div>
          </motion.div>
        )}
        {participant?.status === "rejected" && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex items-center gap-3 px-5 py-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-bold text-sm">Application Not Accepted</p>
              <p className="text-xs text-red-400/70">Thank you for applying. Unfortunately your application was not accepted this time.</p>
            </div>
          </motion.div>
        )}

        {/* Global lock state indicators */}
        <AnimatePresence>
          {(!eventState.applicationsOpen || !eventState.teamChangesOpen) && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mb-8 flex flex-wrap gap-3"
            >
              {!eventState.applicationsOpen && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-300">
                  <Clock className="w-4 h-4 text-zinc-400" />
                  <span>New applications are closed.</span>
                </div>
              )}
              {!eventState.teamChangesOpen && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-300">
                  <Users className="w-4 h-4 text-zinc-400" />
                  <span>Team formation is locked. Your Team Hub is read-only.</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:auto-rows-[240px]">

          {/* Status Tracker — 3 cols */}
          <motion.div
            variants={bentoVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1 }}
            className="md:col-span-2 lg:col-span-3 row-span-1 bg-white/[0.02] border border-white/10 rounded-3xl p-8 relative overflow-hidden group hover:border-cyan-500/30 transition-colors"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Activity className="w-32 h-32 text-cyan-400" />
            </div>
            <h2 className="text-xl font-bold mb-8 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              Mission Status
            </h2>
            <div className="flex items-center justify-between relative z-10">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-white/5 -translate-y-1/2 rounded-full" />
              <motion.div
                className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-cyan-400 to-blue-500 -translate-y-1/2 rounded-full shadow-[0_0_10px_rgba(0,255,204,0.5)]"
                initial={{ width: "0%" }}
                animate={{ width: progressWidth }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />
              {steps.map((step) => {
                const status = getStepStatus(step.id);
                return (
                  <div key={step.id} className="relative z-10 flex flex-col items-center gap-3 sm:gap-4">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className={`w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-colors border
                        ${status === "completed"
                          ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400 backdrop-blur-md"
                          : status === "active"
                          ? "bg-blue-500 text-white border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                          : status === "rejected"
                          ? "bg-red-500/20 border-red-500/50 text-red-400"
                          : "bg-black border-white/10 text-zinc-600"
                        }`}
                    >
                      {status === "completed" ? (
                        <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6" />
                      ) : status === "active" ? (
                        <Clock className="w-4 h-4 sm:w-6 sm:h-6 animate-pulse" />
                      ) : (
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-zinc-600" />
                      )}
                    </motion.div>
                    <span className={`text-xs sm:text-sm font-medium tracking-wide ${
                      status === "active" ? "text-white"
                      : status === "completed" ? "text-cyan-400"
                      : status === "rejected" ? "text-red-400"
                      : "text-zinc-500"
                    }`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Event Date — 1 col */}
          <motion.div
            variants={bentoVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
            className="col-span-1 row-span-1 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/20 rounded-3xl p-8 flex flex-col justify-between"
          >
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 bg-cyan-400/20 rounded-xl flex items-center justify-center border border-cyan-400/30">
                <Code className="w-6 h-6 text-cyan-400" />
              </div>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded">MAR 20–27</span>
            </div>
            <div>
              <h3 className="text-3xl font-black mb-1">7<span className="text-lg font-medium text-zinc-400"> days</span></h3>
              <p className="text-zinc-400 text-sm">Competition duration</p>
            </div>
          </motion.div>

          {/* Briefing Tile — 2 cols, 2 rows */}
          <motion.div
            variants={bentoVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.3 }}
            className="md:col-span-2 row-span-2 bg-white/[0.02] border border-white/10 rounded-3xl p-8 relative overflow-hidden group flex flex-col"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-cyan-400" />
                Briefing
              </h2>
            </div>

            <div className="space-y-5 overflow-y-auto flex-1">
              {/* Always visible: basic rules */}
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4">Competition Rules</h3>
                <ul className="space-y-2.5">
                  {BASIC_RULES.map((rule, i) => (
                    <li key={i} className="flex items-start gap-3 text-zinc-300 text-sm">
                      <ChevronRight className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      {rule}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Detailed briefing — only shown after admin releases; no placeholder shown otherwise */}
              <AnimatePresence>
                {eventState.briefingReleased && (
                  <motion.div
                    key="briefing-content"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/20 rounded-2xl p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                        <h3 className="text-base font-bold text-cyan-400">Track A — Product Innovation</h3>
                      </div>
                      <p className="text-zinc-300 text-sm leading-relaxed">
                        Build a product or service that solves a real-world problem using technology. Focus on user experience, feasibility, and market potential. A 2-minute demo video is required.
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/5 border border-blue-500/20 rounded-2xl p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-blue-400" />
                        <h3 className="text-base font-bold text-blue-400">Track B — Technical Excellence</h3>
                      </div>
                      <p className="text-zinc-300 text-sm leading-relaxed">
                        Demonstrate deep technical mastery through a complex system, algorithm, or infrastructure solution. Emphasis on architecture, performance, and scalability.
                      </p>
                    </div>
                    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
                      <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-3">Judging Criteria</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {[["Innovation", "30%"], ["Execution", "25%"], ["Impact", "25%"], ["Presentation", "20%"]].map(([label, pct]) => (
                          <div key={label} className="flex justify-between items-center bg-white/[0.03] rounded-xl px-3 py-2">
                            <span className="text-zinc-300">{label}</span>
                            <span className="text-cyan-400 font-mono font-bold">{pct}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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
                        <p className="text-sm text-green-400 font-medium truncate">Project successfully transmitted</p>
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

        </div>
      </main>
    </div>
  );
}
