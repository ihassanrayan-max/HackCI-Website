"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Github, Trophy, Users, X } from "lucide-react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { startTransition, useCallback, useEffect, useState } from "react";
import {
  WINNER_ENTRIES,
  WINNERS_SECTION_COPY,
  type WinnerEntry,
  type WinnerPlacement,
  type WinnerTrack,
} from "@/lib/winnersContent";

const PLACEMENT_STYLES: Record<
  WinnerPlacement,
  {
    ring: string;
    glow: string;
    badge: string;
    marker: string;
  }
> = {
  "1st": {
    ring: "border-amber-300/25",
    glow: "from-amber-300/18 via-amber-200/8 to-transparent",
    badge: "border-amber-300/30 bg-amber-300/10 text-amber-100",
    marker:
      "bg-gradient-to-br from-amber-200 via-amber-300 to-yellow-500 text-black shadow-[0_0_30px_rgba(251,191,36,0.25)]",
  },
  "2nd": {
    ring: "border-slate-200/20",
    glow: "from-slate-200/16 via-slate-100/8 to-transparent",
    badge: "border-slate-200/25 bg-slate-200/10 text-slate-100",
    marker:
      "bg-gradient-to-br from-slate-100 via-slate-300 to-slate-500 text-slate-950 shadow-[0_0_28px_rgba(226,232,240,0.2)]",
  },
  "3rd": {
    ring: "border-orange-300/25",
    glow: "from-orange-300/18 via-orange-200/8 to-transparent",
    badge: "border-orange-300/30 bg-orange-300/10 text-orange-100",
    marker:
      "bg-gradient-to-br from-orange-200 via-orange-300 to-amber-600 text-black shadow-[0_0_28px_rgba(251,146,60,0.2)]",
  },
  winner: {
    ring: "border-amber-300/25",
    glow: "from-amber-300/18 via-amber-200/8 to-transparent",
    badge: "border-amber-300/30 bg-amber-300/10 text-amber-100",
    marker:
      "bg-gradient-to-br from-amber-200 via-amber-300 to-yellow-500 text-black shadow-[0_0_30px_rgba(251,191,36,0.25)]",
  },
};

const TRACK_META: Record<
  WinnerTrack,
  {
    label: string;
    caption: string;
    heading: string;
    description: string;
  }
> = {
  A: {
    label: "Track A",
    caption: "Winners",
    heading: "Track A Winners",
    description: "Official 2026 ranked winners.",
  },
  B: {
    label: "Track B",
    caption: "Winner",
    heading: "Track B Winner",
    description: "Official 2026 winning team.",
  },
};

const TRACK_A_PODIUM_OFFSETS = {
  second: "lg:pt-24",
  first: "lg:pt-0",
  third: "lg:pt-32",
} as const;

function WinnerPhotoLightbox({
  entry,
  onClose,
}: {
  entry: WinnerEntry | null;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!entry) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [entry, onClose]);

  if (!mounted || !entry?.demoImageUrl) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={`Full-size photo: ${entry.teamName}`}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/92 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close preview"
      />
      <div className="relative z-10 flex max-h-[min(90vh,100dvh)] max-w-[min(95vw,1400px)] flex-col items-center">
        <button
          type="button"
          onClick={onClose}
          className="absolute -right-1 -top-11 z-20 rounded-full border border-white/20 bg-zinc-900/95 p-2.5 text-white shadow-lg transition hover:bg-zinc-800 sm:-right-2 sm:-top-12"
          aria-label="Close preview"
        >
          <X className="h-5 w-5" />
        </button>
        {/* Native img for full-resolution preview without layout constraints from fill/sizes */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={entry.demoImageUrl}
          alt={entry.demoImageAlt ?? `${entry.teamName} with judges`}
          className="max-h-[min(85vh,100dvh)] w-auto max-w-full rounded-lg object-contain shadow-2xl ring-1 ring-white/10"
        />
      </div>
    </div>,
    document.body,
  );
}

