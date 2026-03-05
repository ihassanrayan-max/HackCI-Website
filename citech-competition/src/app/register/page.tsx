"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MagneticWrapper from "@/components/MagneticWrapper";
import { createClient } from "@/lib/supabase/client";
import { insertParticipant, checkIsAdmin, getEventState } from "@/lib/db";
import { DEFAULT_EVENT_STATE, mapEventState, type EventState } from "@/lib/eventState";

interface FormData {
  age: string;
  university: string;
  university_name: string;
  studentId: string;
  program: string;
  year: string;
  goals: string;
}

const InputField = ({
  label,
  id,
  name,
  value,
  onChange,
  focusedField,
  setFocusedField,
  ...props
}: any) => (
  <div className="relative group">
    <label
      className={`absolute left-4 transition-all duration-200 pointer-events-none ${
        focusedField === id || value
          ? "top-2 text-xs text-cyan-400"
          : "top-4 text-base text-zinc-500"
      }`}
    >
      {label}
    </label>
    <input
      id={id}
      name={name || id}
      {...props}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocusedField(id)}
      onBlur={() => setFocusedField(null)}
      className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-4 pt-6 pb-2 text-white focus:outline-none focus:border-cyan-500 focus:bg-white/[0.04] transition-all"
    />
    <AnimatePresence>
      {focusedField === id && (
        <motion.div
          layoutId="focus-border"
          className="absolute inset-0 border border-cyan-400 rounded-2xl pointer-events-none shadow-[0_0_20px_rgba(0,255,204,0.1)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        />
      )}
    </AnimatePresence>
  </div>
);

