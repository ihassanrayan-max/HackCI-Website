"use client";

import { motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";

export default function Marquee({ text }: { text: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (trackRef.current) {
      // The track holds 16 copies; animate by half the total width so the
      // second set of 8 is identical to the first — producing a seamless loop.
      setOffset(trackRef.current.scrollWidth / 2);
    }
  }, []);

  const copies = Array.from({ length: 16 }, (_, i) => (
    <span key={i} className="mx-4">{text}</span>
  ));

  return (
    <div className="relative w-full overflow-hidden flex whitespace-nowrap py-12 -rotate-2 bg-cyan-400/5 border-y border-cyan-400/20">
      <motion.div
        ref={trackRef}
        className="flex whitespace-nowrap text-4xl md:text-6xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500"
        animate={offset > 0 ? { x: [0, -offset] } : false}
        transition={{
          repeat: Infinity,
          repeatType: "loop",
          duration: 35,
          ease: "linear",
        }}
      >
        {copies}
      </motion.div>
    </div>
  );
}
