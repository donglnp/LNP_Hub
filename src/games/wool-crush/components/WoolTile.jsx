import { WOOL_COLORS } from "../lib/colors";

export default function WoolTile({ colorId, selected, shaking, onClick }) {
  const color = WOOL_COLORS[colorId] ?? "#888";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`wool ${colorId}`}
      className={`relative aspect-square w-full rounded-md transition-transform duration-150 will-change-transform ${
        selected
          ? "scale-110 z-10 ring-2 ring-white/90 shadow-[0_0_12px_rgba(255,255,255,0.5)]"
          : "hover:scale-105"
      } ${shaking ? "wool-shake" : ""}`}
    >
      <svg viewBox="0 0 100 100" className="wool-pop h-full w-full drop-shadow">
        <circle cx="50" cy="50" r="42" fill={color} />
        <g
          fill="none"
          stroke="rgba(0,0,0,0.18)"
          strokeWidth="3"
          strokeLinecap="round"
        >
          <ellipse cx="50" cy="50" rx="42" ry="19" transform="rotate(32 50 50)" />
          <ellipse cx="50" cy="50" rx="42" ry="19" transform="rotate(-32 50 50)" />
          <path d="M18 44 Q50 22 82 48" />
          <path d="M18 58 Q50 40 82 62" />
        </g>
        <ellipse cx="37" cy="35" rx="11" ry="6" fill="rgba(255,255,255,0.35)" />
      </svg>
    </button>
  );
}