export default function RegisterPage() {
  const router = useRouter();
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isOtuStudent, setIsOtuStudent] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // From Google OAuth
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authUserId, setAuthUserId] = useState("");
  const [authLoading, setAuthLoading] = useState(true);

  const [eventState, setEventState] = useState<EventState>(DEFAULT_EVENT_STATE);
  const [eventStateLoading, setEventStateLoading] = useState(true);

  const [formData, setFormData] = useState<FormData>({
    age: "",
    university: "",
    university_name: "",
    studentId: "",
    program: "",
    year: "",
    goals: "",
  });

  const [nameEditable, setNameEditable] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const isAdmin = await checkIsAdmin(supabase);
        if (isAdmin) {
          router.push("/admin");
          return;
        }
        const name =
          user.user_metadata?.full_name ??
          user.user_metadata?.name ??
          `${user.user_metadata?.given_name ?? ""} ${user.user_metadata?.family_name ?? ""}`.trim() ??
          "";
        setAuthName(name);
        setAuthEmail(user.email ?? "");
        setAuthUserId(user.id);
        // Allow editing the name if it came from email/password sign-up (no OAuth provider)
        const provider = user.app_metadata?.provider;
        if (!name || provider === "email") {
          setNameEditable(true);
        }
      }
      try {
        const es = await getEventState(supabase);
        setEventState(mapEventState(es));
      } catch {
        // If event state cannot be loaded, fall back to defaults (open).
      } finally {
        setEventStateLoading(false);
      }
      setAuthLoading(false);
    });

    const channel = supabase
      .channel("comp_event_state_register")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "comp_event_state", filter: "id=eq.1" },
        (payload) => {
          if (payload.new) {
            setEventState(mapEventState(payload.new as any));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      await insertParticipant(supabase, {
        user_id: authUserId,
        email: authEmail,
        full_name: authName,
        age: parseInt(formData.age, 10),
        university: formData.university as "otu" | "other",
        university_name: formData.university === "other" ? formData.university_name || null : null,
        student_id: formData.university === "otu" ? formData.studentId || null : null,
        program: formData.program,
        year_of_study: formData.year,
        goals: formData.goals || null,
      });

      setIsSubmitting(false);
      setIsSubmitted(true);
      await new Promise((r) => setTimeout(r, 1200));
      router.push("/dashboard");
    } catch (err: any) {
      setIsSubmitting(false);
      if (err?.code === "23505") {
        // Already registered — just redirect
        router.push("/dashboard");
      } else {
        setSubmitError(err?.message ?? "Registration failed. Please try again.");
      }
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6 text-center max-w-sm px-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.1 }}
            className="w-20 h-20 rounded-full bg-cyan-400/20 border border-cyan-400/40 flex items-center justify-center"
          >
            <CheckCircle2 className="w-10 h-10 text-cyan-400" />
          </motion.div>
          <h2 className="text-3xl font-black tracking-tighter">Registration Initialized</h2>
          <p className="text-zinc-400">Redirecting to your dashboard...</p>
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </motion.div>
      </div>
    );
  }

  if (!eventStateLoading && !eventState.applicationsOpen) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center space-y-6">
          <h1 className="text-3xl font-black tracking-tight">Applications Closed</h1>
          <p className="text-zinc-400 text-sm">
            Participant registration for the CITech competition is now closed. If you already registered,
            you can access your dashboard using the link in your confirmation email.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              href="/"
              className="px-4 py-2 rounded-xl border border-white/10 text-sm text-zinc-300 hover:bg-white/5 transition-colors"
            >
              Return home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Left Side: Typography Art */}
      <div className="hidden lg:flex w-5/12 relative overflow-hidden bg-zinc-950 items-center border-r border-white/5 p-12">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent pointer-events-none" />
        <div className="z-10">
          <h1 className="text-[6vw] leading-[0.8] font-black tracking-tighter opacity-10">JOIN</h1>
          <h1 className="text-[6vw] leading-[0.8] font-black tracking-tighter opacity-30">THE</h1>
          <h1 className="text-[6vw] leading-[0.8] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">FUTURE</h1>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="w-full lg:w-7/12 flex flex-col px-6 py-12 sm:px-16 lg:px-24 overflow-y-auto">
        <MagneticWrapper className="w-fit mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-3 text-zinc-400 hover:text-white transition-colors interactive text-sm font-medium tracking-wide uppercase"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </MagneticWrapper>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="max-w-xl w-full"
        >
          <div className="mb-12">
            <h1 className="text-4xl font-bold tracking-tight mb-3">Complete Profile</h1>
            <p className="text-zinc-400 text-lg">Tell us who you are.</p>
          </div>

          {submitError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              {submitError}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="relative">
                <label className="absolute left-4 top-2 text-xs text-zinc-500 z-10 pointer-events-none">Full Name</label>
                <input
                  type="text"
                  value={authName}
                  onChange={nameEditable ? (e) => setAuthName(e.target.value) : undefined}
                  required
                  disabled={!nameEditable}
                  className={`w-full border rounded-2xl px-4 pt-6 pb-2 transition-all ${
                    nameEditable
                      ? "bg-white/[0.02] border-white/10 text-white focus:outline-none focus:border-cyan-500 focus:bg-white/[0.04]"
                      : "bg-white/[0.01] border-white/5 text-zinc-400 cursor-not-allowed"
                  }`}
                />
              </div>
              <div className="relative">
                <label className="absolute left-4 top-2 text-xs text-zinc-500">Email Address</label>
                <input
                  type="email"
                  value={authEmail}
                  disabled
                  className="w-full bg-white/[0.01] border border-white/5 rounded-2xl px-4 pt-6 pb-2 text-zinc-400 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <InputField
                label="Age"
                id="age"
                name="age"
                type="number"
                required
                min="16"
                max="99"
                value={formData.age}
                onChange={(v: string) => setFormData((d) => ({ ...d, age: v }))}
                focusedField={focusedField}
                setFocusedField={setFocusedField}
              />
              <div className="relative group">
                <label className="absolute left-4 top-2 text-xs text-cyan-400 z-10 pointer-events-none">
                  University
                </label>
                <select
                  name="university"
                  required
                  value={formData.university}
                  onChange={(e) => {
                    const v = e.target.value;
                    setIsOtuStudent(v === "otu");
                    setFormData((d) => ({ ...d, university: v }));
                  }}
                  onFocus={() => setFocusedField("uni")}
                  onBlur={() => setFocusedField(null)}
                  className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-4 pt-6 pb-2 text-white focus:outline-none focus:border-cyan-500 focus:bg-white/[0.04] transition-all appearance-none relative z-0"
                >
                  <option value="" className="bg-zinc-900"></option>
                  <option value="otu" className="bg-zinc-900">Ontario Tech University (OTU)</option>
                  <option value="other" className="bg-zinc-900">Other University</option>
                </select>
                <AnimatePresence>
                  {focusedField === "uni" && (
                    <motion.div
                      layoutId="focus-border"
                      className="absolute inset-0 border border-cyan-400 rounded-2xl pointer-events-none shadow-[0_0_20px_rgba(0,255,204,0.1)]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* University name field for non-OTU students */}
            <AnimatePresence>
              {formData.university === "other" && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  className="overflow-hidden"
                >
                  <div className="pt-2">
                    <InputField
                      label="University Name"
                      id="university_name"
                      name="university_name"
                      type="text"
                      required
                      value={formData.university_name}
                      onChange={(v: string) => setFormData((d) => ({ ...d, university_name: v }))}
                      focusedField={focusedField}
                      setFocusedField={setFocusedField}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Student ID for OTU */}
            <AnimatePresence>
              {isOtuStudent && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  className="overflow-hidden"
                >
                  <div className="pt-2">
                    <InputField
                      label="Student ID (OTU)"
                      id="studentId"
                      name="studentId"
                      type="text"
                      required
                      value={formData.studentId}
                      onChange={(v: string) => setFormData((d) => ({ ...d, studentId: v }))}
                      focusedField={focusedField}
                      setFocusedField={setFocusedField}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <InputField
                label="Program of Study"
                id="program"
                name="program"
                type="text"
                required
                value={formData.program}
                onChange={(v: string) => setFormData((d) => ({ ...d, program: v }))}
                focusedField={focusedField}
                setFocusedField={setFocusedField}
              />
              <div className="relative group">
                <label className="absolute left-4 top-2 text-xs text-cyan-400 z-10 pointer-events-none">
                  Year of Study
                </label>
                <select
                  name="year"
                  required
                  value={formData.year}
                  onChange={(e) => setFormData((d) => ({ ...d, year: e.target.value }))}
                  onFocus={() => setFocusedField("year")}
                  onBlur={() => setFocusedField(null)}
                  className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-4 pt-6 pb-2 text-white focus:outline-none focus:border-cyan-500 focus:bg-white/[0.04] transition-all appearance-none relative z-0"
                >
                  <option value="" className="bg-zinc-900"></option>
                  <option value="1" className="bg-zinc-900">1st Year</option>
                  <option value="2" className="bg-zinc-900">2nd Year</option>
                  <option value="3" className="bg-zinc-900">3rd Year</option>
                  <option value="4" className="bg-zinc-900">4th Year</option>
                  <option value="5+" className="bg-zinc-900">5th Year+</option>
                  <option value="grad" className="bg-zinc-900">Graduate</option>
                </select>
                <AnimatePresence>
                  {focusedField === "year" && (
                    <motion.div
                      layoutId="focus-border"
                      className="absolute inset-0 border border-cyan-400 rounded-2xl pointer-events-none shadow-[0_0_20px_rgba(0,255,204,0.1)]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="relative group">
              <label
                className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                  focusedField === "goals" || formData.goals
                    ? "top-2 text-xs text-cyan-400"
                    : "top-4 text-base text-zinc-500"
                }`}
              >
                What do you hope to gain?{" "}
                <span className="opacity-50">(Optional)</span>
              </label>
              <textarea
                id="goals"
                name="goals"
                rows={3}
                value={formData.goals}
                onChange={(e) => setFormData((d) => ({ ...d, goals: e.target.value }))}
                onFocus={() => setFocusedField("goals")}
                onBlur={() => setFocusedField(null)}
                className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-4 pt-8 pb-4 text-white focus:outline-none focus:border-cyan-500 focus:bg-white/[0.04] transition-all resize-none"
              />
              <AnimatePresence>
                {focusedField === "goals" && (
                  <motion.div
                    layoutId="focus-border"
                    className="absolute inset-0 border border-cyan-400 rounded-2xl pointer-events-none shadow-[0_0_20px_rgba(0,255,204,0.1)]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
              </AnimatePresence>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="interactive relative w-full bg-white text-black font-bold py-5 rounded-2xl hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Processing...
                </div>
              ) : (
                "Initialize Registration"
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