function WinnerCard({
  entry,
  featured = false,
  compact = false,
  featuredPhoto = false,
  onImagePreview,
  className = "",
}: {
  entry: WinnerEntry;
  featured?: boolean;
  compact?: boolean;
  /** Wider/taller hero image (Track B spotlight only; podium cards stay uniform). */
  featuredPhoto?: boolean;
  onImagePreview?: (entry: WinnerEntry) => void;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const placementStyle = PLACEMENT_STYLES[entry.placement];

  return (
    <motion.article
      className={`group relative overflow-hidden rounded-[2rem] border bg-white/[0.035] p-6 backdrop-blur-xl sm:p-7 ${placementStyle.ring} ${className}`}
      whileHover={reduceMotion ? undefined : { y: -6, scale: 1.01 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${placementStyle.glow} opacity-90`}
      />
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
      <div className="pointer-events-none absolute right-[-12%] top-[-18%] h-40 w-40 rounded-full bg-white/8 blur-3xl transition-opacity duration-500 group-hover:opacity-80" />

      <div className="relative flex h-full flex-col">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-white/10 bg-black/35 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-zinc-300">
              {entry.trackLabel}
            </span>
            <span
              className={`rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.24em] ${placementStyle.badge}`}
            >
              {entry.placementLabel}
            </span>
          </div>

          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-black tracking-[0.18em] uppercase ${placementStyle.marker}`}
          >
            {entry.placement === "winner"
              ? "1"
              : entry.placement.replace("st", "").replace("nd", "").replace("rd", "")}
          </div>
        </div>

        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.32em] text-zinc-500">
              Winning team
            </p>
            <h3
              className={`max-w-xl font-black tracking-tight text-white ${
                featured ? "text-3xl sm:text-[2.5rem] sm:leading-[1.02]" : "text-2xl sm:text-3xl"
              }`}
            >
              {entry.teamName}
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-[0.98rem]">
              {entry.projectTitle}
            </p>
          </div>

          <div
            className={`hidden rounded-2xl border border-white/10 bg-white/6 p-3 shadow-[0_0_24px_rgba(34,211,238,0.12)] sm:flex ${
              featured ? "text-cyan-100" : "text-zinc-200"
            }`}
          >
            <Trophy className="h-5 w-5" />
          </div>
        </div>

        {entry.demoImageUrl ? (
          <div className="mb-6 overflow-hidden rounded-[1.55rem] border border-white/10 bg-black/20">
            <button
              type="button"
              onClick={() => onImagePreview?.(entry)}
              className={`group/photo relative block w-full cursor-zoom-in overflow-hidden text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${
                featuredPhoto
                  ? "aspect-[16/10] min-h-[220px] lg:aspect-[2/1] lg:min-h-[280px]"
                  : "aspect-[16/9]"
              }`}
              aria-label={`Open full-size photo: ${entry.teamName}`}
            >
              <Image
                src={entry.demoImageUrl}
                alt={entry.demoImageAlt ?? entry.teamName}
                fill
                sizes={
                  featuredPhoto
                    ? "(max-width: 1024px) 100vw, min(80rem, 92vw)"
                    : "(max-width: 1024px) 100vw, 33vw"
                }
                unoptimized={!entry.demoImageUrl.startsWith("/")}
                className="object-cover object-center transition duration-300 group-hover/photo:scale-[1.02]"
              />
              <span
                className="pointer-events-none absolute inset-0 bg-black/0 transition group-hover/photo:bg-black/10"
                aria-hidden
              />
            </button>
          </div>
        ) : null}

        <div className="mb-6 rounded-[1.5rem] border border-white/10 bg-black/20 p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-zinc-400">
            <Users className="h-4 w-4 text-cyan-300" />
            Team members
          </div>
          <div className="flex flex-wrap gap-2.5">
            {entry.members.map((member) =>
              member.linkedinUrl ? (
                <a
                  key={member.name}
                  href={member.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/20 bg-cyan-400/8 px-3 py-2 text-sm font-medium text-cyan-50 transition-colors hover:border-cyan-300/40 hover:bg-cyan-300/12"
                >
                  <span>{member.name}</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              ) : (
                <span
                  key={member.name}
                  className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-zinc-200"
                >
                  {member.name}
                </span>
              ),
            )}
          </div>
        </div>

        <div className="mt-auto rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-zinc-500">
              Project spotlight
            </p>
            {entry.githubUrl ? (
              <a
                href={entry.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 self-start rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2.5 text-sm font-medium text-cyan-50 transition-colors hover:border-cyan-300/40 hover:bg-cyan-300/14"
              >
                <Github className="h-4 w-4" />
                GitHub
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            ) : (
              <span className="inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-zinc-400 opacity-80">
                <Github className="h-4 w-4" />
                GitHub
              </span>
            )}
          </div>
          <p
            className={`w-full text-zinc-300 ${
              compact ? "text-sm leading-6 sm:text-[0.94rem]" : "text-sm leading-7 sm:text-[0.98rem]"
            }`}
          >
            {entry.description}
          </p>
        </div>
      </div>
    </motion.article>
  );
}

function TrackButton({
  track,
  activeTrack,
  onSelect,
}: {
  track: WinnerTrack;
  activeTrack: WinnerTrack;
  onSelect: (track: WinnerTrack) => void;
}) {
  const isActive = activeTrack === track;
  const meta = TRACK_META[track];

  return (
    <button
      type="button"
      onClick={() => onSelect(track)}
      className={`relative flex-1 overflow-hidden rounded-[1.35rem] border px-4 py-4 text-left transition-all sm:px-5 ${
        isActive
          ? "border-cyan-300/30 bg-white/[0.08] shadow-[0_0_32px_rgba(34,211,238,0.12)]"
          : "border-white/10 bg-white/[0.025] hover:bg-white/[0.05]"
      }`}
      aria-pressed={isActive}
    >
      <div className="relative flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-zinc-500">
            {meta.label}
          </p>
          <p className="mt-2 text-lg font-semibold text-white">{meta.caption}</p>
        </div>
        <div
          className={`h-3 w-3 rounded-full transition-all ${
            isActive ? "bg-cyan-300 shadow-[0_0_16px_rgba(103,232,249,0.9)]" : "bg-white/20"
          }`}
        />
      </div>
    </button>
  );
}

function PodiumColumn({
  entry,
  columnClassName = "",
  cardClassName = "",
  onImagePreview,
}: {
  entry: WinnerEntry;
  columnClassName?: string;
  cardClassName?: string;
  onImagePreview?: (entry: WinnerEntry) => void;
}) {
  return (
    <div className={`flex flex-col ${columnClassName}`}>
      <WinnerCard
        entry={entry}
        featured={entry.placement === "1st"}
        compact
        onImagePreview={onImagePreview}
        className={cardClassName}
      />
    </div>
  );
}

function TrackAPodium({ onImagePreview }: { onImagePreview?: (entry: WinnerEntry) => void }) {
  const trackAEntries = WINNER_ENTRIES.filter((entry) => entry.track === "A");
  const firstPlace = trackAEntries.find((entry) => entry.placement === "1st");
  const secondPlace = trackAEntries.find((entry) => entry.placement === "2nd");
  const thirdPlace = trackAEntries.find((entry) => entry.placement === "3rd");

  if (!firstPlace || !secondPlace || !thirdPlace) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-zinc-500">
          {TRACK_META.A.label}
        </p>
        <h3 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
          {TRACK_META.A.heading}
        </h3>
        <p className="mt-3 text-base leading-7 text-zinc-400">{TRACK_META.A.description}</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3 lg:items-start">
        <div className="order-2 lg:order-1">
          <PodiumColumn
            entry={secondPlace}
            columnClassName={TRACK_A_PODIUM_OFFSETS.second}
            onImagePreview={onImagePreview}
          />
        </div>
        <div className="order-1 lg:order-2">
          <PodiumColumn
            entry={firstPlace}
            columnClassName={TRACK_A_PODIUM_OFFSETS.first}
            cardClassName="shadow-[0_0_50px_rgba(251,191,36,0.08)]"
            onImagePreview={onImagePreview}
          />
        </div>
        <div className="order-3">
          <PodiumColumn
            entry={thirdPlace}
            columnClassName={TRACK_A_PODIUM_OFFSETS.third}
            onImagePreview={onImagePreview}
          />
        </div>
      </div>
    </div>
  );
}

function TrackBSpotlight({ onImagePreview }: { onImagePreview?: (entry: WinnerEntry) => void }) {
  const trackBWinner = WINNER_ENTRIES.find((entry) => entry.track === "B");

  if (!trackBWinner) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-zinc-500">
          {TRACK_META.B.label}
        </p>
        <h3 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
          {TRACK_META.B.heading}
        </h3>
        <p className="mt-3 text-base leading-7 text-zinc-400">{TRACK_META.B.description}</p>
      </div>

      <div className="mx-auto max-w-5xl">
        <WinnerCard
          entry={trackBWinner}
          featured
          featuredPhoto
          onImagePreview={onImagePreview}
          className="min-h-[42rem]"
        />
      </div>
    </div>
  );
}

