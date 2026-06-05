import { useEffect, useRef, useState } from "react";
import { useTheme } from "../lib/ThemeContext";

/**
 * Anime.js-style digit roulette readout. Cycles through a small set of
 * "gravity states" and animates each digit by spinning a vertical column
 * of 0-9 to the target.
 */
const STATES = [
  { label: "GRAVITY", value: "0.00", unit: "m/s²" },
  { label: "DRIFT", value: "0.42", unit: "rad" },
  { label: "FLUX", value: "1.18", unit: "T" },
  { label: "ENTROPY", value: "0.07", unit: "" },
  { label: "VELOCITY", value: "9.81", unit: "m/s" },
];

function Digit({ target }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (target === "." || target === " ") {
      el.style.transform = "translateY(0)";
      return;
    }
    const n = parseInt(target, 10);
    if (isNaN(n)) return;
    // each cell is 1em tall — animate to -(n)em
    el.style.transition = "transform 900ms cubic-bezier(.2,.9,.2,1)";
    // wind up: jump forward several rotations
    el.style.transform = `translateY(-${n + 20}em)`;
    const t = setTimeout(() => {
      el.style.transition = "transform 700ms cubic-bezier(.2,.9,.2,1)";
      el.style.transform = `translateY(-${n}em)`;
    }, 30);
    return () => clearTimeout(t);
  }, [target]);

  if (target === "." || target === " ") {
    return <span className="inline-block">{target}</span>;
  }
  return (
    <span
      className="inline-block overflow-hidden align-baseline"
      style={{ height: "1em", lineHeight: "1em", verticalAlign: "baseline" }}
    >
      <span ref={ref} className="inline-block" style={{ willChange: "transform" }}>
        {Array.from({ length: 30 }).map((_, i) => (
          <span key={i} className="block" style={{ height: "1em", lineHeight: "1em" }}>
            {i % 10}
          </span>
        ))}
      </span>
    </span>
  );
}

export default function GravityReadout({ className = "" }) {
  const [idx, setIdx] = useState(0);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % STATES.length), 3400);
    return () => clearInterval(id);
  }, []);
  const s = STATES[idx];
  return (
    <div
      className={
        `font-mono text-[10px] tracking-[0.3em] uppercase ${
          isDark ? "text-white/60" : "text-slate-500"
        } ` + className
      }
    >
      <div className="flex items-baseline gap-2">
        <span
          key={idx}
          className={`inline-block animate-readout-in ${
            isDark ? "text-white/35" : "text-slate-400"
          }`}
        >
          {s.label}
        </span>
        <span className="text-arena-blue/80 text-base tracking-normal normal-case">
          {[...s.value].map((c, i) => (
            <Digit key={`${idx}-${i}`} target={c} />
          ))}
          {s.unit && (
            <span
              key={idx}
              className={`ml-1 inline-block animate-readout-in text-[10px] ${
                isDark ? "text-white/40" : "text-slate-400"
              }`}
            >
              {s.unit}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
