"use client";

import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MagneticWrapper from "@/components/MagneticWrapper";
import { createClient } from "@/lib/supabase/client";
import {
  getMyParticipant,
  updateMyParticipant,
  checkIsAdmin,
  type CompParticipant,
} from "@/lib/db";

const YEAR_OPTIONS = [
  { value: "1", label: "1st Year" },
  { value: "2", label: "2nd Year" },
  { value: "3", label: "3rd Year" },
  { value: "4", label: "4th Year" },
  { value: "5+", label: "5th Year+" },
  { value: "grad", label: "Graduate" },
];

export default function ProfilePage() {
  const router = useRouter();
  const [participant, setParticipant] = useState<CompParticipant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [university, setUniversity] = useState<"otu" | "other">("otu");
  const [universityName, setUniversityName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [program, setProgram] = useState("");
  const [year, setYear] = useState("");
  const [goals, setGoals] = useState("");

  useEffect(() => {
    const supabase = createClient();
    getMyParticipant(supabase).then(async (p) => {
      if (!p) {
        const isAdmin = await checkIsAdmin(supabase);
        router.push(isAdmin ? "/admin" : "/register");
        return;
      }
      setParticipant(p);
      setFullName(p.full_name ?? "");
      setAge(String(p.age ?? ""));
      setUniversity(p.university ?? "otu");
      setUniversityName(p.university_name ?? "");
      setStudentId(p.student_id ?? "");
      setProgram(p.program ?? "");
      setYear(p.year_of_study ?? "");
      setGoals(p.goals ?? "");
      setLoading(false);
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!participant) return;
    setError(null);
    setSaving(true);

    try {
      const supabase = createClient();
      await updateMyParticipant(supabase, participant.id, {
        full_name: fullName.trim() || undefined,
        age: age ? parseInt(age, 10) : undefined,
        university,
        university_name: university === "other" ? universityName.trim() || null : null,
        student_id: university === "otu" ? studentId.trim() || null : null,
        program: program.trim() || undefined,
        year_of_study: year || undefined,
        goals: goals.trim() || null,
      });
      setParticipant((prev) =>
        prev
          ? {
              ...prev,
              full_name: fullName.trim(),
              age: age ? parseInt(age, 10) : prev.age,
              university,
              university_name: university === "other" ? universityName.trim() || null : null,
              student_id: university === "otu" ? studentId.trim() || null : null,
              program: program.trim(),
              year_of_study: year,
              goals: goals.trim() || null,
            }
          : null
      );
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message ?? "Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="fixed top-[15%] right-[-15%] w-[50%] h-[50%] rounded-full bg-blue-500/8 blur-[130px] pointer-events-none" />
      <div className="fixed bottom-[10%] left-[-10%] w-[35%] h-[35%] rounded-full bg-cyan-500/6 blur-[120px] pointer-events-none" />

      <nav className="border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 h-20 flex items-center">
          <MagneticWrapper>
            <Link
              href="/dashboard"
              className="interactive flex items-center gap-3 text-zinc-400 hover:text-white transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </div>
              <span className="font-bold text-xl tracking-tighter text-white">Edit Profile</span>
            </Link>
          </MagneticWrapper>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-black tracking-tight mb-2">Your Profile</h1>
          <p className="text-zinc-400">Update your information. Teammates can see your name, university, program, and year.</p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 space-y-4">
            <label className="block">
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Full Name</span>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="mt-1.5 w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </label>
            <label className="block">
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Email</span>
              <input
                type="email"
                value={participant?.email ?? ""}
                disabled
                className="mt-1.5 w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 text-zinc-500 cursor-not-allowed"
              />
            </label>
          </div>

          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 space-y-4">
            <label className="block">
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Age</span>
              <input
                type="number"
                min={16}
                max={99}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                required
                className="mt-1.5 w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </label>
            <label className="block">
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">University</span>
              <select
                value={university}
                onChange={(e) => setUniversity(e.target.value as "otu" | "other")}
                required
                className="mt-1.5 w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
              >
                <option value="otu">Ontario Tech University (OTU)</option>
                <option value="other">Other University</option>
              </select>
            </label>
            {university === "other" && (
              <label className="block">
                <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">University Name</span>
                <input
                  type="text"
                  value={universityName}
                  onChange={(e) => setUniversityName(e.target.value)}
                  required={university === "other"}
                  className="mt-1.5 w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </label>
            )}
            {university === "otu" && (
              <label className="block">
                <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Student ID (OTU)</span>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="mt-1.5 w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </label>
            )}
          </div>

          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 space-y-4">
            <label className="block">
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Program of Study</span>
              <input
                type="text"
                value={program}
                onChange={(e) => setProgram(e.target.value)}
                required
                className="mt-1.5 w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </label>
            <label className="block">
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Year of Study</span>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                required
                className="mt-1.5 w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
              >
                <option value="">Select year</option>
                {YEAR_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
                What do you hope to gain? <span className="opacity-50">(Optional)</span>
              </span>
              <textarea
                rows={3}
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                className="mt-1.5 w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors resize-none"
              />
            </label>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={saving}
              className="interactive w-full sm:flex-1 flex items-center justify-center gap-2 bg-white text-black font-bold py-4 rounded-2xl hover:bg-cyan-400 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Save Profile
                </>
              )}
            </button>
            <Link
              href="/dashboard"
              className="w-full sm:w-auto flex items-center justify-center gap-2 py-4 px-6 border border-white/10 rounded-2xl text-white font-bold hover:bg-white/5 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
