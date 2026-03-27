import React from "react";

export function BrandMark({ className = "w-10 h-10 text-cyan-400", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
      {/* Outer C */}
      <path d="M 68 20 A 34 34 0 1 0 68 80" stroke="currentColor" strokeWidth="14" strokeLinecap="butt" />
      
      {/* Circuit lines */}
      <path d="M 28 36 L 36 36 L 44 26 L 52 26" stroke="currentColor" strokeWidth="3.5" strokeLinecap="square" strokeLinejoin="miter" />
      <circle cx="56" cy="26" r="3.5" fill="currentColor" />
      
      <path d="M 24 50 L 46 50" stroke="currentColor" strokeWidth="3.5" strokeLinecap="square" />
      <circle cx="51" cy="50" r="3.5" fill="currentColor" />
      
      <path d="M 28 64 L 36 64 L 44 74 L 52 74" stroke="currentColor" strokeWidth="3.5" strokeLinecap="square" strokeLinejoin="miter" />
      <circle cx="56" cy="74" r="3.5" fill="currentColor" />

      {/* The I segment */}
      <rect x="90" y="20" width="8" height="60" fill="currentColor" />
      
      {/* Broken segments of I */}
      <rect x="78" y="20" width="6" height="15" fill="currentColor" />
      <rect x="78" y="41" width="6" height="6" fill="currentColor" />
      <rect x="78" y="53" width="6" height="6" fill="currentColor" />
      <rect x="78" y="65" width="6" height="15" fill="currentColor" />
    </svg>
  );
}

export function BrandLogo({
  className = "",
  markClassName = "w-8 h-8 text-cyan-400",
  textClassName = "text-xl font-black tracking-tighter text-white",
  showText = true,
}: {
  className?: string;
  markClassName?: string;
  textClassName?: string;
  showText?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative flex items-center justify-center shrink-0">
        {/* Subtle glow behind the mark */}
        <div className="absolute inset-0 bg-cyan-400/20 blur-[12px] rounded-full pointer-events-none" />
        <BrandMark className={`relative z-10 ${markClassName}`} />
      </div>
      {showText && (
        <div className={`flex flex-col justify-center uppercase ${textClassName}`}>
          <span className="leading-none">Cognitive Innovation</span>
          <span className="text-[0.45em] leading-none tracking-[0.2em] text-cyan-400 mt-1 opacity-80">Competition</span>
        </div>
      )}
    </div>
  );
}
