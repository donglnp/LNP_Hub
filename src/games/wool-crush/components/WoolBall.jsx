// Presentational wool-ball SVG, reused by the dragon's scales and the tray items.
export default function WoolBall({ color, className = "" }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <circle cx="50" cy="50" r="42" fill={color} />
      <g fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="3" strokeLinecap="round">
        <ellipse cx="50" cy="50" rx="42" ry="19" transform="rotate(32 50 50)" />
        <ellipse cx="50" cy="50" rx="42" ry="19" transform="rotate(-32 50 50)" />
        <path d="M18 44 Q50 22 82 48" />
        <path d="M18 58 Q50 40 82 62" />
      </g>
      <ellipse cx="37" cy="35" rx="11" ry="6" fill="rgba(255,255,255,0.35)" />
    </svg>
  );
}
