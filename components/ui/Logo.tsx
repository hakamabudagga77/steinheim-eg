"use client";

interface LogoProps {
  className?: string;
  color?: "light" | "dark";
  showWave?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeMap = {
  sm: {
    width: "w-[126px]",
    text: "text-[30px]",
    wave: "h-[13px]",
  },
  md: {
    width: "w-[164px]",
    text: "text-[39px]",
    wave: "h-[16px]",
  },
  lg: {
    width: "w-[224px]",
    text: "text-[54px]",
    wave: "h-[22px]",
  },
  xl: {
    width: "w-[316px]",
    text: "text-[76px]",
    wave: "h-[31px]",
  },
};

export default function Logo({
  className = "",
  color = "light",
  showWave = true,
  size = "md",
}: LogoProps) {
  const dimensions = sizeMap[size];
  const tone = color === "light" ? "text-white" : "text-charcoal";

  return (
    <span
      role="img"
      aria-label="Steinheim"
      className={`inline-flex ${dimensions.width} flex-col items-center leading-none ${tone} ${className}`}
    >
      <span className={`font-heading ${dimensions.text} tracking-[-0.06em]`}>
        Steinheim
      </span>
      {showWave ? (
        <svg
          viewBox="0 0 320 52"
          aria-hidden="true"
          className={`-mt-[0.12em] block w-[88%] ${dimensions.wave}`}
          fill="none"
          preserveAspectRatio="none"
        >
          <path
            d="M2 18C54 1 96 6 142 19C190 33 235 33 318 5"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M9 37C67 22 109 24 151 34C203 47 254 47 313 26"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
            opacity="0.82"
          />
        </svg>
      ) : null}
    </span>
  );
}
