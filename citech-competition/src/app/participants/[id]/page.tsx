import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, User, Mail, Building2, BookOpen, GraduationCap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  getMyParticipant,
  getParticipantById,
  checkIsAdmin,
  type CompParticipant,
} from "@/lib/db";
import MagneticWrapper from "@/components/MagneticWrapper";

const YEAR_LABELS: Record<string, string> = {
  "1": "1st Year",
  "2": "2nd Year",
  "3": "3rd Year",
  "4": "4th Year",
  "5+": "5th Year+",
  grad: "Graduate",
};

export default async function ParticipantProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const me = await getMyParticipant(supabase);
  if (!me) {
    const isAdmin = await checkIsAdmin(supabase);
    if (isAdmin) {
      // Allow admin to view any profile
    } else {
      notFound();
    }
  }

  const participant = await getParticipantById(supabase, id);
  if (!participant) notFound();

  const isAdmin = await checkIsAdmin(supabase);
  const isSelf = me?.id === id;

  const showOptional = isAdmin;
  const universityDisplay =
    participant.university === "otu"
      ? "Ontario Tech University"
      : participant.university_name || "Other";

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="fixed top-[15%] right-[-15%] w-[50%] h-[50%] rounded-full bg-blue-500/8 blur-[130px] pointer-events-none" />
      <div className="fixed bottom-[10%] left-[-10%] w-[35%] h-[35%] rounded-full bg-cyan-500/6 blur-[120px] pointer-events-none" />

      <nav className="border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 h-20 flex items-center">
          <MagneticWrapper>
            <Link
              href="/team"
              className="interactive flex items-center gap-3 text-zinc-400 hover:text-white transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </div>
              <span className="font-bold text-xl tracking-tighter text-white">Team Hub</span>
            </Link>
          </MagneticWrapper>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-14">
        <div className="bg-white/[0.02] border border-white/10 rounded-[2rem] p-8 md:p-10">
          <div className="flex items-center gap-5 mb-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center font-black text-3xl text-cyan-400">
              {participant.full_name?.trim().charAt(0).toUpperCase() || "?"}
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                {participant.full_name?.trim() || "Unknown"}
              </h1>
              {isSelf && (
                <Link
                  href="/profile"
                  className="inline-flex items-center gap-2 mt-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Edit your profile
                </Link>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <Mail className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Email</p>
                <p className="text-white">{participant.email || "—"}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Building2 className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">University</p>
                <p className="text-white">{universityDisplay}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <BookOpen className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Program</p>
                <p className="text-white">{participant.program || "—"}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <GraduationCap className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Year of study</p>
                <p className="text-white">{YEAR_LABELS[participant.year_of_study] || participant.year_of_study || "—"}</p>
              </div>
            </div>

            {!isAdmin && (
              <div className="flex items-start gap-4">
                <User className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Age</p>
                  <p className="text-white">{participant.age ?? "—"}</p>
                </div>
              </div>
            )}

            {showOptional && (
              <>
                {participant.student_id != null && participant.student_id !== "" && (
                  <div className="flex items-start gap-4">
                    <User className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Student ID</p>
                      <p className="text-white">{participant.student_id}</p>
                    </div>
                  </div>
                )}
                {participant.goals != null && participant.goals !== "" && (
                  <div className="flex items-start gap-4">
                    <BookOpen className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Goals (optional)</p>
                      <p className="text-white whitespace-pre-wrap">{participant.goals}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-4">
                  <User className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Status</p>
                    <p className="text-white capitalize">{participant.status}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
