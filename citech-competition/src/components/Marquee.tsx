"use client";

import { motion } from "framer-motion";
import React from "react";

export default function Marquee({ text }: { text: string }) {
  return (
    <div className="relative w-full overflow-hidden flex whitespace-nowrap py-12 -rotate-2 bg-cyan-400/5 border-y border-cyan-400/20">
      <motion.div
        className="flex whitespace-nowrap text-4xl md:text-6xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500"
        animate={{ x: [0, -1035] }}
        transition={{
          repeat: Infinity,
          repeatType: "loop",
          duration: 10,
          ease: "linear",
        }}
      >
        <span className="mx-4">{text}</span>
        <span className="mx-4">{text}</span>
        <span className="mx-4">{text}</span>
        <span className="mx-4">{text}</span>
        <span className="mx-4">{text}</span>
        <span className="mx-4">{text}</span>
        <span className="mx-4">{text}</span>
        <span className="mx-4">{text}</span>
      </motion.div>
    </div>
  );
}
