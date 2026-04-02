"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Trophy, Calendar, Code, ChevronRight, LogOut, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import TiltCard from "@/components/TiltCard";
import Marquee from "@/components/Marquee";
import MagneticWrapper from "@/components/MagneticWrapper";
import LandingHeroCountdown from "@/components/LandingHeroCountdown";
import { BrandLogo } from "@/components/Brand";
import { createClient } from "@/lib/supabase/client";
import { checkIsAdmin, getMyParticipant } from "@/lib/db";

interface NavAuthState {
  loading: boolean;
  loggedIn: boolean;
  isAdmin: boolean;
  isRegistered: boolean;
  initials: string | null;
}

export default function LandingPage() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const router = useRouter();
  const [authState, setAuthState] = useState<NavAuthState>({
    loading: true,
    loggedIn: false,
    isAdmin: false,
    isRegistered: false,
    initials: null,
  });
  const [applicationsOpen, setApplicationsOpen] = useState(true);

  useEffect(() => {
    const loadAuth = async () => {
      const supabase = createClient();
      const { data: eventState } = await supabase
        .from("comp_event_state")
        .select("applications_open")
        .eq("id", 1)
        .single();
      if (typeof eventState?.applications_open === "boolean") {
        setApplicationsOpen(eventState.applications_open);
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setAuthState({
          loading: false,
          loggedIn: false,
          isAdmin: false,
          isRegistered: false,
          initials: null,
        });
        return;
      }

      const baseName: string | undefined =
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        `${user.user_metadata?.given_name ?? ""} ${user.user_metadata?.family_name ?? ""}`.trim();

      const name: string = baseName && baseName.length > 0
        ? baseName
        : (user.email ?? "");

      const initials =
        name
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part.charAt(0).toUpperCase())
          .join("") || null;

      const isAdmin = await checkIsAdmin(supabase);
      let isRegistered = false;
      if (!isAdmin) {
        const participant = await getMyParticipant(supabase);
        isRegistered = !!participant;
      }

      setAuthState({
        loading: false,
        loggedIn: true,
        isAdmin,
        isRegistered,
        initials,
      });
    };

    loadAuth();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setAuthState({
      loading: false,
      loggedIn: false,
      isAdmin: false,
      isRegistered: false,
      initials: null,
    });
    router.refresh();
  };

  const textVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
  };

  return (
    <div className="min-h-screen relative overflow-hidden" ref={containerRef}>
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-[-1]">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/20 blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/20 blur-[150px]" />
        <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] rounded-full bg-purple-500/10 blur-[120px]" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 mix-blend-difference">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          <MagneticWrapper>
            <Link
              href="/"
              className="interactive group/logo"
            >
              <BrandLogo className="transition-transform group-hover/logo:scale-[1.03]" markClassName="w-12 h-12 text-cyan-400" textClassName="text-2xl font-black tracking-tighter text-white" />
            </Link>
          </MagneticWrapper>

          <div className="flex items-center gap-4 sm:gap-6">
            {!authState.loggedIn && (
              <>
                <MagneticWrapper>
                  <Link
                    href="/login?mode=signin"
                    className="text-sm font-medium hover:text-cyan-400 transition-colors interactive"
                  >
                    Sign In
                  </Link>
                </MagneticWrapper>
                <MagneticWrapper>
                  <Link
                    href="/login?mode=signup"
                    className="text-sm font-medium bg-white text-black px-6 py-3 rounded-full hover:scale-105 transition-transform interactive"
                  >
                    <span className="sm:hidden">Register</span>
                    <span className="hidden sm:inline">Register Now</span>
                  </Link>
                </MagneticWrapper>
              </>
            )}

            {authState.loggedIn && (
              <>
                {/* Primary action depends on registration/admin status */}
                {authState.isAdmin ? (
                  <MagneticWrapper>
                    <Link
                      href="/admin"
                      className="text-sm font-medium bg-white text-black px-4 py-2 rounded-full hover:scale-105 transition-transform interactive"
                    >
                      Admin
                    </Link>
                  </MagneticWrapper>
                ) : authState.isRegistered ? (
                  <MagneticWrapper>
                    <Link
                      href="/dashboard"
                      className="text-sm font-medium bg-white text-black px-6 py-3 rounded-full hover:scale-105 transition-transform interactive"
                    >
                      <span className="sm:hidden">Dashboard</span>
                      <span className="hidden sm:inline">Go to Dashboard</span>
                    </Link>
                  </MagneticWrapper>
                ) : (
                  <MagneticWrapper>
                    <Link
                      href="/register"
                      className="text-sm font-medium bg-white text-black px-6 py-3 rounded-full hover:scale-105 transition-transform interactive"
                    >
                      <span className="sm:hidden">Register</span>
                      <span className="hidden sm:inline">Apply Now</span>
                    </Link>
                  </MagneticWrapper>
                )}

                {/* User chip + sign out */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 border border-white/10">
                    <div className="w-7 h-7 rounded-full bg-cyan-400 text-black flex items-center justify-center text-xs font-bold">
                      {authState.initials ?? <User className="w-4 h-4" />}
                    </div>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border border-white/20 hover:bg-white/10 transition-colors"
                  >
                    <LogOut className="w-3 h-3" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.main style={{ y, opacity }} className="pt-40 pb-20 px-6 min-h-screen flex flex-col justify-center">
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex flex-col items-start max-w-5xl">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={textVariants}
              className={`inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm mb-12 backdrop-blur-md ${
                applicationsOpen ? "text-cyan-400" : "text-zinc-300"
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    applicationsOpen ? "bg-cyan-400" : "bg-zinc-400"
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    applicationsOpen ? "bg-cyan-500" : "bg-zinc-400"
                  }`}
                />
              </span>
              {applicationsOpen ? "Registration Open for 2026" : "Applications Closed for 2026"}
            </motion.div>

            <motion.h1
              className="text-[8vw] sm:text-[7vw] md:text-[6vw] leading-[0.95] font-black tracking-tighter mb-8"
              initial={{ opacity: 0, clipPath: "polygon(0 100%, 100% 100%, 100% 100%, 0% 100%)" }}
              animate={{ opacity: 1, clipPath: "polygon(0 0%, 100% 0%, 100% 100%, 0% 100%)" }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            >
              COGNITIVE INNOVATION <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500">
                COMPETITION.
              </span>
            </motion.h1>

            <motion.p
              initial="hidden"
              animate="visible"
              variants={textVariants}
              className="text-xl md:text-3xl text-zinc-400 mb-12 max-w-2xl font-light"
            >
              Join the premier week-long competition hosted by CITech OTU. Compete, innovate, and secure your next interview.
            </motion.p>
            <motion.p
              initial="hidden"
              animate="visible"
              variants={textVariants}
              className="text-sm md:text-base text-zinc-500 mb-8 max-w-2xl font-medium border border-white/10 rounded-2xl px-4 py-3 bg-white/[0.03] backdrop-blur-sm"
            >
              Limited to engineering students. The competition runs April 2–9, 2026, including opening and closing ceremonies. Two tracks; winners may be invited to interview for a summer 2026 research role (May–August 2026).
            </motion.p>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={textVariants}
              className="flex flex-col sm:flex-row items-center gap-6"
            >
              <MagneticWrapper>
                <Link
                  href="/register"
                  className="interactive group flex items-center gap-4 bg-white text-black px-8 py-5 rounded-full font-medium text-lg hover:bg-zinc-200 transition-all"
                >
                  Register Now
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                </Link>
              </MagneticWrapper>
              <div className="flex items-center gap-3 text-zinc-400 px-6 py-4 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
                <Calendar className="w-5 h-5 text-cyan-400" />
                <span className="font-mono text-sm tracking-wide">APR 2 — 9, 2026</span>
              </div>
            </motion.div>

            <LandingHeroCountdown />
          </div>
        </div>
      </motion.main>

      {/* Infinite Marquee */}
      <div className="my-20">
        <Marquee text="• COGNITIVE INNOVATION COMPETITION 2026 " />
      </div>

      {/* Prizes Section (3D Tilt Cards) */}
      <div className="py-32 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="mb-20"
          >
            <h2 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6">Massive Prizes</h2>
            <p className="text-2xl text-zinc-400 font-light">Two tracks. Same prizes for each.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <MagneticWrapper className="w-full h-full">
              <div className="group interactive cursor-pointer h-full">
                <TiltCard className="h-full bg-gradient-to-br from-white/[0.05] to-transparent shadow-[0_0_50px_rgba(0,255,204,0.1)] group-hover:shadow-[0_0_80px_rgba(0,255,204,0.2)] transition-shadow duration-500">
                  <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 flex items-center justify-center mb-8 border border-cyan-500/50 shadow-[0_0_20px_rgba(0,255,204,0.3)]">
                    <Trophy className="w-8 h-8 text-cyan-400" />
                  </div>
                  <h3 className="text-3xl font-bold mb-8">Design team 1: $400</h3>
                  <ul className="space-y-4 text-zinc-400 font-medium">
                    <li className="flex items-start gap-3">
                      <div className="p-1 rounded-full bg-cyan-400/10 mt-0.5">
                        <ChevronRight className="w-4 h-4 text-cyan-400" />
                      </div>
                      <span>Interview with the winning teams.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="p-1 rounded-full bg-cyan-400/10 mt-0.5">
                        <ChevronRight className="w-4 h-4 text-cyan-400" />
                      </div>
                      <span>The payment will be for the design work during this period.</span>
                    </li>
                  </ul>
                </TiltCard>
              </div>
            </MagneticWrapper>

            <MagneticWrapper className="w-full h-full">
              <div className="group interactive cursor-pointer h-full">
                <TiltCard className="h-full bg-gradient-to-br from-white/[0.05] to-transparent shadow-[0_0_50px_rgba(59,130,246,0.1)] group-hover:shadow-[0_0_80px_rgba(59,130,246,0.2)] transition-shadow duration-500">
                  <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-8 border border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                    <Code className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-3xl font-bold mb-8">Design team 2: $300</h3>
                  <ul className="space-y-4 text-zinc-400 font-medium">
                    <li className="flex items-start gap-3">
                      <div className="p-1 rounded-full bg-blue-400/10 mt-0.5">
                        <ChevronRight className="w-4 h-4 text-blue-400" />
                      </div>
                      <span>Interview with the winning teams.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="p-1 rounded-full bg-blue-400/10 mt-0.5">
                        <ChevronRight className="w-4 h-4 text-blue-400" />
                      </div>
                      <span>The payment will be for the design work during this period.</span>
                    </li>
                  </ul>
                </TiltCard>
              </div>
            </MagneticWrapper>
          </div>
        </div>
      </div>
      
      <footer className="border-t border-white/10 py-12 text-center text-zinc-600 text-sm font-mono tracking-widest relative z-10 bg-black">
        <p>© 2026 COGNITIVE INNOVATION COMPETITION. ALL RIGHTS RESERVED.</p>
      </footer>
    </div>
  );
}
