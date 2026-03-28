import React from "react";

export function BrandMark({
  className = "w-10 h-10 text-cyan-400",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="img"
      aria-label="CITech brand mark"
      className={className}
      style={{
        backgroundColor: "currentColor",
        WebkitMaskImage: "url(/brand/icon-white.svg)",
        maskImage: "url(/brand/icon-white.svg)",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
      {...props}
    />
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
