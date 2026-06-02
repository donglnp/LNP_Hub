import { useT, formatNum } from "../../../lib/i18n";

export default function Ring({
  value,
  max,
  label,
  unit = "kcal",
  size = 180,
  stroke = 12,
  color = "rgb(var(--arena-amber))",
  trackColor = "rgb(var(--arena-border))",
}) {
  const { lang } = useT();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const dash = c * pct;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={trackColor}
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${dash} ${c}`}
          style={{ transition: "stroke-dasharray 600ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        <p className="font-display text-3xl font-semibold leading-none">
          {formatNum(Math.round(value), lang)}
        </p>
        <p className="text-[10px] tracking-[0.3em] uppercase text-arena-muted mt-1.5">
          {label || `${unit} · ${formatNum(max, lang)}`}
        </p>
      </div>
    </div>
  );
}
