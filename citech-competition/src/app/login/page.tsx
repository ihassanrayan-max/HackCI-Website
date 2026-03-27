"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, AlertCircle, Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import MagneticWrapper from "@/components/MagneticWrapper";
import { BrandLogo } from "@/components/Brand";
import { createClient } from "@/lib/supabase/client";
import { checkIsAdmin, getMyParticipant } from "@/lib/db";

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

type AuthMode = "signin" | "signup";

function LoginContent() {
  const searchParams = useSearchParams();
  const initialModeParam = searchParams.get("mode");
  const [mode, setMode] = useState<AuthMode>(
    initialModeParam === "signup" ? "signup" : "signin"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const authError = searchParams.get("error");

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError("Failed to connect to Google. Please try again.");
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError("Invalid email or password. Please try again.");
      setIsLoading(false);
      return;
    }
    // Route after sign-in
    const isAdmin = await checkIsAdmin(supabase);
    if (isAdmin) {
      window.location.href = "/admin";
      return;
    }
    const participant = await getMyParticipant(supabase);
    window.location.href = participant ? "/dashboard" : "/";
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    if (!fullName.trim()) {
      setError("Please enter your full name.");
      setIsLoading(false);
      return;
    }
    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (signUpError) {
      if (signUpError.message.toLowerCase().includes("already registered") ||
          signUpError.message.toLowerCase().includes("user already")) {
        setError("An account with this email already exists. Please sign in instead.");
      } else {
        setError(signUpError.message);
      }
      setIsLoading(false);
      return;
    }
    // After sign-up, session is created immediately (email confirmation may be disabled)
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const participant = await getMyParticipant(supabase);
      window.location.href = participant ? "/dashboard" : "/";
    } else {
      // Email confirmation required — show info
      setError(null);
      setIsLoading(false);
      // Reuse error state with a success message styling trick — instead redirect
      window.location.href = "/";
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError(null);
    setFullName("");
    setEmail("");
    setPassword("");
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Left Side: Animated Graphic */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-zinc-950 items-center justify-center border-r border-white/5">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
          className="relative z-10 w-96 h-96 border border-white/10 rounded-full flex items-center justify-center"
        >
          <div className="w-64 h-64 border border-cyan-400/20 rounded-full border-dashed" />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-48 h-48 border border-blue-500/20 rounded-full" />
          </motion.div>
          <div className="absolute text-center text-2xl sm:text-3xl font-black tracking-tighter mix-blend-overlay max-w-[12rem] leading-tight">
            COGNITIVE INNOVATION
          </div>
        </motion.div>
      </div>

      {/* Right Side: Auth Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24 relative">
        <MagneticWrapper className="absolute top-8 left-8 sm:left-16 lg:left-24 z-10">
          <Link
            href="/"
            className="inline-flex items-center gap-3 text-zinc-400 hover:text-white transition-colors interactive text-sm font-medium tracking-wide uppercase"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </MagneticWrapper>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md mx-auto relative z-10"
        >
          <div className="mb-10">
            <BrandLogo className="mb-8" markClassName="w-16 h-16 text-cyan-400" textClassName="text-3xl font-black tracking-tighter text-white" />
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3">
              {mode === "signin" ? "Welcome Back." : "Join Cognitive Innovation Competition."}
            </h1>
            <p className="text-zinc-400 text-lg font-light">
              {mode === "signin"
                ? "Sign in to access your dashboard."
                : "Create an account to register for the competition."}
            </p>
          </div>

          {/* Mode tabs */}
          <div className="flex gap-1 p-1 bg-white/[0.04] border border-white/10 rounded-2xl mb-8">
            <button
              onClick={() => switchMode("signin")}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                mode === "signin"
                  ? "bg-white text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => switchMode("signup")}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                mode === "signup"
                  ? "bg-white text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Sign Up
            </button>
          </div>

          {(authError || error) && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error ?? "Authentication failed. Please try again."}
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {mode === "signin" ? (
              <motion.form
                key="signin"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleEmailSignIn}
                className="space-y-4"
              >
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(null); }}
                    placeholder="Email address"
                    autoComplete="email"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-11 pr-4 py-4 text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 focus:bg-white/[0.05] transition-all text-sm"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(null); }}
                    placeholder="Password"
                    autoComplete="current-password"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-11 pr-12 py-4 text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 focus:bg-white/[0.05] transition-all text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <MagneticWrapper className="w-full">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="interactive w-full flex items-center justify-center gap-3 bg-white text-black px-6 py-4 rounded-2xl font-bold hover:bg-cyan-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : null}
                    {isLoading ? "Signing in..." : "Sign In"}
                  </button>
                </MagneticWrapper>
              </motion.form>
            ) : (
              <motion.form
                key="signup"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleEmailSignUp}
                className="space-y-4"
              >
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => { setFullName(e.target.value); setError(null); }}
                    placeholder="Full name"
                    autoComplete="name"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-11 pr-4 py-4 text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 focus:bg-white/[0.05] transition-all text-sm"
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(null); }}
                    placeholder="Email address"
                    autoComplete="email"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-11 pr-4 py-4 text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 focus:bg-white/[0.05] transition-all text-sm"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(null); }}
                    placeholder="Password (min. 6 characters)"
                    autoComplete="new-password"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-11 pr-12 py-4 text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 focus:bg-white/[0.05] transition-all text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <MagneticWrapper className="w-full">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="interactive w-full flex items-center justify-center gap-3 bg-white text-black px-6 py-4 rounded-2xl font-bold hover:bg-cyan-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : null}
                    {isLoading ? "Creating account..." : "Create Account"}
                  </button>
                </MagneticWrapper>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-zinc-600 text-xs font-mono">OR</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Google OAuth */}
          <MagneticWrapper className="w-full">
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="interactive w-full flex items-center justify-center gap-3 bg-white/[0.05] border border-white/10 text-white px-6 py-4 rounded-2xl font-medium hover:bg-white/[0.1] hover:border-white/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm"
            >
              <GoogleIcon />
              Continue with Google
            </button>
          </MagneticWrapper>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <LoginContent />
    </Suspense>
  );
}