export default function WinnersShowcase() {
  const reduceMotion = useReducedMotion();
  const [activeTrack, setActiveTrack] = useState<WinnerTrack>("A");
  const [previewEntry, setPreviewEntry] = useState<WinnerEntry | null>(null);

  const openImagePreview = useCallback((entry: WinnerEntry) => {
    if (entry.demoImageUrl) setPreviewEntry(entry);
  }, []);

  const closeImagePreview = useCallback(() => {
    setPreviewEntry(null);
  }, []);

  const introVariants = reduceMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.2 } },
      }
    : {
        hidden: { opacity: 0, y: 28 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] as const },
        },
      };

  const gridVariants = reduceMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.2 } },
      }
    : {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.12, delayChildren: 0.08 },
        },
      };

  const cardVariants = reduceMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.2 } },
      }
    : {
        hidden: { opacity: 0, y: 24 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] as const },
        },
      };

  const panelVariants = reduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.15 } },
        exit: { opacity: 0, transition: { duration: 0.1 } },
      }
    : {
        initial: { opacity: 0, y: 16 },
        animate: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const },
        },
        exit: {
          opacity: 0,
          y: -10,
          transition: { duration: 0.22, ease: [0.7, 0, 0.84, 0] as const },
        },
      };

  return (
    <section className="relative z-10 px-6 py-8 sm:py-12 md:py-16">
      <WinnerPhotoLightbox entry={previewEntry} onClose={closeImagePreview} />
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-white/[0.03] px-6 pt-10 pb-16 shadow-[0_0_80px_rgba(34,211,238,0.06)] backdrop-blur-md sm:px-8 sm:pt-12 sm:pb-16 md:px-10 lg:px-12 lg:pb-20">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/45 to-transparent" />
          <div className="pointer-events-none absolute left-[-8%] top-[-12%] h-56 w-56 rounded-full bg-cyan-500/12 blur-[110px]" />
          <div className="pointer-events-none absolute bottom-[-18%] right-[-10%] h-72 w-72 rounded-full bg-blue-500/12 blur-[130px]" />
          <div className="pointer-events-none absolute right-[18%] top-[16%] h-32 w-32 rounded-full bg-amber-300/8 blur-[90px]" />

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-120px" }}
            variants={introVariants}
            className="relative mb-10 max-w-3xl md:mb-12"
          >
            <div className="mb-4 inline-flex items-center gap-3 rounded-full border border-white/10 bg-black/25 px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-cyan-200">
              <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.8)]" />
              {WINNERS_SECTION_COPY.eyebrow}
            </div>
            <h2 className="max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl md:text-6xl">
              {WINNERS_SECTION_COPY.title}
            </h2>
            {WINNERS_SECTION_COPY.description ? (
              <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
                {WINNERS_SECTION_COPY.description}
              </p>
            ) : null}
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={gridVariants}
            className="relative"
          >
            <motion.div variants={cardVariants} className="mb-6 flex flex-col gap-3 sm:flex-row">
              <TrackButton
                track="A"
                activeTrack={activeTrack}
                onSelect={(track) => {
                  startTransition(() => setActiveTrack(track));
                }}
              />
              <TrackButton
                track="B"
                activeTrack={activeTrack}
                onSelect={(track) => {
                  startTransition(() => setActiveTrack(track));
                }}
              />
            </motion.div>

            <AnimatePresence mode="wait" initial={false}>
              {activeTrack === "A" ? (
                <motion.div
                  key="track-a"
                  variants={panelVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <TrackAPodium onImagePreview={openImagePreview} />
                </motion.div>
              ) : (
                <motion.div
                  key="track-b"
                  variants={panelVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <TrackBSpotlight onImagePreview={openImagePreview} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
