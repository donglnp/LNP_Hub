import { useMemo } from "react";

const SIZE = 360;
const R = SIZE / 2;
const CENTER = R;

function polar(cx, cy, r, deg) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function arcPath(startDeg, endDeg) {
  const [x1, y1] = polar(CENTER, CENTER, R - 4, startDeg);
  const [x2, y2] = polar(CENTER, CENTER, R - 4, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${CENTER} ${CENTER} L ${x1} ${y1} A ${R - 4} ${R - 4} 0 ${large} 1 ${x2} ${y2} Z`;
}

function truncate(s, n) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

export default function Wheel({ options, colors, rotation, spinning, durationMs = 4500 }) {
  const n = options.length;
  const slice = 360 / n;

  const wedges = useMemo(() => {
    // Offset by -slice/2 so the FIRST segment is centered at the top (under the pointer)
    const offset = -slice / 2;
    return options.map((label, i) => {
      const start = i * slice + offset;
      const end = start + slice;
      const mid = start + slice / 2;
      const [tx, ty] = polar(CENTER, CENTER, R * 0.62, mid);
      // Flip text on the bottom half so it stays readable instead of upside down
      const normalized = ((mid % 360) + 360) % 360;
      const flip = normalized > 90 && normalized < 270;
      const textRot = flip ? mid + 180 : mid;
      return {
        d: arcPath(start, end),
        color: colors[i],
        tx,
        ty,
        rot: textRot,
        label: truncate(String(label), n > 12 ? 8 : n > 8 ? 12 : 16),
      };
    });
  }, [options, colors, slice, n]);

  const fontSize = n > 16 ? 9 : n > 12 ? 10 : n > 8 ? 11 : 13;

  const BORDER = 4;
  const OUTER = SIZE + BORDER * 2;
  return (
    <div className="relative" style={{ width: OUTER, height: OUTER }}>
      <div
        className="absolute left-1/2 -translate-x-1/2 z-10"
        style={{
          top: -2,
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
        }}
      >
        <svg width="32" height="36" viewBox="0 0 32 36">
          <polygon
            points="16,32 2,4 30,4"
            fill="rgb(var(--arena-red))"
            stroke="rgb(var(--arena-card))"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div
        className="rounded-full bg-arena-card box-content"
        style={{
          width: SIZE,
          height: SIZE,
          border: `${BORDER}px solid rgb(var(--arena-border))`,
          boxShadow: "0 8px 30px rgb(0 0 0 / 0.25)",
          transform: `rotate(${rotation}deg)`,
          transition: spinning
            ? `transform ${durationMs}ms cubic-bezier(0.16, 0.84, 0.18, 1)`
            : "none",
        }}
      >
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          {wedges.map((w, i) => (
            <g key={i}>
              <path
                d={w.d}
                fill={w.color}
                stroke="rgb(var(--arena-card))"
                strokeWidth="1.5"
              />
              <g transform={`translate(${w.tx}, ${w.ty}) rotate(${w.rot})`}>
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={fontSize}
                  fontWeight="700"
                  fill="rgb(var(--arena-text))"
                  style={{ pointerEvents: "none" }}
                >
                  {w.label}
                </text>
              </g>
            </g>
          ))}
          <circle
            cx={CENTER}
            cy={CENTER}
            r="20"
            fill="rgb(var(--arena-card))"
            stroke="rgb(var(--arena-border))"
            strokeWidth="2"
          />
          <circle
            cx={CENTER}
            cy={CENTER}
            r="6"
            fill="rgb(var(--arena-red) / 0.7)"
          />
        </svg>
      </div>
    </div>
  );
}
