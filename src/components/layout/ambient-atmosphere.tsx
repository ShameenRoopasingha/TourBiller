export function AmbientAtmosphere() {
  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none z-0 select-none"
      aria-hidden="true"
    >
      {/* Sphere 1: Bitgard Matte Orange Core */}
      <div className="absolute -top-[20%] -left-[10%] w-[55vw] h-[55vw] rounded-full bg-primary/8 dark:bg-primary/15 blur-[140px] animate-aurora-slow" />

      {/* Sphere 2: Top Light Pillar (Shader Accent #5227FF) */}
      <div className="absolute top-[10%] -right-[12%] w-[45vw] h-[45vw] rounded-full bg-[#5227FF]/5 dark:bg-[#5227FF]/12 blur-[130px] animate-aurora-reverse" />

      {/* Sphere 3: Bottom Light Pillar (Shader Accent #FF9FFC) */}
      <div className="absolute -bottom-[25%] left-[25%] w-[50vw] h-[50vw] rounded-full bg-[#FF9FFC]/6 dark:bg-[#FF9FFC]/10 blur-[150px]" />

      {/* Subtle Architectural Dot Grid (Fades out radially) */}
      <div className="absolute inset-0 bg-[radial-gradient(#71717a_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.05] dark:opacity-[0.06] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_20%,#000_40%,transparent_100%)]" />

      {/* Anti-Banding SVG Fractal Noise Overlay */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.02] dark:opacity-[0.035] mix-blend-overlay">
        <filter id="vigil-surface-noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves="3"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#vigil-surface-noise)" />
      </svg>
    </div>
  );
}

export const DarkVeil = AmbientAtmosphere;
